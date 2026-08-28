# Contributing to Nova

Thanks for helping improve Nova. The project is still experimental, so architectural clarity is currently more important than feature volume.

## Before contributing

Please read:

- [README.md](./README.md) for the project vision
- [ROADMAP.md](./ROADMAP.md) for current implementation phases

For bugs and concrete feature requests, open an Issue using the provided templates. Open-ended design questions and architectural proposals should be discussed before becoming implementation work.

## Development requirements

- Node.js 22+
- npm

Clone the repository and install dependencies:

```bash
git clone https://github.com/Rodrigoclc/Nova.git
cd Nova
npm install
```

Type-check:

```bash
npm run typecheck
```

Build:

```bash
npm run build
```

## Architectural rules

These rules should remain true unless an explicit architectural decision changes them:

1. `src/core` must not import `node:http`, Bun-specific APIs, or another runtime-specific HTTP implementation.
2. Runtime-specific behavior belongs under `src/adapters`.
3. Application-facing APIs should favor the object-oriented developer experience described in the README.
4. Extensibility should favor composition. Inheritance should be deliberate and shallow.
5. Public API additions require more scrutiny than internal implementation changes because they become compatibility commitments.
6. Avoid adding abstractions before there is a concrete framework responsibility that requires them.

## Branches and pull requests

The repository uses `main` as the stable development branch.

For changes:

1. Create a focused branch from `main`.
2. Keep the change scoped to one responsibility.
3. Add or update tests when behavior is introduced or changed.
4. Run `npm run typecheck` and `npm run build` before opening a pull request.
5. Explain architectural trade-offs in the pull request when the change affects public contracts or framework boundaries.

Long-lived `develop` branches are intentionally avoided at this stage.

## Commit convention

Nova uses Conventional Commits.

Examples:

```text
feat: add route registry
fix: handle duplicated routes
docs: document controller lifecycle
refactor: extract request binder
test: add route matcher tests
chore: configure TypeScript
```

Common types:

- `feat` — a new capability
- `fix` — a defect correction
- `docs` — documentation only
- `refactor` — internal code change without intended behavior change
- `test` — tests only
- `chore` — maintenance, tooling, or repository configuration

Breaking public API changes should be made explicit in the commit or pull request description.

## Versioning

Nova follows Semantic Versioning.

The project starts in the `0.x` development line. A version number in `package.json` does not imply that the package has already been published to npm.

## Issues and discussions

Use Issues for work that is concrete enough to be implemented or reproduced:

- bugs
- concrete feature requests
- implementation tasks

Use GitHub Discussions for open-ended topics such as:

- architectural alternatives
- API design proposals
- questions
- naming decisions
- requests for feedback

Once a discussion reaches a concrete decision, an Issue can be created to track implementation.
