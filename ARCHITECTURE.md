# Architecture

## Project Overview

The **250kb Club** is a curated directory of websites whose total page weight
is ≤ 256 KB. It periodically re-verifies member sites via YellowLabTools,
stores results as Zola-flavored Markdown pages, and builds a static site with
Zola. Maintenance (join/update/leave) happens through structured GitHub issues.

---

## Directory Layout

```
.
├── analyser/            # Deno TypeScript analysis engine
│   ├── metrics.ts       # YellowLabTools API client (run/status/results)
│   └── toolkit.ts       # File I/O, URL helpers, retry logic
├── content/             # ~500 auto-generated .md pages (TOML frontmatter)
│   └── _index.md        # Section index: sort_by="weight", paginate_by=1000
├── public/              # Zola build output (one dir per member + static)
├── static/              # Static assets copied to site root
│   ├── favicon.png
│   ├── robots.txt
│   └── *badge*.{png,gif}  # 88×31 & larger member badges (8 files)
├── templates/           # Zola Tera templates
│   ├── base.html        # Full HTML skeleton + inline CSS + analytics
│   ├── index.html       # Homepage: intro, info popup, member <ol>
│   └── page.html        # Per-member detail: stats, badge embed codes
├── .github/ISSUE_TEMPLATE/  # Structured issue forms for membership
├── pages.txt            # Source-of-truth URL list (~457 lines)
├── config.toml           # Zola configuration
├── index.ts              # Deno orchestration script (the analyser CLI)
├── index.d.ts            # Shared TypeScript types
├── refresh-page.sh       # Full pipeline: YLT → analyse → build → commit
├── .woodpecker.yml       # CI: builds site with Zola, deploys to host volume
├── deno.json / deno.lock # Deno import map & lockfile
└── package.json          # npm scripts: dev/build/update-pages/ylt
```

---

## Entry Points

| Mode | Entry | How |
|------|-------|-----|
| **Analyse & update pages** | `index.ts` | `deno run --allow-read --allow-write --allow-net index.ts` (or `yarn update-pages`) |
| **Local dev server** | `config.toml` | `zola serve` (or `yarn dev`) |
| **Production build** | `config.toml` | `zola build` (or `yarn build`) |
| **Full refresh pipeline** | `refresh-page.sh` | Docker YLT → Deno analyse → Zola build → git commit+push |
| **CI deploy** | `.woodpecker.yml` | Runs `zola build -o /mnt/dist --force` on push |
| **YellowLabTools** | Docker | `yarn ylt` starts YLT on port 8383, mounts `./yltresults` |

---

## Key Types (`index.d.ts`)

- **`PageRecord`** — persisted result: `title`, `date`, `updated`, `weight` (bytes), and `extra` (`source`, `ratio`, `size` in KB).
- **`Status`** — YLT job lifecycle: `awaiting | running | complete | failed` + `url`.
- **`Metric`** — YLT results split into `scores` (pageWeight, domComplexity, globalScore, etc.) and `metrics` (body sizes: html, css, js, images, video, fonts, etc.).

---

## Control Flow

### 1. Analysis Pipeline (`index.ts` → `analyser/`)

```
pages.txt ──► index.ts (orchestrator)
                │
                ├─ for each URL: check if existing record < 1 week old
                │     │  (RECHECK_THRESHOLD in index.ts)
                │     │
                │     ├─ [stale/missing] → POST job to YLT (metrics.ts)
                │     │    └─ poll status in batches of 3 (PARALLEL_JOBS)
                │     │       └─ on complete: GET results (metrics.ts)
                │     │
                │     ├─ contentLength > 256 KB (REJECT_THRESHOLD)?
                │     │    └─ yes → removeRecord() (toolkit.ts)
                │     │    └─ no  → writeRecord() (toolkit.ts)
                │     │
                │     └─ [fresh] → skip
                │
                └─ live CLI status table (Cliffy libraries)
```

### 2. Site Build Pipeline (Zola)

```
content/*.md (TOML frontmatter)
       │
       ▼
   Zola (config.toml)
       │
       ├── templates/base.html  (skeleton, inline CSS)
       ├── templates/index.html (paginates _index.md, sort by weight)
       └── templates/page.html  (single member detail)
       │
       ▼
   public/  (static HTML site)
```

### 3. Membership Workflow

```
GitHub Issue (request/update/cancel membership)
       │
       ▼
   Human curator edits pages.txt
       │
       ▼
   refresh-page.sh (or CI) runs analysis → build → deploy
```

---

## Data Flow

