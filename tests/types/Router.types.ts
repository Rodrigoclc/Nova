import type { RequestHandler } from "../../src/core/request/RequestHandler.js";
import { Router } from "../../src/routing/Router.js";

type CreateUserBody = {
  name: string;
};

type UserResponse = {
  id: number;
  name: string;
};

const handler: RequestHandler<CreateUserBody, UserResponse> = (request) => ({
  statusCode: 201,
  body: {
    id: 1,
    name: request.body.name,
  },
});

const router = new Router();

router.register("POST", "/register", handler);
router.get("/get", handler);
router.post("/post", handler);
router.put("/put", handler);
router.patch("/patch", handler);
router.delete("/delete", handler);
router.head("/head", handler);
router.options("/options", handler);
