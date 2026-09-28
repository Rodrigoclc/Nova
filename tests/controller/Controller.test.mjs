import assert from "node:assert/strict";
import test from "node:test";

import {
  Controller,
  Router,
  createControllerHandler,
} from "nova";

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

class UserController extends Controller {
  createdUsers = 0;

  list() {
    return this.ok([
      {
        id: 1,
        name: "Ada",
      },
    ]);
  }

  create(request) {
    this.createdUsers += 1;

    return this.created(
      {
        id: this.createdUsers,
        name: request.body.name,
      },
      {
        location: `/users/${this.createdUsers}`,
      },
    );
  }

  find(request) {
    if (request.params.id !== "1") {
      return this.notFound({
        message: "User not found",
      });
    }

    return this.ok({
      id: 1,
      name: "Ada",
    });
  }

  remove() {
    return this.noContent();
  }
}

test("controller actions preserve the instance and flow through the request pipeline", async () => {
  const controller = new UserController();
  const router = new Router();

  router.post(
    "/users",
    createControllerHandler(controller, controller.create),
  );

  const response = await router.handle(
    createRequest({
      method: "POST",
      path: "/users",
      headers: {
        "content-type": "application/json",
      },
      body: new TextEncoder().encode('{"name":"Rodrigo"}'),
    }),
  );

  assert.equal(controller.createdUsers, 1);
  assert.equal(response.statusCode, 201);
  assert.equal(response.headers?.location, "/users/1");
  assert.equal(
    response.headers?.["content-type"],
    "application/json; charset=utf-8",
  );
  assert.deepEqual(JSON.parse(response.body), {
    id: 1,
    name: "Rodrigo",
  });
});

test("controller response helpers expose the expected HTTP semantics", async () => {
  const controller = new UserController();
  const router = new Router()
    .get(
      "/users",
      createControllerHandler(controller, controller.list),
    )
    .get(
      "/users/{id}",
      createControllerHandler(controller, controller.find),
    )
    .delete(
      "/users/{id}",
      createControllerHandler(controller, controller.remove),
    );

  const listResponse = await router.handle(
    createRequest({
      method: "GET",
      path: "/users",
    }),
  );

  assert.equal(listResponse.statusCode, 200);
  assert.deepEqual(JSON.parse(listResponse.body), [
    {
      id: 1,
      name: "Ada",
    },
  ]);

  const missingResponse = await router.handle(
    createRequest({
      method: "GET",
      path: "/users/404",
    }),
  );

  assert.equal(missingResponse.statusCode, 404);
  assert.deepEqual(JSON.parse(missingResponse.body), {
    message: "User not found",
  });

  const deleteResponse = await router.handle(
    createRequest({
      method: "DELETE",
      path: "/users/1",
    }),
  );

  assert.deepEqual(deleteResponse, {
    statusCode: 204,
  });
});
