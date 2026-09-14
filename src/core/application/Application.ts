import type { HttpAdapter, HttpHandler, HttpServer } from "../http/index.js";

export class Application {
  constructor(
    private readonly adapter: HttpAdapter,
    private readonly defaultHandler?: HttpHandler,
  ) {}

  async listen(port: number, handler?: HttpHandler): Promise<HttpServer> {
    const resolvedHandler = handler ?? this.defaultHandler;

    if (!resolvedHandler) {
      throw new Error(
        "Application requires an HTTP handler. Pass one to the constructor or to listen().",
      );
    }

    return this.adapter.listen(port, resolvedHandler);
  }
}
