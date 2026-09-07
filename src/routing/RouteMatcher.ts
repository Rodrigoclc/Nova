import type { RouteParams } from "./Route.js";

type StaticRouteSegment = {
  readonly kind: "static";
  readonly value: string;
};

type ParameterRouteSegment = {
  readonly kind: "parameter";
  readonly name: string;
};

type RouteSegment = StaticRouteSegment | ParameterRouteSegment;

export interface CompiledRoutePattern {
  readonly path: string;
  readonly segments: readonly RouteSegment[];
  readonly signature: string;
  readonly specificity: readonly number[];
}

const parameterPattern = /^\{([A-Za-z_][A-Za-z0-9_]*)\}$/;

function splitPath(path: string): string[] {
  if (!path.startsWith("/")) {
    throw new Error(`Route path must start with "/": ${path}`);
  }

  if (path === "/") {
    return [];
  }

  return path.slice(1).split("/");
}

export function compileRoutePattern(path: string): CompiledRoutePattern {
  const parameterNames = new Set<string>();
  const segments = splitPath(path).map<RouteSegment>((segment) => {
    const parameterMatch = parameterPattern.exec(segment);

    if (parameterMatch) {
      const name = parameterMatch[1];

      if (name === undefined) {
        throw new Error(`Invalid route parameter in path: ${path}`);
      }

      if (parameterNames.has(name)) {
        throw new Error(`Duplicate route parameter "${name}" in path: ${path}`);
      }

      parameterNames.add(name);

      return {
        kind: "parameter",
        name,
      };
    }

    if (segment.includes("{") || segment.includes("}")) {
      throw new Error(`Invalid route parameter syntax in path: ${path}`);
    }

    return {
      kind: "static",
      value: segment,
    };
  });

  return {
    path,
    segments,
    signature: segments
      .map((segment) =>
        segment.kind === "static" ? `s:${segment.value}` : "p",
      )
      .join("/"),
    specificity: segments.map((segment) =>
      segment.kind === "static" ? 1 : 0,
    ),
  };
}

export function matchCompiledRoute(
  pattern: CompiledRoutePattern,
  path: string,
): RouteParams | undefined {
  const pathSegments = splitPath(path);

  if (pattern.segments.length !== pathSegments.length) {
    return undefined;
  }

  const params: Record<string, string> = Object.create(null) as Record<
    string,
    string
  >;

  for (let index = 0; index < pattern.segments.length; index += 1) {
    const routeSegment = pattern.segments[index];
    const pathSegment = pathSegments[index];

    if (routeSegment === undefined || pathSegment === undefined) {
      return undefined;
    }

    if (routeSegment.kind === "static") {
      if (routeSegment.value !== pathSegment) {
        return undefined;
      }

      continue;
    }

    params[routeSegment.name] = pathSegment;
  }

  return { ...params };
}

export function matchPath(
  pattern: string,
  path: string,
): RouteParams | undefined {
  return matchCompiledRoute(compileRoutePattern(pattern), path);
}
