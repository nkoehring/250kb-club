import { assertEquals } from "https://deno.land/std@0.130.0/testing/asserts.ts";
import { checkStatus, retrieveMetrics } from "./metrics.ts";
import { retryFetch } from "./toolkit.ts";

Deno.test("checkStatus - returns failed when fetch returns false", async () => {
  const origFetch = globalThis.fetch;
  globalThis.fetch = (_url: string | URL | Request) =>
    Promise.resolve(new Response("Not Found", { status: 404 }));

  const result = await checkStatus("fake-run-id");
  assertEquals(result.status, "failed");

  globalThis.fetch = origFetch;
});

Deno.test("checkStatus - maps API response to Status", async () => {
  const origFetch = globalThis.fetch;
  globalThis.fetch = (_url: string | URL | Request) =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          params: { url: "https://example.com" },
          status: { statusCode: "complete" },
        }),
        { status: 200 },
      ),
    );

  const result = await checkStatus("fake-run-id");
  assertEquals(result.url, "https://example.com");
  assertEquals(result.status, "complete");

  globalThis.fetch = origFetch;
});

Deno.test("retrieveMetrics - returns null when fetch fails", async () => {
  const origFetch = globalThis.fetch;
  globalThis.fetch = (_url: string | URL | Request) =>
    Promise.resolve(new Response("Not Found", { status: 404 }));

  const result = await retrieveMetrics("fake-run-id");
  assertEquals(result, null);

  globalThis.fetch = origFetch;
});

Deno.test("retrieveMetrics - maps nested fields from valid response", async () => {
  const origFetch = globalThis.fetch;
  const mockResponse = {
    scoreProfiles: {
      generic: {
        categories: {
          pageWeight: { categoryScore: 95 },
          requests: { categoryScore: 90 },
          domComplexity: { categoryScore: 80 },
          javascriptComplexity: { categoryScore: 70 },
          badJavascript: { categoryScore: 90 },
          jQuery: { categoryScore: 100 },
          cssComplexity: { categoryScore: 85 },
          badCSS: { categoryScore: 95 },
          fonts: { categoryScore: 100 },
          serverConfig: { categoryScore: 90 },
        },
        globalScore: 88,
      },
    },
    toolsResults: {
      phantomas: {
        metrics: {
          requests: 12,
          bodySize: 50000,
          contentLength: 48000,
          htmlSize: 10000,
          cssSize: 5000,
          jsSize: 8000,
          jsonSize: 0,
          imageSize: 20000,
          videoSize: 0,
          webfontSize: 0,
          base64Size: 0,
          otherSize: 5000,
        },
      },
    },
  };
  globalThis.fetch = (_url: string | URL | Request) =>
    Promise.resolve(new Response(JSON.stringify(mockResponse), { status: 200 }));

  const result = await retrieveMetrics("fake-run-id");
  assertEquals(result?.scores.pageWeight, 95);
  assertEquals(result?.scores.globalScore, 88);
  assertEquals(result?.metrics.requests, 12);
  assertEquals(result?.metrics.contentLength, 48000);
  assertEquals(result?.metrics.htmlSize, 10000);

  globalThis.fetch = origFetch;
});