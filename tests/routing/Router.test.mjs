import assert from "node:assert/strict";
import test from "node:test";

import { Application, Router, matchPath } from "nova";

function createRequest(method, path) {
  return {
    method,
    path,
    headers: {},
    query: {},
  };
}

test("matchPath matches static and parameterized route segments", () => {
  assert.deepEqual(
    matchPath("/accounts/{id}/statement", "/accounts/123/statement"),
    { id: "123" },
  );
  assert.deepEqual(matchPath("/health", "/health"), {});
  assert.equal(matchPath("/health", "/health/details"), undefined);
  assert.equal(
    matchPath("/accounts/{id}/statement", "/accounts/123/transfers"),
    undefined,
  );
});

test("Router dispatches by HTTP method and prefers static routes", async () => {
  const router = new Router();

  router.get("/users/{id}", () => ({
    statusCode: 200,
    body: "dynamic",
  }));
  router.get("/users/me", () => ({
    statusCode: 200,
    body: "static",
  }));
  router.post("/users/me", () => ({
    statusCode: 201,
    body: "posted",
  }));

  assert.deepEqual(router.match("GET", "/users/42")?.params, { id: "42" });

  const staticResponse = await router.handle(createRequest("GET", "/users/me"));
  assert.equal(staticResponse.statusCode, 200);
  assert.equal(staticResponse.body, "static");

  const postResponse = await router.handle(createRequest("POST", "/users/me"));
  assert.equal(postResponse.statusCode, 201);
  assert.equal(postResponse.body, "posted");
});

test("Router rejects conflicting route patterns for the same method", () => {
  const router = new Router();

  router.get("/users/{id}", () => ({ statusCode: 200 }));

  assert.throws(
    () => router.get("/users/{name}", () => ({ statusCode: 200 })),
    /Duplicate route/,
  );

  assert.doesNotThrow(() =>
    router.post("/users/{name}", () => ({ statusCode: 201 })),
  );
});

test("Router returns 404 when no route matches", async () => {
  const router = new Router();
  const response = await router.handle(createRequest("GET", "/missing"));

  assert.deepEqual(response, {
    statusCode: 404,
    body: "Not Found",
  });
});

test("Application can use a router as its default handler", async () => {
  let capturedHandler;
  let capturedPort;

  const adapter = {
    listen(port, handler) {
      capturedPort = port;
      capturedHandler = handler;

      return {
        async close() {},
      };
    },
  };

  const router = new Router().get("/health", () => ({
    statusCode: 200,
    body: "ok",
  }));
  const app = new Application(adapter, router.handle);
  const server = await app.listen(3000);

  assert.equal(capturedPort, 3000);
  assert.ok(capturedHandler);

  const response = await capturedHandler(createRequest("GET", "/health"));
  assert.equal(response.statusCode, 200);
  assert.equal(response.body, "ok");

  await server.close();
});

test(
  "Application keeps supporting a handler passed directly to listen",
  async () => {
    let capturedHandler;

    const adapter = {
      listen(_port, handler) {
        capturedHandler = handler;

        return {
          async close() {},
        };
      },
    };

    const app = new Application(adapter);
    await app.listen(3000, () => ({
      statusCode: 204,
    }));

    assert.ok(capturedHandler);
    const response = await capturedHandler(createRequest("GET", "/anything"));
    assert.equal(response.statusCode, 204);
  },
);
