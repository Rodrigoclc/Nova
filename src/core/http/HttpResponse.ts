export interface HttpResponse<T = unknown> {
  readonly statusCode: number;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: T;
}
