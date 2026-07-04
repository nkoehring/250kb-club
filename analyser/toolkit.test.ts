import { assertEquals, assert } from "https://deno.land/std@0.130.0/testing/asserts.ts";
import {
  url2title,
  getPageRecord,
  writeRecord,
  removeRecord,
  retryFetch,
} from "./toolkit.ts";

Deno.test("url2title - strips https:// and trailing slash", () => {
  assertEquals(url2title("https://example.com/"), "example.com");
});

Deno.test("url2title - preserves path after domain", () => {
  assertEquals(url2title("https://foo.bar/baz"), "foo.bar/baz");
});

Deno.test("url2title - handles http://", () => {
  assertEquals(url2title("http://example.com"), "example.com");
});

Deno.test("url2title - no trailing slash to strip", () => {
  assertEquals(url2title("https://example.com/path"), "example.com/path");
});

Deno.test("writeRecord + getPageRecord round-trip", async () => {
  const tmp = await Deno.makeTempDir();
  const record = {
    title: "example.com",
    date: "2024-01-01",
    updated: "2024-06-01",
    weight: 50000,
    extra: { source: "https://example.com", ratio: 75, size: 50 },
  };

  const ok = await writeRecord(record, "https://example.com", tmp);
  assert(ok);

  const result = await getPageRecord("https://example.com", tmp);
  assertEquals(result?.title, "example.com");
  assertEquals(result?.weight, 50000);
  assertEquals(result?.extra.ratio, 75);

  await Deno.remove(tmp, { recursive: true });
});

Deno.test("getPageRecord - returns null for non-existent URL", async () => {
  const tmp = await Deno.makeTempDir();
  const result = await getPageRecord("https://no-such.example.com", tmp);
  assertEquals(result, null);
  await Deno.remove(tmp, { recursive: true });
});

Deno.test("removeRecord - removes file and returns true", async () => {
  const tmp = await Deno.makeTempDir();
  const record = {
    title: "x.com",
    date: "2024-01-01",
    updated: "2024-06-01",
    weight: 1000,
    extra: { source: "https://x.com", ratio: 100, size: 1 },
  };
  await writeRecord(record, "https://x.com", tmp);

  const removed = await removeRecord("https://x.com", tmp);
  assert(removed);

  const after = await getPageRecord("https://x.com", tmp);
  assertEquals(after, null);

  await Deno.remove(tmp, { recursive: true });
});

Deno.test("removeRecord - returns false for non-existent", async () => {
  const tmp = await Deno.makeTempDir();
  const result = await removeRecord("https://no-such.example.com", tmp);
  assertEquals(result, false);
  await Deno.remove(tmp, { recursive: true });
});

Deno.test("retryFetch - returns false on 4xx", async () => {
  const origFetch = globalThis.fetch;
  globalThis.fetch = (_url: string | URL | Request) =>
    Promise.resolve(new Response("Not Found", { status: 404 }));

  const result = await retryFetch("http://test/4xx", 1, 10);
  assertEquals(result, false);

  globalThis.fetch = origFetch;
});

Deno.test("retryFetch - retries on 5xx then gives up", async () => {
  let calls = 0;
  const origFetch = globalThis.fetch;
  globalThis.fetch = (_url: string | URL | Request) => {
    calls++;
    return Promise.resolve(new Response("Server Error", { status: 500 }));
  };

  const result = await retryFetch("http://test/5xx", 2, 10);
  assertEquals(result, false);
  assertEquals(calls, 3); // 1 initial + 2 retries

  globalThis.fetch = origFetch;
});

Deno.test("retryFetch - returns parsed JSON on success", async () => {
  const origFetch = globalThis.fetch;
  globalThis.fetch = (_url: string | URL | Request) =>
    Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));

  const result = await retryFetch("http://test/ok", 1, 10);
  assertEquals(result, { ok: true });

  globalThis.fetch = origFetch;
});