import type { HttpAdapter, HttpHandler, HttpServer } from "../http/index.js";

export class Application {
  constructor(private readonly adapter: HttpAdapter) {}

  async listen(port: number, handler: HttpHandler): Promise<HttpServer> {
    return this.adapter.listen(port, handler);
  }
}
