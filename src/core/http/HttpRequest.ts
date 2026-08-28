export type HttpMethod =
  "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export interface HttpRequest {
  readonly method: HttpMethod;
  readonly path: string;

  readonly headers: Readonly<Record<string, string>>;
  readonly query: Readonly<Record<string, string>>;
  readonly params: Readonly<Record<string, string>>;

  readonly body?: unknown;
}
