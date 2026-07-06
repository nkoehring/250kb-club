/// <reference path="../index.d.ts" />
import { retryFetch } from "./toolkit.ts";

const HOST = Deno.env.get("CI") ? "http://ylt:8383" : "http://localhost:8383";
const STATUS_URL = `${HOST}/api/runs/`;
const RESULT_URL = `${HOST}/api/results/`;
const METRIC_DEFAULTS = {
  device: "desktop",
  waitForResponse: false,
  screenshot: false,
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

  // deno-lint-ignore no-explicit-any
  const data = json as any;
  const url = data.params.url;
  const status = data.status.statusCode;
  return { url, status };
}

export async function retrieveMetrics(runId: string): Promise<Metric | null> {
  const json = await retryFetch(`${RESULT_URL}${runId}`);
  if (!json) return null;

  // deno-lint-ignore no-explicit-any
  const data = json as any;

  return {
    scores: {
      pageWeight:
        data.scoreProfiles.generic.categories.pageWeight.categoryScore,
      requests:
        data.scoreProfiles.generic.categories.requests?.categoryScore ?? 0,
      domComplexity:
        data.scoreProfiles.generic.categories.domComplexity.categoryScore,
      javascriptComplexity:
        data.scoreProfiles.generic.categories.javascriptComplexity
          .categoryScore,
      badJavascript:
        data.scoreProfiles.generic.categories.badJavascript.categoryScore,
      jQuery: data.scoreProfiles.generic.categories.jQuery.categoryScore,
      cssComplexity:
        data.scoreProfiles.generic.categories.cssComplexity.categoryScore,
      badCSS: data.scoreProfiles.generic.categories.badCSS.categoryScore,
      fonts: data.scoreProfiles.generic.categories.fonts.categoryScore,
      serverConfig:
        data.scoreProfiles.generic.categories.serverConfig.categoryScore,
      globalScore: data.scoreProfiles.generic.globalScore,
    },
    metrics: {
      requests: data.toolsResults.phantomas.metrics.requests ?? 0,
      bodySize: data.toolsResults.phantomas.metrics.bodySize,
      contentLength: data.toolsResults.phantomas.metrics.contentLength,
      htmlSize: data.toolsResults.phantomas.metrics.htmlSize,
      cssSize: data.toolsResults.phantomas.metrics.cssSize,
      jsSize: data.toolsResults.phantomas.metrics.jsSize,
      jsonSize: data.toolsResults.phantomas.metrics.jsonSize,
      imageSize: data.toolsResults.phantomas.metrics.imageSize,
      videoSize: data.toolsResults.phantomas.metrics.videoSize,
      webfontSize: data.toolsResults.phantomas.metrics.webfontSize,
      base64Size: data.toolsResults.phantomas.metrics.base64Size,
      otherSize: data.toolsResults.phantomas.metrics.otherSize,
    },
  };
}
