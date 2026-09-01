import type { HttpHeaders } from "./HttpHeaders.js";

export type HttpResponseBody = string | Uint8Array;

export interface HttpResponse {
  readonly statusCode: number;
  readonly headers?: HttpHeaders;
  readonly body?: HttpResponseBody;
}
