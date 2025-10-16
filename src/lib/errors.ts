/**
 * Centralized error utilities for API Route handlers and server utilities.
 * - ApiError class hierarchy (BadRequest, Unauthorized, etc.)
 * - handleRouteError: convert thrown errors into consistent JSON responses
 */

export class ApiError extends Error {
  status: number;
  code?: string | number;
  cause?: unknown;

  constructor(
    status: number,
    message: string,
    opts?: { code?: string | number; cause?: unknown }
  ) {
    super(message);
    this.status = status;
    this.code = opts?.code;
    this.cause = opts?.cause;
  }
}

export class BadRequestError extends ApiError {
  constructor(
    message = "Bad Request",
    opts?: { code?: string | number; cause?: unknown }
  ) {
    super(400, message, opts);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(
    message = "Unauthorized",
    opts?: { code?: string | number; cause?: unknown }
  ) {
    super(401, message, opts);
  }
}

export class ForbiddenError extends ApiError {
  constructor(
    message = "Forbidden",
    opts?: { code?: string | number; cause?: unknown }
  ) {
    super(403, message, opts);
  }
}

export class NotFoundError extends ApiError {
  constructor(
    message = "Not Found",
    opts?: { code?: string | number; cause?: unknown }
  ) {
    super(404, message, opts);
  }
}

export class ConflictError extends ApiError {
  constructor(
    message = "Conflict",
    opts?: { code?: string | number; cause?: unknown }
  ) {
    super(409, message, opts);
  }
}

export class UnprocessableEntityError extends ApiError {
  constructor(
    message = "Unprocessable Entity",
    opts?: { code?: string | number; cause?: unknown }
  ) {
    super(422, message, opts);
  }
}

/**
 * สร้าง Response JSON มาตรฐาน error
 */
export function jsonError(
  status: number,
  message: string,
  code?: string | number,
  details?: unknown
) {
  return Response.json(
    { ok: false, error: { message, code, details } },
    { status }
  );
}

/**
 * สร้าง Response JSON มาตรฐาน success
 */
export function jsonOk<T>(data: T, init?: ResponseInit & { meta?: unknown }) {
  const { meta, ...rest } = init ?? {};
  return Response.json(
    meta ? { ok: true, data, meta } : { ok: true, data },
    rest
  );
}

/**
 * ใช้ใน try/catch ของ Route Handler
 */
export function handleRouteError(err: unknown): Response {
  if (err instanceof ApiError) {
    return jsonError(err.status, err.message, err.code, err.cause);
  }
  // Upstream fetch error หรือ error ทั่วไป
  // eslint-disable-next-line no-console
  console.error("[RouteError]", err);
  return jsonError(500, "Internal Server Error");
}

/**
 * ตัวช่วย assert (throw 400)
 */
export function assert(
  condition: unknown,
  message = "Invalid request"
): asserts condition {
  if (!condition) throw new BadRequestError(message);
}
