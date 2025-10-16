// Generic API Response shape ที่เราใช้ภายในฝั่ง FE (และหวังว่าจะตรงกับ BE)
//
// รูปแบบหลัก: { ok: true, data: T } หรือ { ok: false, error: { message, code? } }

export type ApiOk<T = unknown> = {
  ok: true;
  data: T;
  meta?: PaginationMeta;
};

export type ApiFail = {
  ok: false;
  error: {
    message: string;
    code?: string | number;
    details?: unknown;
  };
};

export type ApiResponse<T = unknown> = ApiOk<T> | ApiFail;

// Pagination meta (ถ้า endpoint นั้นเป็นแบบ list)
export type PaginationMeta = {
  page?: number;
  pageSize?: number;
  total?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
};

// Utility type: ดึง data ออกมาง่าย ๆ
export type UnwrapApi<T> = T extends ApiResponse<infer D> ? D : never;
