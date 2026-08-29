import type { HttpHeaders } from "./HttpHeaders.js";

export interface HttpResponse<T = unknown> {
  readonly statusCode: number;
  readonly headers?: HttpHeaders;
  readonly body?: T;
}
