// src/lib/types/api-response.d.ts

/**
 * ✅ โครงสร้าง OK: ใช้ generic T เก็บ payload หลัก
 * - แนะนำให้ BE คง field นี้เสมอเพื่อความสม่ำเสมอ
 * - meta ใช้สำหรับ list/pagination เท่านั้น (ออปชัน)
 */
export type ApiOk<T = unknown> = {
  ok: true;
  data: T;
  /** ข้อมูลเสริม เช่น pagination */
  meta?: PaginationMeta;
};

/**
 * ❌ โครงสร้าง Fail: รวม message + code (+ details ถ้ามี)
 * - code ควรเป็น enum ที่ FE เข้าใจได้ (เช่น 'VALIDATION_ERROR', 4001, …)
 * - details อาจเป็นข้อมูล validate error ต่าง ๆ
 */
export type ApiFail = {
  ok: false;
  error: {
    message: string;
    code?: string | number;
    details?: unknown;
  };
};

/** ยูเนียนผลลัพธ์มาตรฐาน: OK หรือ FAIL */
export type ApiResponse<T = unknown> = ApiOk<T> | ApiFail;

/** ข้อมูลหน้า (สำหรับ endpoint แบบ list) */
export type PaginationMeta = {
  page?: number;
  pageSize?: number;
  total?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
};

/** ดึงชนิดของ data ออกมาอย่างรวดเร็วจาก ApiResponse<T> */
export type UnwrapApi<T> = T extends ApiResponse<infer D> ? D : never;

/* -------------------- (แนะนำ) Utilities เสริมให้ใช้จริงสะดวกขึ้น -------------------- */

/** type guard: ตรวจว่า OK */
export function isOk<T>(res: ApiResponse<T>): res is ApiOk<T> {
  return (res as ApiOk<T>)?.ok === true;
}

/** type guard: ตรวจว่า FAIL */
export function isFail<T>(res: ApiResponse<T>): res is ApiFail {
  return (res as ApiFail)?.ok === false;
}

/** Error class สำหรับโยนต่อ พร้อม code/details */
export class ApiError extends Error {
  code?: string | number;
  details?: unknown;
  constructor(message: string, code?: string | number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

/**
 * helper: คาดหวังว่า response ต้อง OK
 * - ถ้า FAIL จะโยน ApiError ออกมา
 * - ใช้ใน service/hook เพื่อให้ consumer ได้ payload ที่เป็น T ตรง ๆ
 */
export function expectOk<T>(res: ApiResponse<T>): T {
  if (isOk(res)) return res.data;
  throw new ApiError(res.error.message, res.error.code, res.error.details);
}

/**
 * (ออปชัน) ชนิดสำหรับ list ที่อยากให้ meta เป็น "ต้องมี" เสมอ
 * ช่วยบังคับให้ BE/FE ส่ง meta ครบใน endpoint แบบ list
 */
export type ApiOkList<T = unknown> = ApiOk<ReadonlyArray<T>> & {
  meta: Required<Pick<PaginationMeta, "page" | "pageSize" | "total">> & {
    hasNext?: boolean;
    hasPrev?: boolean;
  };
};
