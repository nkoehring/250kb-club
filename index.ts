import { Table } from '@cliffy/table'
import { tty } from '@cliffy/ansi/tty'
import { colors } from '@cliffy/ansi/colors'

import './index.d.ts'
import {
  url2title,
  getPageRecord,
  writeRecord,
  removeRecord,
} from './analyser/toolkit.ts'
import {
  requestMetricsRun,
  checkStatus,
  retrieveMetrics,
} from './analyser/metrics.ts'

const debug = Deno.env.get('DEBUG') !== undefined
if (!debug) console.debug = () => {} // supress debug messages

const white = (output: string | number) => colors.white(` ${output} `)
const whiteHd = (output: string | number) => colors.bgWhite.bold.black(` ${output} `)
const red = (output: string | number) => colors.red(` ${output} `)
const redHd = (output: string | number) => colors.bgRed.bold.black(` ${output} `)
const yellow = (output: string | number) => colors.yellow(` ${output} `)
const yellowHd = (output: string | number) => colors.bgYellow.bold.black(` ${output} `)
const blue = (output: string | number) => colors.blue(` ${output} `)
const blueHd = (output: string | number) => colors.bgBlue.bold.black(` ${output} `)

const INPUT_FILE = Deno.args[0] ?? './pages.txt'
const OUTPUT_PATH = Deno.args[1] ?? './content' // results are written here
const RECHECK_THRESHOLD = 60 * 60 * 24 * 7 * 1000 // recheck pages older than 1 week
const REJECT_THRESHOLD = 262144 // 256KB (duh)
const PARALLEL_JOBS = 3 // max YLT jobs

const now = Date.now()
const pages = await getPageList() // all pages

const statistics = {
  total: pages.length,
  checked: 0,
  updated: [] as { url: string, weight: number }[],
  rejected: [] as { url: string, weight: number }[],
  errors: [] as string[],
}

async function getPageList(): Promise<string[]> {
  const inputContent = await Deno.readTextFile(INPUT_FILE)
  return inputContent.split('\n').filter((line) => line.startsWith('http'))
}

async function updateRecord(runId: string, url: string): Promise<boolean> {
  const oldRecord = await getPageRecord(url, OUTPUT_PATH)
  const metrics = await retrieveMetrics(runId)

  if (!metrics) {
    statistics.errors.push(`Failed to retrieve results for ${url} (run id: ${runId})`)
    console.debug(red("failed to retrieve results"), "for", blue(url), runId)
    return false
  }

  // poor mans toISODateString
  const now = new Date().toISOString().split("T")[0]
  const weight = metrics.metrics.contentLength

  if (weight > REJECT_THRESHOLD) {
    statistics.rejected.push({ url, weight: Math.round(weight / 1024) })
    console.debug(url, red("rejected!"), "Weighs", Math.round(weight / 1024), "kb")
    if (oldRecord) {
      console.debug("Removing record at", OUTPUT_PATH)
      removeRecord(url, OUTPUT_PATH).catch(() => {
        statistics.errors.push('Failed to remove', OUTPUT_PATH)
        console.debug(red("Failed to remove old record"), "of rejected url", url)
      })
    }
    return false
  }
  const { htmlSize, imageSize, videoSize } = metrics.metrics
  const contentSize = htmlSize + imageSize + videoSize

  const record: PageRecord = {
    title: url2title(url),
    date: oldRecord === null ? now : oldRecord.date,
    updated: now,
    weight,
    extra: {
      source: url,
      ratio: Math.round(contentSize / weight * 100),
      size: Math.round(weight / 1024),
    },
  }

  const success = await writeRecord(record, url, OUTPUT_PATH)

  if (success) {
    statistics.updated.push({ url, weight })
    console.debug(blue(url), white("successfully updated!"))
  } else {
    statistics.errors.push(`Failed to write record for ${url}`)
    console.debug(blue(url), red("record could not be written!"))
  }

  return true
}

async function checkPage(url: string) {
  const record = await getPageRecord(url, OUTPUT_PATH)
  const lastUpdated = Date.parse(record?.updated || "")
  const needsCheck = !record || now - lastUpdated > RECHECK_THRESHOLD

  if (!needsCheck) {
    statistics.checked++
    console.debug(blue(url), white("is up-to-date"))
    return true
  }

  const runId = await requestMetricsRun(url)
  if (!runId) {
    statistics.errors.push(`Failed to run metric for ${url}`)
    console.debug(blue(url), red("getting metrics failed!"))
    return false
  }

  console.debug(blue(url), white("new or outdated,"), "runId is", runId)
  return runId
}

function sleep(duration: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), duration)
  })
}

function updateStatusScreen() {
  const { total, checked, updated, rejected, errors } = statistics

  const tableOutput = new Table(
    [whiteHd('total'), whiteHd('checked'), blueHd('added/updated'), yellowHd('rejected'), redHd('errors')],
    [white(total), white(checked), blue(updated.length), yellow(rejected.length), red(errors.length)],
  )

  tty.cursorLeft.cursorUp.eraseLine()
  tty.cursorLeft.cursorUp.eraseLine()
  console.log(tableOutput.toString())
}

function showStatistics() {
  console.log(new Table(
    ...statistics.rejected.map((page) => [yellowHd('Rejected'), page.url, `${red(page.weight)}kb`]),
  ).toString())

  console.log(new Table(
    ...statistics.errors.map((err) => [redHd('Error'), err]),
  ).toString())
}

async function handleBatch() {
  if (!debug) updateStatusScreen()
  if (!pages.length) return showStatistics() // done, yeah!

  const batch = pages.splice(0, PARALLEL_JOBS)
  const jobs = batch.map((url) => checkPage(url))

  while (jobs.length) {
    // take the first job and check
    // if the check fails, it will be added back to the end of the list
    const job = jobs.shift()
    const runId = await job

    // page is up-to-date or YLT has an error
    if (!job || runId === undefined || runId === true || runId === false) continue

    // TODO: handle failures more gracefully
    const { url, status } = await checkStatus(runId)

    if (status === "failed") {
      statistics.errors.push(`YLT analysis failed for ${url} (run id: ${runId})`)
      console.debug(blue(url), red("YLT analysis failed"))
      continue
    } else if (status === "complete") {
      console.debug(blue(url), blue("updating record..."))
      await updateRecord(runId, url)
      continue
    } else {
      console.debug(blue(url), white("job incomplete, pushing back"))
      // not done yet, add it back
      jobs.push(job)
      // wait a bit before checking again
      await sleep(1000)
    }
  }

  handleBatch()
}

console.log('Starting...')
handleBatch()
