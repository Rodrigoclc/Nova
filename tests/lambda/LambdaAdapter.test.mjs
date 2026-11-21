import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import test from "node:test";

import { Application, Router } from "nova";
import {
  LambdaHttpAdapter,
  fromLambdaEvent,
  toLambdaHandler,
  toLambdaResult,
} from "nova/lambda";

import { functionUrlEvent } from "./fixtures.mjs";

test("fromLambdaEvent translates a Function URL GET event", () => {
  const request = fromLambdaEvent(functionUrlEvent());

  assert.equal(request.method, "GET");
  assert.equal(request.path, "/users/42");
  assert.deepEqual(request.query, { tag: ["a", "b"], page: "2" });
  assert.equal(request.headers["accept"], "application/json");
  assert.equal(
    request.headers["host"].endsWith(".lambda-url.us-east-1.on.aws"),
    true,
  );
  assert.equal(request.headers["cookie"], "session=abc123; theme=dark");
  assert.equal(request.body, undefined);
});

test("fromLambdaEvent decodes JSON and base64 bodies", () => {
  const json = fromLambdaEvent(
    functionUrlEvent({
      rawPath: "/users",
      requestContext: { http: { method: "POST" } },
      headers: { "content-type": "application/json" },
      body: '{"name":"Ana"}',
      isBase64Encoded: false,
    }),
  );

  assert.equal(json.method, "POST");
  assert.equal(Buffer.from(json.body).toString("utf8"), '{"name":"Ana"}');

  const binary = fromLambdaEvent(
    functionUrlEvent({
      requestContext: { http: { method: "PUT" } },
      body: Buffer.from([0, 1, 2, 255]).toString("base64"),
      isBase64Encoded: true,
    }),
  );

  assert.deepEqual([...binary.body], [0, 1, 2, 255]);
});

test("fromLambdaEvent falls back to queryStringParameters and defaults the path", () => {
  const request = fromLambdaEvent({
    rawPath: "",
    queryStringParameters: { q: "nova" },
    requestContext: { http: { method: "get" } },
  });

  assert.equal(request.method, "GET");
  assert.equal(request.path, "/");
  assert.deepEqual(request.query, { q: "nova" });
});

test("fromLambdaEvent rejects events without an HTTP method", () => {
  assert.throws(
    () => fromLambdaEvent({ rawPath: "/", requestContext: {} }),
    /requestContext\.http\.method/,
  );
});

test("toLambdaResult moves cookies out of headers and encodes binary bodies", () => {
  const text = toLambdaResult({
    statusCode: 201,
    headers: {
      "Content-Type": "text/plain",
      "set-cookie": ["first=1", "second=2"],
      vary: ["accept", "origin"],
    },
    body: "created",
  });

  assert.deepEqual(text, {
    statusCode: 201,
    headers: { "content-type": "text/plain", vary: "accept, origin" },
    cookies: ["first=1", "second=2"],
    body: "created",
    isBase64Encoded: false,
  });

  const binary = toLambdaResult({
    statusCode: 200,
    body: new Uint8Array([104, 105]),
  });

  assert.deepEqual(binary, {
    statusCode: 200,
    body: Buffer.from("hi").toString("base64"),
    isBase64Encoded: true,
  });

  assert.deepEqual(toLambdaResult({ statusCode: 204 }), { statusCode: 204 });
});

test("toLambdaHandler routes a Function URL event through a Nova router", async () => {
  const router = new Router();
  let captured;

  router.get("/users/{id}", (request) => {
    captured = request;

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: request.params.id }),
    };
  });

  const handler = toLambdaHandler(router.handle);
  const result = await handler(functionUrlEvent());

  assert.equal(result.statusCode, 200);
  assert.equal(result.headers["content-type"], "application/json");
  assert.deepEqual(JSON.parse(result.body), { id: "42" });
  assert.equal(captured.method, "GET");
});

test("toLambdaHandler answers 500 when the handler throws, and supports a custom onError", async () => {
  const failing = () => {
    throw new Error("boom");
  };

  const originalError = console.error;
  console.error = () => {};

  try {
    const result = await toLambdaHandler(failing)(functionUrlEvent());
    assert.equal(result.statusCode, 500);
  } finally {
    console.error = originalError;
  }

  const custom = toLambdaHandler(failing, {
    onError: (error) => ({ statusCode: 503, body: error.message }),
  });

  assert.deepEqual(await custom(functionUrlEvent()), {
    statusCode: 503,
    body: "boom",
  });
});

test("LambdaHttpAdapter plugs into Application and buffers early events", async () => {
  const adapter = new LambdaHttpAdapter();
  const router = new Router();

  router.post("/echo", (request) => ({
    statusCode: 200,
    body: Buffer.from(request.body).toString("utf8").toUpperCase(),
  }));

  // Event arrives before the application has finished bootstrapping.
  const pending = adapter.handler(
    functionUrlEvent({
      rawPath: "/echo",
      requestContext: { http: { method: "POST" } },
      body: "nova",
    }),
  );

  const app = new Application(adapter, router.handle);
  const server = await app.listen(0);

  const result = await pending;

  assert.equal(result.statusCode, 200);
  assert.equal(result.body, "NOVA");

  await server.close();
});

test("LambdaHttpAdapter returns 404 from the router for unknown routes", async () => {
  const adapter = new LambdaHttpAdapter();
  const app = new Application(adapter, new Router().handle);
  await app.listen(0);

  const result = await adapter.handler(
    functionUrlEvent({ rawPath: "/missing" }),
  );

  assert.equal(result.statusCode, 404);
});
