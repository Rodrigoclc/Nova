# Nova

Object-oriented HTTP framework for TypeScript, with controllers, decorators, DTOs, and multi-runtime support.

> **Project status:** Nova is experimental and under active design. The public API shown below represents the target developer experience and is not implemented yet.

## Vision

Nova aims to provide a familiar, strongly typed, object-oriented developer experience for engineers coming from ecosystems such as .NET and Java, while keeping the framework core independent from the underlying JavaScript runtime.

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
   /      \
  /        \
Node.js     Bun
node:http   Bun.serve()
```

Runtime-specific APIs must remain behind adapters so that controllers and the framework core do not depend on a particular runtime.

## Runtime targets

Nova plans to support:

- Node.js 22 and newer
- Bun through a native Bun adapter

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
│   └── bun/
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

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the planned implementation phases.

## Contributing

Nova is still in its early design stage. Contributions, architectural discussion, bug reports, and feature proposals are welcome.

See [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

## License

Nova is licensed under the [MIT License](./LICENSE).
