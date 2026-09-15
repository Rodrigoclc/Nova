import type {
  RequestHandler,
  RequestParams,
} from "../core/request/index.js";
import type { HttpMethod } from "./HttpMethod.js";

export type RouteParams = RequestParams;

export interface RouteDefinition {
  readonly method: HttpMethod;
  readonly path: string;
  readonly handler: RequestHandler;
}

export interface RouteMatch {
  readonly route: RouteDefinition;
  readonly params: RouteParams;
}
