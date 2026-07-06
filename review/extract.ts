import '../index.d.ts'

const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN')
if (!GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN environment variable is required')
  Deno.exit(1)
}

const repo = Deno.args[0] ?? 'nkoehring/250kb-club'

interface GhIssue {
  number: number
  title: string
  body: string | null
  pull_request?: unknown
}

interface ReviewEntry {
  url: string
  issue: number
  title: string
}

async function fetchIssues(repo: string): Promise<GhIssue[]> {
  const url = `https://api.github.com/repos/${repo}/issues?labels=Membership+Request&state=open&per_page=100`
  const response = await fetch(url, {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  })

  if (!response.ok) {
    console.error(`GitHub API error: ${response.status} ${await response.text()}`)
    Deno.exit(1)
  }

  return response.json()
}

function extractUrl(issue: GhIssue): string | null {
  const body = issue.body || ''

  const fieldMatch = body.match(/Which URL.*?\n+(https?:\/\/[^\s\n]+)/i)
  if (fieldMatch) return fieldMatch[1]

  const anyUrlMatch = body.match(/https?:\/\/[^\s\n]+/)
  if (anyUrlMatch) return anyUrlMatch[0]

  return null
}

const issues = await fetchIssues(repo)
const entries: ReviewEntry[] = []

for (const issue of issues) {
  if (issue.pull_request) continue

  const url = extractUrl(issue)
  if (url) {
    entries.push({ url, issue: issue.number, title: issue.title })
  } else {
    console.warn(`#${issue.number}: no URL found in issue body`)
  }
}

const txtContent = entries.map((e) => e.url).join('\n') + '\n'
await Deno.writeTextFile('pages.review.txt', txtContent)
await Deno.writeTextFile('review-issues.json', JSON.stringify(entries, null, 2))

console.log(`Extracted ${entries.length} URLs from ${issues.length} issues.`)
console.log('Written pages.review.txt and review-issues.json')