import type {
  RequestContext,
  RequestHandler,
} from "../request/index.js";
import type { ApiResponse } from "./ApiResponse.js";
import type { Controller } from "./Controller.js";

export type ControllerAction<
  TController extends Controller,
  TBody = unknown,
  TResponse = unknown,
> = (
  this: TController,
  request: RequestContext<TBody>,
) => ApiResponse<TResponse> | Promise<ApiResponse<TResponse>>;

export function createControllerHandler<
  TController extends Controller,
  TBody = unknown,
  TResponse = unknown,
>(
  controller: TController,
  action: ControllerAction<TController, TBody, TResponse>,
): RequestHandler<TBody, TResponse> {
  return (request) => action.call(controller, request);
}
