import type { HttpHeaders } from "../http/index.js";

export interface ApplicationResponse<T = unknown> {
  readonly statusCode: number;
  readonly headers?: HttpHeaders;
  readonly body?: T;
}
