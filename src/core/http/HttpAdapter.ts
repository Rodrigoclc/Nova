import type { HttpRequest } from "./HttpRequest.js";
import type { HttpResponse } from "./HttpResponse.js";
import type { HttpServer } from "./HttpServer.js";

export type HttpHandler = (
  request: HttpRequest,
) => HttpResponse | Promise<HttpResponse>;

export interface HttpAdapter {
  listen(
    port: number,
    handler: HttpHandler,
  ): HttpServer | Promise<HttpServer>;
}
