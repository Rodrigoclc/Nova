import { Buffer } from "node:buffer";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { URL } from "node:url";

import type {
  HttpAdapter,
  HttpHandler,
  HttpHeaders,
  HttpQuery,
  HttpQueryValue,
  HttpRequest,
  HttpResponse,
  HttpServer,
} from "../../core/http/index.js";
import { NodeHttpServer } from "./NodeHttpServer.js";

export class NodeHttpAdapter implements HttpAdapter {
  listen(port: number, handler: HttpHandler): Promise<HttpServer> {
    return new Promise((resolve, reject) => {
      const server = createServer((request, response) => {
        void this.handleRequest(request, response, handler);
      });

      const handleStartupError = (error: Error): void => {
        server.off("listening", handleListening);
        reject(error);
      };

      const handleListening = (): void => {
        server.off("error", handleStartupError);
        resolve(new NodeHttpServer(server));
      };

      server.once("error", handleStartupError);
      server.once("listening", handleListening);
      server.listen(port);
    });
  }

  private async handleRequest(
    request: IncomingMessage,
    response: ServerResponse,
    handler: HttpHandler,
  ): Promise<void> {
    try {
      const httpRequest = await this.toHttpRequest(request);
      const httpResponse = await handler(httpRequest);

      this.writeResponse(response, httpResponse);
    } catch (error) {
      response.destroy(this.toError(error));
    }
  }

  private async toHttpRequest(request: IncomingMessage): Promise<HttpRequest> {
    if (!request.method) {
      throw new Error("Incoming HTTP request is missing a method.");
    }

    const url = new URL(request.url ?? "/", "http://nova.local");
    const body = await this.readBody(request);

    return {
      method: request.method,
      path: url.pathname,
      headers: this.toHttpHeaders(request),
      query: this.toHttpQuery(url),
      ...(body === undefined ? {} : { body }),
    };
  }

  private toHttpHeaders(request: IncomingMessage): HttpHeaders {
    const headers: Record<string, string | readonly string[]> = {};

    for (let index = 0; index + 1 < request.rawHeaders.length; index += 2) {
      const rawName = request.rawHeaders[index];
      const value = request.rawHeaders[index + 1];

      if (rawName === undefined || value === undefined) {
        continue;
      }

      const name = rawName.toLowerCase();
      const current = headers[name];

      if (current === undefined) {
        headers[name] = value;
      } else if (typeof current === "string") {
        headers[name] = [current, value];
      } else {
        headers[name] = [...current, value];
      }
    }

    return headers;
  }

  private toHttpQuery(url: URL): HttpQuery {
    const query: Record<string, HttpQueryValue> = {};

    for (const [name, value] of url.searchParams) {
      const current = query[name];

      if (current === undefined) {
        query[name] = value;
      } else if (typeof current === "string") {
        query[name] = [current, value];
      } else {
        query[name] = [...current, value];
      }
    }

    return query;
  }

  private async readBody(request: IncomingMessage): Promise<Uint8Array | undefined> {
    const chunks: Buffer[] = [];

    for await (const chunk of request) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    if (chunks.length === 0) {
      return undefined;
    }

    return Buffer.concat(chunks);
  }

  private writeResponse(response: ServerResponse, httpResponse: HttpResponse): void {
    response.statusCode = httpResponse.statusCode;

    if (httpResponse.headers) {
      for (const [name, value] of Object.entries(httpResponse.headers)) {
        response.setHeader(name, value);
      }
    }

    response.end(httpResponse.body);
  }

  private toError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    return new Error("Unhandled error in Nova's Node.js HTTP adapter.", {
      cause: error,
    });
  }
}
