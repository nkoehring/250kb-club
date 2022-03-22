import './index.d.ts'
import { url2title, getPageRecord, writeRecord } from './analyser/toolkit.ts'
import { requestMetricsRun, checkStatus, retrieveMetrics } from './analyser/metrics.ts'

const INPUT_FILE = Deno.args[0] ?? './pages.txt'
const OUTPUT_PATH = Deno.args[1] ?? './content' // results are written here
const RECHECK_THRESHOLD = 60*60*24*7*1000 // recheck pages older than 1 week
const REJECT_THRESHOLD = 262144 // 256kb (duh)

async function getPageList (): Promise<string[]> {
  const inputContent = await Deno.readTextFile(INPUT_FILE)
  return inputContent.split('\n').filter(line => line.startsWith('http'))
}

const now = Date.now()
const pages = await getPageList()
const pagesToUpdate: string[] = []

pages.forEach(async (url) => {
  const record = await getPageRecord(url, OUTPUT_PATH)
  const lastUpdated = Date.parse(record?.updated || '')
  const needsCheck = !record || (now - lastUpdated) > RECHECK_THRESHOLD

  if (!needsCheck) {
    console.log(url, 'is up-to-date')
    return
  }

  const runId = await requestMetricsRun(url)
  if (runId) {
    console.log(url, 'new or outdated, runId is', runId)
    pagesToUpdate.push(runId)
  }

})

async function updateRecords () {
  if (pagesToUpdate.length === 0) return // done, yeah!

  const runId = pagesToUpdate.at(-1) || '' // make tsc happy
  const { url, status } = await checkStatus(runId)

  // TODO: handle failures more gracefully
  if (status === 'failed') {
    pagesToUpdate.pop()
    console.log(url, 'analysis failed')
  } else if (status === 'complete') {
    pagesToUpdate.pop()
    const oldRecord = await getPageRecord(url, OUTPUT_PATH)
    const metrics = await retrieveMetrics(runId)

    if (metrics) {
      // poor mans toISODateString
      const now = (new Date()).toISOString().split('T')[0]

      const weight = metrics.metrics.contentLength
      const ratio = Math.round((metrics.metrics.htmlSize / weight) * 100)

      if (weight > REJECT_THRESHOLD) {
        console.log(url, 'is not allowed in, weighs', Math.round(weight / 1024), 'kb')
      }

      const record: PageRecord = {
        title: url2title(url),
        date: oldRecord === null ? now : oldRecord.date,
        updated: now,
        weight,
        extra: {
          source: url,
          ratio,
          size: Math.round(weight / 1024)
        }
      }

      // TODO: check success
      await writeRecord(record, url, OUTPUT_PATH)
      console.log(url, 'updated')
    } else {
      console.error('failed to retrieve results for', url, runId)
    }
  }
  setTimeout(() => updateRecords(), 500) // run again until the list is empty
}

setTimeout(() => updateRecords(), 1000)
