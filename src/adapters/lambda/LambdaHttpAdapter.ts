import type {
  HttpAdapter,
  HttpHandler,
  HttpServer,
} from "../../core/http/index.js";
import type { LambdaHandler } from "./LambdaEvent.js";
import {
  toLambdaHandler,
  type ToLambdaHandlerOptions,
} from "./toLambdaHandler.js";

/**
 * {@link HttpAdapter} for AWS Lambda.
 *
 * Lambda has no socket to listen on: the platform invokes the exported
 * `handler` once per request. `listen()` therefore only captures the Nova
 * handler, and {@link LambdaHttpAdapter.handler} forwards Lambda events to it.
 * This keeps application code identical across runtimes:
 *
 * ```ts
 * const adapter = new LambdaHttpAdapter();
 * const app = new Application(adapter, router.handle);
 * void app.listen(0);
 *
 * export const handler = adapter.handler;
 * ```
 *
 * Events that arrive before `listen()` resolves are held until it does, so a
 * cold start never drops the first request.
 */
export class LambdaHttpAdapter implements HttpAdapter {
  readonly handler: LambdaHandler;

  private resolveHandler!: (handler: HttpHandler) => void;
  private readonly pendingHandler: Promise<HttpHandler>;

  constructor(options: ToLambdaHandlerOptions = {}) {
    this.pendingHandler = new Promise((resolve) => {
      this.resolveHandler = resolve;
    });

    this.handler = toLambdaHandler(async (request) => {
      const handler = await this.pendingHandler;

      return handler(request);
    }, options);
  }

  listen(_port: number, handler: HttpHandler): HttpServer {
    this.resolveHandler(handler);

    return {
      close: () => {},
    };
  }
}
