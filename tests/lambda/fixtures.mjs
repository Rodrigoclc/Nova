/**
 * Real-world shaped Lambda Function URL events (payload format 2.0), as
 * delivered by AWS. Values were anonymised but keep the exact structure.
 */
export function functionUrlEvent(overrides = {}) {
  return {
    version: "2.0",
    routeKey: "$default",
    rawPath: "/users/42",
    rawQueryString: "tag=a&tag=b&page=2",
    cookies: ["session=abc123", "theme=dark"],
    headers: {
      "content-length": "0",
      "x-amzn-tls-version": "TLSv1.3",
      "x-forwarded-proto": "https",
      "x-forwarded-port": "443",
      "x-forwarded-for": "203.0.113.10",
      "x-amzn-tls-cipher-suite": "TLS_AES_128_GCM_SHA256",
      "x-amzn-trace-id": "Root=1-6720c4c1-0a1b2c3d4e5f60718293a4b5",
      host: "abcdefghijklmnopqrstuvwxyz012345.lambda-url.us-east-1.on.aws",
      Accept: "application/json",
      "user-agent": "curl/8.4.0",
    },
    queryStringParameters: { tag: "a,b", page: "2" },
    requestContext: {
      accountId: "anonymous",
      apiId: "abcdefghijklmnopqrstuvwxyz012345",
      domainName:
        "abcdefghijklmnopqrstuvwxyz012345.lambda-url.us-east-1.on.aws",
      domainPrefix: "abcdefghijklmnopqrstuvwxyz012345",
      http: {
        method: "GET",
        path: "/users/42",
        protocol: "HTTP/1.1",
        sourceIp: "203.0.113.10",
        userAgent: "curl/8.4.0",
      },
      requestId: "7a1e9c40-1f9b-4a4e-9a3f-2d6b7c3e5f10",
      routeKey: "$default",
      stage: "$default",
      time: "29/Oct/2024:12:00:01 +0000",
      timeEpoch: 1730203201000,
    },
    isBase64Encoded: false,
    ...overrides,
  };
}
