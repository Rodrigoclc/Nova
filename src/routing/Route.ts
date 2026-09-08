import type { HttpHandler } from "../core/http/index.js";
import type { HttpMethod } from "./HttpMethod.js";

export type RouteParams = Readonly<Record<string, string>>;

export interface RouteDefinition {
  readonly method: HttpMethod;
  readonly path: string;
  readonly handler: HttpHandler;
}

export interface RouteMatch {
  readonly route: RouteDefinition;
  readonly params: RouteParams;
}
