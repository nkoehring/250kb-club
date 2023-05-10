import { retryFetch } from "./toolkit.ts";

const STATUS_URL = "http://ylt:8383/api/runs/";
const RESULT_URL = "http://ylt:8383/api/results/";
const METRIC_DEFAULTS = {
  device: "desktop",
  waitForResponse: false,
  screenshot: true,
};

// requests metrics and returns runId
export async function requestMetricsRun(url: string): Promise<string | null> {
  const body = JSON.stringify({
    url,
    ...METRIC_DEFAULTS,
  });

  const response = await fetch(STATUS_URL, {
    method: "POST",
    headers: [
      ["Content-Type", "application/json"],
      ["User-Agent", "250kb-club"],
    ],
    body,
  });

  if (response.ok) {
    const json: { runId: string } = await response.json();
    return json.runId;
  } else {
    const err = await response.text();
    console.error(`Failed to request metrics run for ${url}: ${err}`);
    return null;
  }
}

export async function checkStatus(runId: string): Promise<Status> {
  const json = await retryFetch(`${STATUS_URL}${runId}`);
  if (!json) return { url: "", status: "failed" };

  const url = json.params.url;
  const status = json.status.statusCode;
  return { url, status };
}

export async function retrieveMetrics(runId: string): Promise<Metric | null> {
  const json = await retryFetch(`${RESULT_URL}${runId}`);
  if (!json) return null;

  return {
    scores: {
      pageWeight:
        json.scoreProfiles.generic.categories.pageWeight.categoryScore,
      requests: json.scoreProfiles.generic.categories.requests.categoryScore,
      domComplexity:
        json.scoreProfiles.generic.categories.domComplexity.categoryScore,
      javascriptComplexity:
        json.scoreProfiles.generic.categories.javascriptComplexity
          .categoryScore,
      badJavascript:
        json.scoreProfiles.generic.categories.badJavascript.categoryScore,
      jQuery: json.scoreProfiles.generic.categories.jQuery.categoryScore,
      cssComplexity:
        json.scoreProfiles.generic.categories.cssComplexity.categoryScore,
      badCSS: json.scoreProfiles.generic.categories.badCSS.categoryScore,
      fonts: json.scoreProfiles.generic.categories.fonts.categoryScore,
      serverConfig:
        json.scoreProfiles.generic.categories.serverConfig.categoryScore,
      globalScore: json.scoreProfiles.generic.globalScore,
    },
    metrics: {
      requests: json.toolsResults.phantomas.metrics.requests,
      bodySize: json.toolsResults.phantomas.metrics.bodySize,
      contentLength: json.toolsResults.phantomas.metrics.contentLength,
      htmlSize: json.toolsResults.phantomas.metrics.htmlSize,
      cssSize: json.toolsResults.phantomas.metrics.cssSize,
      jsSize: json.toolsResults.phantomas.metrics.jsSize,
      jsonSize: json.toolsResults.phantomas.metrics.jsonSize,
      imageSize: json.toolsResults.phantomas.metrics.imageSize,
      videoSize: json.toolsResults.phantomas.metrics.videoSize,
      webfontSize: json.toolsResults.phantomas.metrics.webfontSize,
      base64Size: json.toolsResults.phantomas.metrics.base64Size,
      otherSize: json.toolsResults.phantomas.metrics.otherSize,
    },
  };
}
