const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN')
if (!GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN environment variable is required')
  Deno.exit(1)
}

const repo = Deno.args[0] ?? 'nkoehring/250kb-club'

interface ReviewEntry {
  url: string
  issue: number
  title: string
}

const ACCEPTED_BODY = `🎉 **Your site has been added to the 250kb Club!**

It will be listed at {CLUBURL} after the next deployment and will be periodically re-checked to ensure it stays under the 256 KB threshold.

Thanks for contributing!`

const REJECTED_BODY = `Thanks for your submission! Unfortunately, your site doesn't meet the requirements for inclusion right now.

Feel free to work on it and submit again when it's ready.`

let reviewData: ReviewEntry[]
try {
  reviewData = JSON.parse(await Deno.readTextFile('review-issues.json'))
} catch {
  console.error('review-issues.json not found. Run review:extract first.')
  Deno.exit(1)
}

let pagesContent: string
try {
  pagesContent = await Deno.readTextFile('pages.txt')
} catch {
  console.error('pages.txt not found.')
  Deno.exit(1)
}

const acceptedUrls = new Set(
  pagesContent.split('\n').filter((line) => line.startsWith('http'))
)

async function postComment(issueNumber: number, body: string): Promise<boolean> {
  const url = `https://api.github.com/repos/${repo}/issues/${issueNumber}/comments`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  })
  return response.ok
}

async function closeIssue(issueNumber: number): Promise<boolean> {
  const url = `https://api.github.com/repos/${repo}/issues/${issueNumber}`
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ state: 'closed' }),
  })
  return response.ok
}

for (const entry of reviewData) {
  const accepted = acceptedUrls.has(entry.url)

  let body
  if (accepted) {
    const clubUrl = `https://250kb.club/${entry.url.replace(/^https?:\/\//,'').replace(/\/$/,'').replaceAll(/[.\/_]/g,'-')}/`
    body = ACCEPTED_BODY.replace('{CLUBURL}', clubUrl)
  } else {
    body = REJECTED_BODY
  }

  const commented = await postComment(entry.issue, body)
  if (!commented) {
    console.error(`Failed to comment on #${entry.issue}`)
    continue
  }

  const closed = await closeIssue(entry.issue)
  if (!closed) {
    console.error(`Failed to close #${entry.issue}`)
    continue
  }

  console.log(`${accepted ? '✅' : '❌'} #${entry.issue}: ${entry.url}`)
}

console.log('Done!')
