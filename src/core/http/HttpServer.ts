export interface HttpServer {
  close(): void | Promise<void>;
}
