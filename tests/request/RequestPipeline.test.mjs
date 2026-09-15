import assert from "node:assert/strict";
import test from "node:test";

import { Router } from "nova";

function createRequest({
  method = "GET",
  path = "/",
  headers = {},
  query = {},
  body,
} = {}) {
  const request = {
    method,
    path,
    headers,
    query,
  };

  if (body === undefined) {
    return request;
  }

  return {
    ...request,
    body,
  };
}

test(
  "Router binds path, query, headers and JSON body into the request context",
  async () => {
    const router = new Router();
    let capturedRequest;

    router.post("/users/{id}", (request) => {
      capturedRequest = request;

      return {
        statusCode: 200,
        body: {
          id: request.params.id,
          name: request.body.name,
          page: request.query.page,
          trace: request.headers["x-trace"],
        },
      };
    });

    const response = await router.handle(
      createRequest({
        method: "POST",
        path: "/users/42",
        headers: {
          "content-type": "application/vnd.nova+json; charset=utf-8",
          "x-trace": "trace-123",
        },
        query: {
          page: "2",
          tag: ["node", "typescript"],
        },
        body: new TextEncoder().encode('{"name":"Rodrigo"}'),
      }),
    );

    assert.ok(capturedRequest);
    assert.deepEqual(capturedRequest.params, { id: "42" });
    assert.deepEqual(capturedRequest.body, { name: "Rodrigo" });
    assert.deepEqual(capturedRequest.query.tag, ["node", "typescript"]);
    assert.equal(capturedRequest.headers["x-trace"], "trace-123");

    assert.equal(response.statusCode, 200);
    assert.equal(
      response.headers?.["content-type"],
      "application/json; charset=utf-8",
    );
    assert.deepEqual(JSON.parse(response.body), {
      id: "42",
      name: "Rodrigo",
      page: "2",
      trace: "trace-123",
    });
  },
);

test("Request pipeline preserves non-JSON bodies as bytes", async () => {
  const router = new Router();
  let capturedBody;

  router.post("/upload", (request) => {
    capturedBody = request.body;

    return {
      statusCode: 201,
      headers: {
        "content-type": "text/plain",
      },
      body: "created",
    };
  });

  const response = await router.handle(
    createRequest({
      method: "POST",
      path: "/upload",
      headers: {
        "content-type": "application/octet-stream",
      },
      body: new Uint8Array([1, 2, 3, 4]),
    }),
  );

  assert.ok(capturedBody instanceof Uint8Array);
  assert.deepEqual(Array.from(capturedBody), [1, 2, 3, 4]);
  assert.deepEqual(response, {
    statusCode: 201,
    headers: {
      "content-type": "text/plain",
    },
    body: "created",
  });
});

test(
  "Request pipeline rejects malformed JSON before invoking the handler",
  async () => {
    const router = new Router();
    let invoked = false;

    router.post("/users", () => {
      invoked = true;
      return { statusCode: 204 };
    });

    const response = await router.handle(
      createRequest({
        method: "POST",
        path: "/users",
        headers: {
          "content-type": "application/json",
        },
        body: new TextEncoder().encode('{"name":'),
      }),
    );

    assert.equal(invoked, false);
    assert.equal(response.statusCode, 400);
    assert.deepEqual(JSON.parse(response.body), {
      error: {
        code: "MALFORMED_JSON",
        message: "Request body contains malformed JSON.",
      },
    });
  },
);

test("Request pipeline enforces the configured body limit", async () => {
  const router = new Router({ maxBodyBytes: 4 });
  let invoked = false;

  router.post("/upload", () => {
    invoked = true;
    return { statusCode: 204 };
  });

  const response = await router.handle(
    createRequest({
      method: "POST",
      path: "/upload",
      body: new Uint8Array([1, 2, 3, 4, 5]),
    }),
  );

  assert.equal(invoked, false);
  assert.equal(response.statusCode, 413);
  assert.deepEqual(JSON.parse(response.body), {
    error: {
      code: "PAYLOAD_TOO_LARGE",
      message: "Request body exceeds the 4 byte limit.",
    },
  });
});

test(
  "Request pipeline converts unhandled handler failures into a generic 500",
  async () => {
    const router = new Router();

    router.get("/failure", () => {
      throw new Error("database password leaked here");
    });

    const response = await router.handle(
      createRequest({
        method: "GET",
        path: "/failure",
      }),
    );

    assert.equal(response.statusCode, 500);
    assert.deepEqual(JSON.parse(response.body), {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while processing the request.",
      },
    });
    assert.equal(response.body.includes("database password"), false);
  },
);

test("Response serialization preserves an explicit content type", async () => {
  const router = new Router();

  router.get("/problem", () => ({
    statusCode: 422,
    headers: {
      "Content-Type": "application/problem+json",
    },
    body: {
      title: "Validation failed",
    },
  }));

  const response = await router.handle(
    createRequest({
      method: "GET",
      path: "/problem",
    }),
  );

  assert.equal(response.statusCode, 422);
  assert.equal(response.headers?.["Content-Type"], "application/problem+json");
  assert.equal(response.headers?.["content-type"], undefined);
  assert.deepEqual(JSON.parse(response.body), {
    title: "Validation failed",
  });
});

test("Router rejects invalid request body limits at configuration time", () => {
  assert.throws(() => new Router({ maxBodyBytes: 0 }), /positive safe integer/);
  assert.throws(
    () => new Router({ maxBodyBytes: 1.5 }),
    /positive safe integer/,
  );
});
