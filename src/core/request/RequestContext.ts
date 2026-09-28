import type { HttpHeaders, HttpQuery } from "../http/index.js";

export type RequestParams = Readonly<Record<string, string>>;

export interface RequestContext<TBody = unknown> {
  readonly method: string;
  readonly path: string;
  readonly headers: HttpHeaders;
  readonly query: HttpQuery;
  readonly params: RequestParams;
  readonly body?: TBody;
}
