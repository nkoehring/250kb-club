import fs from 'fs'
import chalk from 'chalk'
import phantomas from 'phantomas'
import pageData from './src/components/pages.mjs'

const INPUT_FILE = './pages.txt'
const OUTPUT_FILE = './src/components/pages.mjs'
const RECHECK_THRESHOLD = 60*60*24*7*1000 // recheck pages older than 1 week
const REJECT_THRESHOLD = 256000

const LOGGING_PREFIXES = {
  info: `[${chalk.bold.white('II')}]`,
  warn: `[${chalk.bold.yellow('WW')}]`,
  error: `[${chalk.bold.red('EE')}]`,
  debug: `[${chalk.bold.white('DD')}]`,
}

function log (level='info') {
  const args = [...arguments].slice(1)
  let prefix = LOGGING_PREFIXES[level]
  console.log(prefix, ...args)
}
function info () { log('info', ...arguments) }
function warn () { log('warn', ...arguments) }
function error () { log('error', ...arguments) }
function debug () { log('debug', ...arguments) }

function calcWeights (url, m) {
  const extraWeight = m.cssSize + m.jsSize + m.webfontSize + m.otherSize
  const contentWeight = m.htmlSize + m.jsonSize + m.imageSize + m.base64Size + m.videoSize

  if (m.contentSize > REJECT_THRESHOLD) {
    warn(url, 'oversized by', m.contentSize - REJECT_THRESHOLD)
  }

  return { url, contentWeight, extraWeight, stamp: Date.now() }
}

async function generateMetrics (urls) {
  debug('Checking', urls)
  const metricsList = []
  const keyedPageData = pageData.reduce((acc, page) => {
    // stores url/stamp pairs to decide for recheck
    acc[page.url] = page
    return acc
  }, {})
  const knownURLs = Object.keys(keyedPageData)
  const now = Date.now()

  for (const url of urls) {
    if (knownURLs.indexOf(url) >= 0) {
      if (now - keyedPageData[url].stamp < RECHECK_THRESHOLD) {
        debug('skipping known URL', url)
        metricsList.push(keyedPageData[url]) // push old data to list
        continue
      }
    }
    try {
      debug('fetching and analyzing', url)
      const results = await phantomas(url)
      const weights = calcWeights(url, results.getMetrics())
      metricsList.push(weights) // TODO: what to do with oversized pages?
    } catch(err) {
      error(`failed to analyze ${url}`, err)
    }
  }

  try {
    // TODO: poor mans JSON to JS converter?
    fs.writeFileSync(OUTPUT_FILE, 'export default ' + JSON.stringify(metricsList))
  } catch (err) {
    error(`failed to write results to ${OUTPUT_FILE}`, err)
  }
}

try {
  const rawString = fs.readFileSync(INPUT_FILE, 'utf8')
  const urls = rawString.split('\n').filter(line => line.startsWith('http'))
  generateMetrics(urls)
} catch (err) {
  error(`failed to read page list from ${INPUT_FILE}`, err)
}
