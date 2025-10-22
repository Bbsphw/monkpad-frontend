// src/lib/errors.ts

/**
 * 🔧 Centralized error utilities สำหรับ API Route handlers และ server utilities.
 * จุดประสงค์หลัก:
 * - รวม class สำหรับ API Error (เช่น 400, 401, 403, 404, 409, 422)
 * - มี helper สำหรับแปลง error → JSON Response ที่เป็นมาตรฐาน
 * - มีตัวช่วย extract ข้อความจาก ZodError (เวลาตรวจ validate body)
 */

import { ZodError } from "zod";

/* -------------------------------------------------------------------------- */
/*                            Custom API Error Classes                        */
/* -------------------------------------------------------------------------- */

/**
 * 🌟 Base class สำหรับ error ที่มี HTTP status + code
 * - `status`: HTTP Status code (เช่น 400, 401)
 * - `code`: optional code สำหรับระบุประเภทเฉพาะ เช่น "USER_NOT_FOUND"
 * - `cause`: ใช้เก็บ error เดิมไว้ debug ภายหลังได้
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

/**
 * ⚠️ กลุ่ม subclass แต่ละตัวแทน HTTP error มาตรฐาน:
 * - ใช้งานใน route handler เช่น throw new BadRequestError("missing field")
 * - ทุกตัวสืบทอดจาก ApiError
 */
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

/* -------------------------------------------------------------------------- */
/*                           JSON Response Helpers                            */
/* -------------------------------------------------------------------------- */

/**
 * 🧱 jsonError()
 * ใช้สร้าง Response JSON มาตรฐานฝั่ง error
 * รูปแบบ:
 * ```json
 * {
 *   "ok": false,
 *   "error": { "message": "...", "code": "..." }
 * }
 * ```
 */
export function jsonError(
  status: number,
  message: string,
  code?: string | number,
  details?: unknown
): Response {
  return Response.json(
    { ok: false, error: { message, code, details } },
    { status }
  );
}

/**
 * ✅ jsonOk()
 * ใช้สร้าง Response JSON มาตรฐานฝั่ง success
 * รูปแบบ:
 * ```json
 * { "ok": true, "data": { ... }, "meta": { ... } }
 * ```
 * meta จะเพิ่มเฉพาะเมื่อมีค่า (ใช้สำหรับ pagination/list)
 */
export function jsonOk<T>(
  data: T,
  init?: ResponseInit & { meta?: unknown }
): Response {
  const { meta, ...rest } = init ?? {};
  return Response.json(
    meta ? { ok: true, data, meta } : { ok: true, data },
    rest
  );
}

/* -------------------------------------------------------------------------- */
/*                             Error Handling Core                            */
/* -------------------------------------------------------------------------- */

/**
 * 🧩 handleRouteError()
 * ใช้ใน try/catch ของ Route Handler (API Routes)
 * - ถ้าเป็น ApiError → แปลงเป็น jsonError(status, message)
 * - ถ้าเป็น error ทั่วไป → log แล้วตอบ 500 Internal Server Error
 *
 * Example:
 * ```ts
 * export async function POST(req: Request) {
 *   try {
 *     ...
 *   } catch (e) {
 *     return handleRouteError(e);
 *   }
 * }
 * ```
 */
export function handleRouteError(err: unknown): Response {
  if (err instanceof ApiError) {
    return jsonError(err.status, err.message, err.code, err.cause);
  }

  // Upstream fetch error หรือ error ทั่วไป
  console.error("[RouteError]", err);
  return jsonError(500, "Internal Server Error");
}

/**
 * 🧭 assert()
 * ช่วยเช็กเงื่อนไขและโยน BadRequestError อัตโนมัติ
 * ใช้คล้าย assert ของ node แต่ตอบกลับเป็น error มาตรฐานของ API
 *
 * Example:
 * ```ts
 * assert(userId, "User ID required")
 * ```
 */
export function assert(
  condition: unknown,
  message = "Invalid request"
): asserts condition {
  if (!condition) throw new BadRequestError(message);
}

/* -------------------------------------------------------------------------- */
/*                          Zod Validation Utilities                          */
/* -------------------------------------------------------------------------- */

/**
 * 🧩 extractZodMessage()
 * ดึงข้อความ error ที่ “อ่านง่าย” ที่สุดจาก ZodError
 * รองรับ:
 * - ZodError.flatten() → formErrors[0]
 * - ถ้าไม่มี → ดึง message แรกจาก issues
 * - fallback → "Invalid request body"
 */
export function extractZodMessage(e: ZodError): string {
  if (typeof e.flatten === "function") {
    const flat = e.flatten();
    if (flat.formErrors?.length) return flat.formErrors[0];
  }

  const firstIssue = e.issues?.[0];
  if (firstIssue?.message) return firstIssue.message;

  return "Invalid request body";
}

/**
 * 🎯 handleZodError()
 * แปลง ZodError → Response 422 (Unprocessable Entity)
 * ใช้เมื่อ validate body/query แล้วไม่ผ่าน
 */
export function handleZodError(e: ZodError): Response {
  const message = extractZodMessage(e);
  return jsonError(422, message);
}
