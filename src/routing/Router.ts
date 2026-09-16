import type {
  HttpHandler,
  HttpRequest,
  HttpResponse,
} from "../core/http/index.js";
import {
  RequestPipeline,
  type RequestContext,
  type RequestHandler,
  type RequestPipelineOptions,
} from "../core/request/index.js";
import { toHttpMethod, type HttpMethod } from "./HttpMethod.js";
import type { RouteDefinition, RouteMatch } from "./Route.js";
import {
  compileRoutePattern,
  matchCompiledRoute,
  type CompiledRoutePattern,
} from "./RouteMatcher.js";

type RegisteredRoute = {
  readonly definition: RouteDefinition;
  readonly pattern: CompiledRoutePattern;
};

function eraseRequestHandler<TBody, TResponse>(
  handler: RequestHandler<TBody, TResponse>,
): RequestHandler {
  return (request) => handler(request as RequestContext<TBody>);
}

function isMoreSpecific(
  candidate: CompiledRoutePattern,
  current: CompiledRoutePattern,
): boolean {
  const length = Math.min(
    candidate.specificity.length,
    current.specificity.length,
  );

  for (let index = 0; index < length; index += 1) {
    const candidateValue = candidate.specificity[index];
    const currentValue = current.specificity[index];

    if (candidateValue === currentValue) {
      continue;
    }

    return (candidateValue ?? 0) > (currentValue ?? 0);
  }

  return candidate.specificity.length > current.specificity.length;
}

export class Router {
  private readonly routes: RegisteredRoute[] = [];
  private readonly routeKeys = new Set<string>();
  private readonly pipeline: RequestPipeline;

  constructor(options: RequestPipelineOptions = {}) {
    this.pipeline = new RequestPipeline(options);
  }

  readonly handle: HttpHandler = async (
    request: HttpRequest,
  ): Promise<HttpResponse> => {
    const match = this.match(request.method, request.path);

    if (!match) {
      return {
        statusCode: 404,
        body: "Not Found",
      };
    }

    return this.pipeline.handle(request, match.params, match.route.handler);
  };

  register<TBody = unknown, TResponse = unknown>(
    method: HttpMethod,
    path: string,
    handler: RequestHandler<TBody, TResponse>,
  ): this {
    const normalizedMethod = toHttpMethod(method);

    if (!normalizedMethod) {
      throw new Error(`Unsupported HTTP method: ${method}`);
    }

    const pattern = compileRoutePattern(path);
    const routeKey = `${normalizedMethod} ${pattern.signature}`;

    if (this.routeKeys.has(routeKey)) {
      throw new Error(
        `Duplicate route for ${normalizedMethod} ${path}. A route with the same matching pattern is already registered.`,
      );
    }

    this.routes.push({
      definition: {
        method: normalizedMethod,
        path,
        handler: eraseRequestHandler(handler),
      },
      pattern,
    });
    this.routeKeys.add(routeKey);

    return this;
  }

  get<TBody = unknown, TResponse = unknown>(
    path: string,
    handler: RequestHandler<TBody, TResponse>,
  ): this {
    return this.register("GET", path, handler);
  }

  post<TBody = unknown, TResponse = unknown>(
    path: string,
    handler: RequestHandler<TBody, TResponse>,
  ): this {
    return this.register("POST", path, handler);
  }

  put<TBody = unknown, TResponse = unknown>(
    path: string,
    handler: RequestHandler<TBody, TResponse>,
  ): this {
    return this.register("PUT", path, handler);
  }

  patch<TBody = unknown, TResponse = unknown>(
    path: string,
    handler: RequestHandler<TBody, TResponse>,
  ): this {
    return this.register("PATCH", path, handler);
  }

  delete<TBody = unknown, TResponse = unknown>(
    path: string,
    handler: RequestHandler<TBody, TResponse>,
  ): this {
    return this.register("DELETE", path, handler);
  }

  head<TBody = unknown, TResponse = unknown>(
    path: string,
    handler: RequestHandler<TBody, TResponse>,
  ): this {
    return this.register("HEAD", path, handler);
  }

  options<TBody = unknown, TResponse = unknown>(
    path: string,
    handler: RequestHandler<TBody, TResponse>,
  ): this {
    return this.register("OPTIONS", path, handler);
  }

  match(method: string, path: string): RouteMatch | undefined {
    const normalizedMethod = toHttpMethod(method);

    if (!normalizedMethod) {
      return undefined;
    }

    let bestMatch:
      | {
          readonly route: RegisteredRoute;
          readonly params: RouteMatch["params"];
        }
      | undefined;

    for (const route of this.routes) {
      if (route.definition.method !== normalizedMethod) {
        continue;
      }

      const params = matchCompiledRoute(route.pattern, path);

      if (!params) {
        continue;
      }

      if (
        !bestMatch ||
        isMoreSpecific(route.pattern, bestMatch.route.pattern)
      ) {
        bestMatch = {
          route,
          params,
        };
      }
    }

    if (!bestMatch) {
      return undefined;
    }

    return {
      route: bestMatch.route.definition,
      params: bestMatch.params,
    };
  }
}