```
URLs (pages.txt)
  │
  │  index.ts reads lines starting with "http"
  ▼
YellowLabTools Docker API (localhost:8383)
  │  POST /api/runs         → runId
  │  GET  /api/runs/:runId  → status
  │  GET  /api/results/:runId → Metric JSON
  ▼
index.ts computes:
  - contentSize = htmlSize + imageSize + videoSize
  - ratio = contentSize / bodySize × 100
  - weight = bodySize (from YLT), size = weight / 1024 (KB)
  │
  │  reject if contentLength > 262144 bytes
  ▼
content/<domain>.md  (TOML frontmatter, empty body)
  │
  │  Zola reads frontmatter fields: title, date, updated, weight, extra.*
  ▼
templates/*.html render:
  - index.html:  paginator.pages sorted by weight, shows size + ratio bars
  - page.html:   per-page stats + badge embed snippets
  ▼
public/<domain>/index.html  (final static site, ~500 pages + homepage)
```

**Content size calculation:** `contentSize = htmlSize + imageSize + videoSize`.
This is "actual content" — CSS, JS, fonts count toward total weight but not
content. The displayed `ratio` = contentSize / totalWeight × 100.

---

## External Dependencies

| Dependency | Role | How used |
|------------|------|----------|
| **[Zola](https://getzola.org)** | Static site generator | Reads `content/*.md` + `templates/`, outputs `public/`. Configured via `config.toml`. |
| **[YellowLabTools](https://yellowlab.tools)** | Page weight analysis | Docker container on port 8383. Uses Phantomas. `analyser/metrics.ts` calls its REST API. |
| **[Deno](https://deno.land)** | TypeScript runtime for analyser | Runs `index.ts`. Uses `deno.land/std@0.130.0/encoding/toml.ts` for TOML I/O. Zero npm deps for the analyser. |
| **[@cliffy/ansi & @cliffy/table](https://jsr.io/@cliffy)** | Terminal UI | Coloured status table in `index.ts` during analysis runs. |
| **[GoatCounter](https://goatcounter.com)** | Privacy-friendly analytics | Script tag in `templates/base.html`. |
| **[Woodpecker CI](https://woodpecker-ci.org)** | CI/CD | `.woodpecker.yml` builds site on push, deploys to host volume. |
| **Docker** | Container runtime | Runs YellowLabTools locally (`yarn ylt`). |
| **Node.js / Yarn** | Package manager | Wraps `zola` and `deno` commands as npm scripts. |

---

## Design Decisions

1. **Flat `content/` directory, one .md per site.** Simple file-based database.
   No actual Markdown body — all data lives in TOML frontmatter. Zola treats
   each as a page; `_index.md` provides a paginated listing sorted by `weight`.

2. **256 KB threshold based on `contentLength`, not total transfer.**
   `contentLength` = compressed body size (what actually transits the wire).
   This is the fairest metric for real-world page weight. Checked in
   `index.ts` as `REJECT_THRESHOLD = 262144` bytes.

3. **Content ratio as a quality signal.** The analyser computes
   `htmlSize + imageSize + videoSize` as "content" vs. total weight (which
   includes CSS, JS, fonts, etc.). Higher ratio = less bloat. Displayed as a
   horizontal bar in the member listing.

4. **1-week recheck interval (`RECHECK_THRESHOLD`).** Each page is only
   re-analysed if its record is older than 7 days. Prevents hammering YLT
   and member sites on every run.

5. **TOML frontmatter as the data storage format.** Zola natively understands
   TOML in `.md` files. The analyser writes TOML (via Deno std lib), Zola
   reads it. No database, no JSON files — just Markdown files with metadata
   headers.

6. **Inline CSS in `base.html`.** The entire site's stylesheet lives in a
   single `<style>` tag. Eliminates an external CSS request, keeping the site
   itself lightweight and aligned with the project's philosophy.

7. **No JavaScript on the production site.** (Aside from GoatCounter
   analytics.) The info popup uses a CSS-only `:target` toggle. The site
   practices what it preaches.

8. **`pages.txt` as the human-editable source of truth.** Curators add/remove
   URLs as plain text lines. Only the analyser script mutates `content/`.
   GitHub issue templates provide a structured submission process.

9. **Woodpecker CI (not GitHub Actions) for deployment.** Self-hosted CI
   builds the Zola site and writes directly to a host volume, keeping the
   pipeline under the operator's control.

10. **Badge economy.** Member pages offer 88×31 and larger badges in
    multiple colour schemes. The smallest is a 0.25 KB PNG. Even ASCII text
    badges are provided (~120–260 bytes). All badge images live in `static/`.
