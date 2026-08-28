# Nova Roadmap

This roadmap describes capability milestones, not release dates. The order may evolve as implementation exposes new architectural constraints.

## Phase 0 — Project foundation ✅

Establish the repository, development conventions, public vision, and initial architectural boundaries.

- Repository initialized as open source under the MIT license
- TypeScript project configured as ESM
- Minimum Node.js version defined as 22
- Single-package strategy established
- Runtime-neutral core and runtime adapter boundaries established
- Initial source structure established
- Project vision and architectural principles documented
- Contribution guidelines documented
- Bug and feature issue templates added
- Semantic Versioning adopted, beginning with the `0.x` development line
- Conventional Commits adopted

## Phase 1 — Core contracts

Define the runtime-neutral contracts that the rest of Nova will depend on.

Expected capabilities:

- Application bootstrap contract
- HTTP adapter contract
- Internal HTTP request contract
- Internal HTTP response contract
- Clear dependency direction between the core and runtime adapters
- Unit tests for core contracts where behavior exists

No Node.js or Bun-specific HTTP implementation should leak into the core.

## Phase 2 — HTTP adapters

Implement the first runtime integrations while preserving the contracts from Phase 1.

Expected capabilities:

- Node.js adapter built on `node:http`
- Bun adapter built on `Bun.serve()`
- Request and response translation between runtime APIs and Nova contracts
- Runtime compatibility tests

## Phase 3 — Routing

Introduce Nova's runtime-neutral routing model.

Expected capabilities:

- HTTP method definitions
- Route definitions and registry
- Static route matching
- Path parameter matching
- Duplicate route detection
- Runtime adapters delegating requests to the router

## Phase 4 — Request pipeline

Convert raw HTTP input into application-friendly data before invoking application handlers.

Expected capabilities:

- JSON body parsing
- Query parameter parsing
- Path parameter extraction
- Header access
- Request binding
- Response serialization
- Central error handling
- Body limits and malformed request handling

## Phase 5 — Controllers

Introduce the object-oriented application model.

Expected capabilities:

- Base `Controller`
- `ApiResponse<T>` contract
- Controller invocation
- Standard response helpers such as `ok`, `created`, `notFound`, and `noContent`
- Controllers isolated from runtime-specific HTTP APIs

## Phase 6 — Decorators

Reach the initial target developer experience.

Expected capabilities:

- `@Controller()`
- `@Get()`
- `@Post()`
- `@Put()`
- `@Patch()`
- `@Delete()`
- Decorator metadata translated into route definitions
- Controller discovery and registration strategy

Target API:

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

## Phase 7 — DTO binding and validation

Turn DTOs into executable application contracts rather than TypeScript-only annotations.

Expected capabilities:

- DTO construction and binding
- Runtime validation strategy
- Type conversion for path and query values
- Validation error format
- Shared metadata usable by validation and documentation

The exact strategy for runtime metadata versus compile-time TypeScript analysis must be decided before this phase is implemented.

## Phase 8 — OpenAPI

Generate API documentation from the same application metadata used by routing and validation.

Expected capabilities:

- OpenAPI document generation
- Request schemas
- Response schemas
- Route and status metadata
- Documentation endpoint
- Swagger-compatible UI integration

## Versioning

Nova follows [Semantic Versioning](https://semver.org/).

During the `0.x` series, the framework is considered experimental and public APIs may evolve quickly. Breaking changes must still be documented clearly.
