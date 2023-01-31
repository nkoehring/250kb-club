import "./index.d.ts";
import {
  url2title,
  getPageRecord,
  writeRecord,
  removeRecord,
} from "./analyser/toolkit.ts";
import {
  requestMetricsRun,
  checkStatus,
  retrieveMetrics,
} from "./analyser/metrics.ts";

const INPUT_FILE = Deno.args[0] ?? "./pages.txt";
const OUTPUT_PATH = Deno.args[1] ?? "./content"; // results are written here
const RECHECK_THRESHOLD = 60 * 60 * 24 * 7 * 1000; // recheck pages older than 1 week
const REJECT_THRESHOLD = 262144; // 256kb (duh)
const PARALLEL_JOBS = 3; // max YLT jobs

const now = Date.now();
const pages = await getPageList(); // all pages
const pagesUpdating: string[] = []; // currently running ylt jobs

async function getPageList(): Promise<string[]> {
  const inputContent = await Deno.readTextFile(INPUT_FILE);
  return inputContent.split("\n").filter((line) => line.startsWith("http"));
}

async function updateRecord(runId: string, url: string): Promise<boolean> {
  const oldRecord = await getPageRecord(url, OUTPUT_PATH);
  const metrics = await retrieveMetrics(runId);

  if (!metrics) {
    console.error("failed to retrieve results for", url, runId);
    return false;
  }

  // poor mans toISODateString
  const now = new Date().toISOString().split("T")[0];

  const weight = metrics.metrics.contentLength;
  const ratio = Math.round((metrics.metrics.htmlSize / weight) * 100);

  if (weight > REJECT_THRESHOLD) {
    console.log(url, "rejected! Weighs", Math.round(weight / 1024), "kb");
    if (oldRecord) {
      removeRecord(url, OUTPUT_PATH).catch(() => {
        console.error("Failed to remove old record of rejected url", url);
      });
    }
    return false;
  }

  const record: PageRecord = {
    title: url2title(url),
    date: oldRecord === null ? now : oldRecord.date,
    updated: now,
    weight,
    extra: {
      source: url,
      ratio,
      size: Math.round(weight / 1024),
    },
  };

  const success = await writeRecord(record, url, OUTPUT_PATH);

  if (success) {
    console.log(url, "successfully updated");
  } else {
    console.error(url, "record could not be written!");
  }
}

async function checkPage(url: string) {
  const record = await getPageRecord(url, OUTPUT_PATH);
  const lastUpdated = Date.parse(record?.updated || "");
  const needsCheck = !record || now - lastUpdated > RECHECK_THRESHOLD;

  if (!needsCheck) {
    console.log(url, "is up-to-date");
    return true;
  }

  const runId = await requestMetricsRun(url);
  if (!runId) {
    console.error(url, "updating failed!");
    return false;
  }

  console.log(url, "new or outdated, runId is", runId);
  return runId;
}

function sleep(duration: number) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), duration);
  });
}

async function handleBatch() {
  if (!pages.length) return; // done, yeah!

  const batch = pages.splice(0, PARALLEL_JOBS);
  const jobs = batch.map((url) => checkPage(url));

  while (jobs.length) {
    // take the first job and check
    // if the check fails, it will be added back to the end of the list
    const runId = await jobs.shift();

    // page is up-to-date or YLT has an error
    if (runId === true || runId === false) continue;

    // TODO: handle failures more gracefully
    const { url, status } = await checkStatus(runId);

    if (status === "failed") {
      console.error(url, "YLT analysis failed");
      continue;
    } else if (status === "complete") {
      console.log(url, "updating record...");
      await updateRecord(runId, url);
      continue;
    } else {
      // not done yet, add it back
      jobs.push(runId);
      // wait a bit before checking again
      await sleep(1000);
    }
  }

  handleBatch();
}

handleBatch();
