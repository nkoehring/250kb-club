import { parse as tomlParse, stringify as tomlStringify } from "https://deno.land/std@0.130.0/encoding/toml.ts"

const reFrontmatter = /^\+\+\+([\s\S]*)^\+\+\+$([\s\S]*)/m;

export function url2title (url: string): string {
  return url
    .replace(/^https?:\/\//, '') // remove leading http(s)://
    .replace(/\/$/, '')          // remove trailing slash
}

// gets an URL like https://foo.bar and returns ./content/foo_baz.md
function url2filepath (url: string, output_path: string): string {
  const filename = url2title(url)
    .replaceAll(/[\.\/]/g, '_')  // replace dots and slashes with underscores
  return `${output_path}/${filename}.md`
}

// deprecated in deno std, but also simple to replicate
// see: https://deno.land/std@0.130.0/fs/exists.ts
async function exists (path: string): Promise<boolean> {
  try {
    return !!(await Deno.lstat(path))
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) return false
    throw err
  }
}

// checks if URL has a record already and returns time since last check or null
export async function getPageRecord (url: string, output_path: string): Promise<PageRecord|null> {
  const path = url2filepath(url, output_path)
  const hasRecord = await exists(path)

  if (!hasRecord) return null

  const fileContents = await Deno.readTextFile(path)
  const match = fileContents.match(reFrontmatter)
  if (!match) return null // that should never happen but who knows
  return tomlParse(match[1].trim()) as PageRecord
}

export async function writeRecord (record: PageRecord, url: string, output_path: string): Promise<boolean> {
  const path = url2filepath(url, output_path)
  const toml = tomlStringify(record)

  try {
    await Deno.writeTextFile(path, `+++\n${toml}+++\n`)
    return true
  } catch {
    return false
  }
}

function delay (ms: number): Promise<unknown> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retryFetch (url: string, retries=3, msDelay=1000): Promise<any> {
  try {
    const response = await fetch(url)
    if (!response.ok) return false
    const json = await response.json()
    return json
  } catch (err) {
    if (retries > 0) {
      console.warn(`Failed to fetch ${url}, retrying in ${msDelay}ms.`)
      await delay(msDelay)
      return retryFetch(url, retries - 1, msDelay)
    } else {
      console.error(`Fetching ${url} failed too often. Giving up.`)
      return false
    }
  }
}
