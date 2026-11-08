# Nova

Object-oriented HTTP framework for TypeScript, with controllers, decorators, DTOs, and multi-runtime support.

> **Project status:** Nova is experimental and under active design. The public API shown below represents the target developer experience and is not implemented yet.

## Vision

Nova aims to provide a familiar, strongly typed, object-oriented developer experience for engineers coming from ecosystems such as .NET and Java, while keeping the framework core independent from the underlying JavaScript runtime.

For developers building their first back end, Nova is a way to be **organized from day one**: controllers and DTOs are how you structure an API, not a prerequisite you need to know beforehand. Tutorials in Portuguese start from zero and end with the API running on a public URL.

The target API is intentionally controller-first:

```ts
@Controller('/users')
export class UserController extends Controller {
  @Post('/')
  async create(
    payload: CreateUserRequest,
  ): Promise<ApiResponse<CreateUserResponse>> {
    return this.created(...)
  }
}
```

Application code should not need to work directly with Node.js `IncomingMessage`, `ServerResponse`, Bun server primitives, request streams, or manual response serialization.

## Design principles

- **Object-oriented developer experience.** Controllers, DTOs, and application-facing APIs should feel natural to developers used to class-oriented back-end frameworks.
- **Runtime-neutral core.** The core must not depend on `node:http`, `Bun.serve()`, or other runtime-specific HTTP APIs.
- **Multi-runtime adapters.** Node.js and Bun are first-class runtime targets through dedicated adapters.
- **Convention over configuration.** Nova should provide a clear and predictable default way to build applications without preventing well-defined extension points.
- **Composition first for extensibility.** Middleware, hooks, adapters, and similar extension mechanisms should favor composition. Inheritance is reserved for small, intentional abstractions such as a base `Controller`.
- **Strong contracts.** Routing, request binding, validation, serialization, and OpenAPI should eventually derive from shared application metadata instead of duplicating configuration.
- **Small core.** Features should be added only when they belong to the framework's core responsibilities.

## Intended architecture

```text
Application code

Controllers
DTOs
Services
Repositories
     |
     v
Nova core

Application
Routing
Decorators
Request binding
Validation
Serialization
     |
     v
HTTP adapter
   /     |      \
  /      |       \
Node.js  Bun      AWS Lambda
node:http Bun.serve() Function URL event
```

Runtime-specific APIs must remain behind adapters so that controllers and the framework core do not depend on a particular runtime.

## Runtime targets

Nova plans to support:

- Node.js 22 and newer
- Bun through a native Bun adapter
- AWS Lambda (Function URLs and API Gateway HTTP APIs, payload v2) through `nova/lambda`

Runtime support will be verified by Nova's own test suite as adapters are implemented.

## Project structure

```text
src/
├── core/
│   ├── application/
│   ├── controller/
│   └── index.ts
├── routing/
├── decorators/
├── adapters/
│   ├── node/
│   ├── bun/
│   └── lambda/
└── index.ts
```

Nova currently uses a single package. Internal boundaries are being designed so that components can be extracted into independent packages later if there is a concrete need.

## Development

Requirements:

- Node.js 22+
- npm

Install dependencies:

```bash
npm install
```

Type-check the project:

```bash
npm run typecheck
```

Build declarations and JavaScript output:

```bash
npm run build
```

## Deploy

A Nova application is a plain `HttpHandler`, so the same code runs on a long-lived server and on serverless platforms.

The recommended path for beginners is the **Subir** platform (`subir deploy`), which detects a Nova project and wires `nova/lambda` automatically with zero configuration. It is the shortest path, not the only one: any Lambda Function URL (payload format 2.0) or API Gateway HTTP API works with the adapter directly.

```ts
import { Application, Router } from "nova";
import { NodeHttpAdapter } from "nova/node";
import { toLambdaHandler } from "nova/lambda";

const router = new Router();
router.get("/", () => ({ statusCode: 200, body: "Olá, mundo!" }));

// Local development: a real HTTP server.
if (process.env.SUBIR !== "1") {
  await new Application(new NodeHttpAdapter(), router.handle).listen(
    Number(process.env.PORT ?? 3000),
  );
}

// Serverless: the platform invokes this export once per request.
export const handler = toLambdaHandler(router.handle);
```

`nova/lambda` also exposes `LambdaHttpAdapter`, an `HttpAdapter` that plugs into `Application` like the other runtimes, plus `fromLambdaEvent` and `toLambdaResult` for custom integrations.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the planned implementation phases.

## Contributing

Nova is still in its early design stage. Contributions, architectural discussion, bug reports, and feature proposals are welcome.

See [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

## License

Nova is licensed under the [MIT License](./LICENSE).
