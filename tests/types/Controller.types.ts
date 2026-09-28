import {
  Controller,
  Router,
  createControllerHandler,
  type ApiResponse,
  type RequestContext,
  type RequestHandler,
} from "../../src/index.js";

type CreateUserBody = {
  name: string;
};

type UserResponse = {
  id: number;
  name: string;
};

class UserController extends Controller {
  private nextId = 1;

  create(
    request: RequestContext<CreateUserBody>,
  ): ApiResponse<UserResponse> {
    return this.created({
      id: this.nextId++,
      name: request.body.name,
    });
  }

  async find(
    request: RequestContext,
  ): Promise<ApiResponse<UserResponse>> {
    return this.ok({
      id: Number(request.params.id),
      name: "Ada",
    });
  }

  missing(): ApiResponse<{ message: string }> {
    return this.notFound({
      message: "User not found",
    });
  }

  remove(): ApiResponse<never> {
    return this.noContent();
  }
}

const controller = new UserController();

const createHandler: RequestHandler<CreateUserBody, UserResponse> =
  createControllerHandler(controller, controller.create);

const findHandler: RequestHandler<unknown, UserResponse> =
  createControllerHandler(controller, controller.find);

const router = new Router();

router.post("/users", createHandler);
router.get("/users/{id}", findHandler);
router.get(
  "/missing",
  createControllerHandler(controller, controller.missing),
);
router.delete(
  "/users/{id}",
  createControllerHandler(controller, controller.remove),
);
