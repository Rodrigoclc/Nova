import type {
  HttpHeaders,
  HttpRequest,
  HttpResponse,
} from "../http/index.js";
import type { ApplicationResponse } from "./ApplicationResponse.js";
import type { RequestContext, RequestParams } from "./RequestContext.js";
import type { RequestHandler } from "./RequestHandler.js";

const DEFAULT_MAX_BODY_BYTES = 1024 * 1024;
const JSON_CONTENT_TYPE = "application/json; charset=utf-8";

export interface RequestPipelineOptions {
  readonly maxBodyBytes?: number;
}

class RequestPipelineError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "RequestPipelineError";
  }
}

function firstHeaderValue(
  headers: HttpHeaders,
  name: string,
): string | undefined {
  const normalizedName = name.toLowerCase();

  for (const [headerName, value] of Object.entries(headers)) {
    if (headerName.toLowerCase() !== normalizedName) {
      continue;
    }

    return typeof value === "string" ? value : value[0];
  }

  return undefined;
}

function hasHeader(headers: HttpHeaders, name: string): boolean {
  const normalizedName = name.toLowerCase();
  return Object.keys(headers).some(
    (headerName) => headerName.toLowerCase() === normalizedName,
  );
}

function isJsonContentType(contentType: string | undefined): boolean {
  if (!contentType) {
    return false;
  }

  const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase();

  return mediaType === "application/json" || Boolean(mediaType?.endsWith("+json"));
}

function errorResponse(
  statusCode: number,
  code: string,
  message: string,
): HttpResponse {
  return {
    statusCode,
    headers: {
      "content-type": JSON_CONTENT_TYPE,
    },
    body: JSON.stringify({
      error: {
        code,
        message,
      },
    }),
  };
}

export class RequestPipeline {
  private readonly maxBodyBytes: number;

  constructor(options: RequestPipelineOptions = {}) {
    const maxBodyBytes = options.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;

    if (!Number.isSafeInteger(maxBodyBytes) || maxBodyBytes <= 0) {
      throw new Error("maxBodyBytes must be a positive safe integer.");
    }

    this.maxBodyBytes = maxBodyBytes;
  }

  async handle(
    request: HttpRequest,
    params: RequestParams,
    handler: RequestHandler,
  ): Promise<HttpResponse> {
    try {
      const context = this.bindRequest(request, params);
      const response = await handler(context);

      return this.serializeResponse(response);
    } catch (error) {
      if (error instanceof RequestPipelineError) {
        return errorResponse(error.statusCode, error.code, error.message);
      }

      return errorResponse(
        500,
        "INTERNAL_SERVER_ERROR",
        "An unexpected error occurred while processing the request.",
      );
    }
  }

  private bindRequest(
    request: HttpRequest,
    params: RequestParams,
  ): RequestContext {
    const body = this.parseBody(request);
    const base = {
      method: request.method,
      path: request.path,
      headers: request.headers,
      query: request.query,
      params,
    };

    if (body === undefined) {
      return base;
    }

    return {
      ...base,
      body,
    };
  }

  private parseBody(request: HttpRequest): unknown {
    if (request.body === undefined) {
      return undefined;
    }

    if (request.body.byteLength > this.maxBodyBytes) {
      throw new RequestPipelineError(
        413,
        "PAYLOAD_TOO_LARGE",
        `Request body exceeds the ${this.maxBodyBytes} byte limit.`,
      );
    }

    const contentType = firstHeaderValue(request.headers, "content-type");

    if (!isJsonContentType(contentType)) {
      return request.body;
    }

    try {
      const text = new TextDecoder().decode(request.body);
      return JSON.parse(text) as unknown;
    } catch {
      throw new RequestPipelineError(
        400,
        "MALFORMED_JSON",
        "Request body contains malformed JSON.",
      );
    }
  }

  private serializeResponse(response: ApplicationResponse): HttpResponse {
    if (response.body === undefined) {
      if (response.headers === undefined) {
        return {
          statusCode: response.statusCode,
        };
      }

      return {
        statusCode: response.statusCode,
        headers: response.headers,
      };
    }

    if (
      typeof response.body === "string" ||
      response.body instanceof Uint8Array
    ) {
      if (response.headers === undefined) {
        return {
          statusCode: response.statusCode,
          body: response.body,
        };
      }

      return {
        statusCode: response.statusCode,
        headers: response.headers,
        body: response.body,
      };
    }

    const body = JSON.stringify(response.body);

    if (body === undefined) {
      throw new Error("Response body could not be serialized as JSON.");
    }

    const headers =
      response.headers !== undefined &&
      hasHeader(response.headers, "content-type")
        ? response.headers
        : {
            ...(response.headers ?? {}),
            "content-type": JSON_CONTENT_TYPE,
          };

    return {
      statusCode: response.statusCode,
      headers,
      body,
    };
  }
}
