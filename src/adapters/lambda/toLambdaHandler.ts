import type { HttpHandler } from "../../core/http/index.js";
import type {
  LambdaFunctionUrlEvent,
  LambdaFunctionUrlResult,
  LambdaHandler,
} from "./LambdaEvent.js";
import { fromLambdaEvent, toLambdaResult } from "./translate.js";

export interface ToLambdaHandlerOptions {
  /**
   * Called when the Nova handler throws. Defaults to logging the error and
   * answering 500 with an empty body so the Function URL never hangs.
   */
  readonly onError?: (
    error: unknown,
    event: LambdaFunctionUrlEvent,
  ) => LambdaFunctionUrlResult | Promise<LambdaFunctionUrlResult>;
}

/**
 * Wraps a Nova {@link HttpHandler} as an AWS Lambda handler compatible with
 * Function URLs and API Gateway HTTP APIs (payload format 2.0).
 *
 * ```ts
 * import { toLambdaHandler } from "nova/lambda";
 * export const handler = toLambdaHandler(router.handle);
 * ```
 */
export function toLambdaHandler(
  handler: HttpHandler,
  options: ToLambdaHandlerOptions = {},
): LambdaHandler {
  const onError = options.onError ?? defaultOnError;

  return async (event) => {
    try {
      const request = fromLambdaEvent(event);
      const response = await handler(request);

      return toLambdaResult(response);
    } catch (error) {
      return onError(error, event);
    }
  };
}

function defaultOnError(error: unknown): LambdaFunctionUrlResult {
  console.error("Unhandled error in Nova's Lambda adapter.", error);

  return { statusCode: 500 };
}
