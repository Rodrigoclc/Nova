import type { HttpHeaders } from "./HttpHeaders.js";

export type HttpQueryValue = string | readonly string[];

export type HttpQuery = Readonly<Record<string, HttpQueryValue>>;

export interface HttpRequest {
  readonly method: string;
  readonly path: string;
  readonly headers: HttpHeaders;
  readonly query: HttpQuery;
  readonly body?: Uint8Array;
}
