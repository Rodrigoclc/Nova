export type HttpHeaderValue = string | readonly string[];

export type HttpHeaders = Readonly<Record<string, HttpHeaderValue>>;
