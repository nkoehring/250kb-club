const fs = require('fs')
const phantomas = require('phantomas')
const pageData = require('./src/pages.json')

const INPUT_FILE = './pages.txt'
const OUTPUT_FILE = './src/pages.json'
const RECHECK_THRESHOLD = 60*60*24*7*1000 // recheck pages older than 1 week

function calcWeights (url, metrics) {
  const m = metrics
  const extraWeight = m.cssSize + m.jsSize + m.webfontSize + m.otherSize
  const contentWeight = m.htmlSize + m.jsonSize + m.imageSize + m.base64Size + m.videoSize

  return { url, contentWeight, extraWeight, stamp: Date.now() }
}

async function generateMetrics (urls) {
  console.debug('Checking', urls)
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
        console.debug('skipping known URL', url)
        metricsList.push(keyedPageData[url]) // push old data to list
        continue
      }
    }
    try {
      console.debug('fetching and analyzing', url)
      const results = await phantomas(url)
      metricsList.push(calcWeights(url, results.getMetrics()))
    } catch(error) {
      console.error(`failed to analyze ${url}`, error)
    }
  }

  try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(metricsList))
  } catch (err) {
    console.error(`ERROR: failed to write results to ${OUTPUT_FILE}`, err)
  }
}

try {
  const rawString = fs.readFileSync(INPUT_FILE, 'utf8')
  const urls = rawString.split('\n').filter(line => line.startsWith('http'))
  generateMetrics(urls)
} catch (err) {
  console.error(`ERROR: failed to read page list from ${INPUT_FILE}`, err)
}
