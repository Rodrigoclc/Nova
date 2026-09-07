import type { Server } from "node:http";

import type { HttpServer } from "../../core/http/index.js";

export class NodeHttpServer implements HttpServer {
  constructor(private readonly server: Server) {}

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}
