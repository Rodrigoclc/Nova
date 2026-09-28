import type { ApplicationResponse } from "./ApplicationResponse.js";
import type { RequestContext } from "./RequestContext.js";

export type RequestHandler<TBody = unknown, TResponse = unknown> = (
  request: RequestContext<TBody>,
) => ApplicationResponse<TResponse> | Promise<ApplicationResponse<TResponse>>;
