import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { createServer } from "node:net";
import test from "node:test";

import { Application } from "nova";
import { NodeHttpAdapter } from "nova/node";

async function getAvailablePort() {
  const server = createServer();

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Could not resolve an available TCP port.");
  }

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  return address.port;
}

test("Nova handles HTTP traffic through the Node.js adapter", async () => {
  const port = await getAvailablePort();
  const app = new Application(new NodeHttpAdapter());
  let capturedRequest;

  const server = await app.listen(port, (request) => {
    capturedRequest = request;

    return {
      statusCode: 201,
      headers: {
        "content-type": "text/plain",
        "set-cookie": ["first=1", "second=2"],
      },
      body: "created",
    };
  });

  try {
    const response = await fetch(
      `http://127.0.0.1:${port}/users?tag=node&tag=typescript&page=2`,
      {
        method: "POST",
        headers: {
          "content-type": "application/octet-stream",
          "x-nova-test": "adapter",
        },
        body: Buffer.from([1, 2, 3, 4]),
      },
    );

    assert.equal(response.status, 201);
    assert.equal(await response.text(), "created");
    assert.equal(response.headers.get("content-type"), "text/plain");
    assert.equal(response.headers.getSetCookie().length, 2);

    assert.ok(capturedRequest);
    assert.equal(capturedRequest.method, "POST");
    assert.equal(capturedRequest.path, "/users");
    assert.deepEqual(capturedRequest.query, {
      tag: ["node", "typescript"],
      page: "2",
    });
    assert.equal(capturedRequest.headers["x-nova-test"], "adapter");
    assert.deepEqual(Array.from(capturedRequest.body ?? []), [1, 2, 3, 4]);
  } finally {
    await server.close();
  }
});
