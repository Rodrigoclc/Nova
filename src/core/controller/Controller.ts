import type { HttpHeaders } from "../http/index.js";
import type { ApiResponse } from "./ApiResponse.js";

export abstract class Controller {
  protected ok<T = never>(
    body?: T,
    headers?: HttpHeaders,
  ): ApiResponse<T> {
    return this.response(200, body, headers);
  }

  protected created<T>(
    body: T,
    headers?: HttpHeaders,
  ): ApiResponse<T> {
    return this.response(201, body, headers);
  }

  protected notFound<T = never>(
    body?: T,
    headers?: HttpHeaders,
  ): ApiResponse<T> {
    return this.response(404, body, headers);
  }

  protected noContent(headers?: HttpHeaders): ApiResponse<never> {
    return this.response<never>(204, undefined, headers);
  }

  private response<T>(
    statusCode: number,
    body: T | undefined,
    headers: HttpHeaders | undefined,
  ): ApiResponse<T> {
    if (body === undefined) {
      if (headers === undefined) {
        return { statusCode };
      }

      return {
        statusCode,
        headers,
      };
    }

    if (headers === undefined) {
      return {
        statusCode,
        body,
      };
    }

    return {
      statusCode,
      headers,
      body,
    };
  }
}
