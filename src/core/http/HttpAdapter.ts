import type { HttpRequest } from "./HttpRequest.js";
import type { HttpResponse } from "./HttpResponse.js";

export type HttpHandler = (request: HttpRequest) => Promise<HttpResponse>;

export interface HttpAdapter {
  listen(port: number, handler: HttpHandler): Promise<void> | void;
}
