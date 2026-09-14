export const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

const httpMethods = new Set<string>(HTTP_METHODS);

export function toHttpMethod(method: string): HttpMethod | undefined {
  const normalizedMethod = method.toUpperCase();

  if (!httpMethods.has(normalizedMethod)) {
    return undefined;
  }

  return normalizedMethod as HttpMethod;
}
