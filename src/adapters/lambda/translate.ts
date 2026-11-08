import { Buffer } from "node:buffer";

import type {
  HttpHeaders,
  HttpQuery,
  HttpQueryValue,
  HttpRequest,
  HttpResponse,
} from "../../core/http/index.js";
import type {
  LambdaFunctionUrlEvent,
  LambdaFunctionUrlResult,
} from "./LambdaEvent.js";

/**
 * Translates a Lambda Function URL event (payload v2) into Nova's runtime
 * neutral {@link HttpRequest}.
 */
export function fromLambdaEvent(event: LambdaFunctionUrlEvent): HttpRequest {
  const method = event.requestContext?.http?.method;

  if (!method) {
    throw new Error(
      "Lambda event is missing requestContext.http.method. Nova's Lambda adapter expects a Function URL or HTTP API payload (format 2.0).",
    );
  }

  const body = readBody(event);

  return {
    method: method.toUpperCase(),
    path: event.rawPath || "/",
    headers: toHttpHeaders(event),
    query: toHttpQuery(event),
    ...(body === undefined ? {} : { body }),
  };
}

/**
 * Translates Nova's {@link HttpResponse} into the result shape expected by
 * Lambda Function URLs. Binary bodies are base64 encoded; `set-cookie`
 * headers are moved to the dedicated `cookies` array because Function URL
 * response headers only accept a single string per name.
 */
export function toLambdaResult(
  response: HttpResponse,
): LambdaFunctionUrlResult {
  const result: LambdaFunctionUrlResult = { statusCode: response.statusCode };
  const headers: Record<string, string> = {};
  const cookies: string[] = [];

  if (response.headers) {
    for (const [rawName, value] of Object.entries(response.headers)) {
      const name = rawName.toLowerCase();
      const values = typeof value === "string" ? [value] : [...value];

      if (name === "set-cookie") {
        cookies.push(...values);
        continue;
      }

      headers[name] = values.join(", ");
    }
  }

  if (Object.keys(headers).length > 0) {
    result.headers = headers;
  }

  if (cookies.length > 0) {
    result.cookies = cookies;
  }

  if (typeof response.body === "string") {
    result.body = response.body;
    result.isBase64Encoded = false;
  } else if (response.body !== undefined) {
    result.body = Buffer.from(
      response.body.buffer,
      response.body.byteOffset,
      response.body.byteLength,
    ).toString("base64");
    result.isBase64Encoded = true;
  }

  return result;
}

function readBody(event: LambdaFunctionUrlEvent): Uint8Array | undefined {
  if (event.body === undefined || event.body === null || event.body === "") {
    return undefined;
  }

  return event.isBase64Encoded
    ? new Uint8Array(Buffer.from(event.body, "base64"))
    : new Uint8Array(Buffer.from(event.body, "utf8"));
}

function toHttpHeaders(event: LambdaFunctionUrlEvent): HttpHeaders {
  const headers: Record<string, string | readonly string[]> = Object.create(
    null,
  ) as Record<string, string | readonly string[]>;

  for (const [rawName, value] of Object.entries(event.headers ?? {})) {
    if (value === undefined) {
      continue;
    }

    headers[rawName.toLowerCase()] = value;
  }

  // Function URLs strip the Cookie header and deliver cookies separately.
  if (
    event.cookies &&
    event.cookies.length > 0 &&
    headers["cookie"] === undefined
  ) {
    headers["cookie"] = event.cookies.join("; ");
  }

  return { ...headers };
}

function toHttpQuery(event: LambdaFunctionUrlEvent): HttpQuery {
  const query: Record<string, HttpQueryValue> = Object.create(null) as Record<
    string,
    HttpQueryValue
  >;

  // rawQueryString preserves repeated keys (?tag=a&tag=b); the parsed map
  // joins them with commas, so prefer the raw form when present.
  if (event.rawQueryString) {
    for (const [name, value] of new URLSearchParams(event.rawQueryString)) {
      append(query, name, value);
    }

    return { ...query };
  }

  for (const [name, value] of Object.entries(
    event.queryStringParameters ?? {},
  )) {
    if (value !== undefined) {
      append(query, name, value);
    }
  }

  return { ...query };
}

function append(
  query: Record<string, HttpQueryValue>,
  name: string,
  value: string,
): void {
  const current = query[name];

  if (current === undefined) {
    query[name] = value;
  } else if (typeof current === "string") {
    query[name] = [current, value];
  } else {
    query[name] = [...current, value];
  }
}
