/**
 * Minimal, dependency-free typings for the AWS Lambda Function URL event and
 * result (payload format version 2.0). API Gateway HTTP APIs use the same
 * shape, so the adapter works with both.
 *
 * Only the fields Nova reads or writes are declared; unknown fields are kept
 * through index signatures so callers can pass real events untouched.
 */
export interface LambdaFunctionUrlEvent {
  readonly version?: string;
  readonly routeKey?: string;
  readonly rawPath: string;
  readonly rawQueryString?: string;
  readonly cookies?: readonly string[];
  readonly headers?: Readonly<Record<string, string | undefined>>;
  readonly queryStringParameters?: Readonly<Record<string, string | undefined>>;
  readonly requestContext: {
    readonly http: {
      readonly method: string;
      readonly path?: string;
      readonly protocol?: string;
      readonly sourceIp?: string;
      readonly userAgent?: string;
    };
    readonly [key: string]: unknown;
  };
  readonly body?: string | null;
  readonly isBase64Encoded?: boolean;
  readonly [key: string]: unknown;
}

export interface LambdaFunctionUrlResult {
  statusCode: number;
  headers?: Record<string, string>;
  cookies?: string[];
  body?: string;
  isBase64Encoded?: boolean;
}

export interface LambdaContext {
  readonly awsRequestId?: string;
  readonly functionName?: string;
  readonly [key: string]: unknown;
}

export type LambdaHandler = (
  event: LambdaFunctionUrlEvent,
  context?: LambdaContext,
) => Promise<LambdaFunctionUrlResult>;
