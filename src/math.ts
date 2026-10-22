export const LIMIT = 1_000_000_000;
/** 次方結果的上限，與乘法器的最大結果 10^18 一致 */
export const RESULT_LIMIT = 10n ** 18n;

export type ErrorCode = "INVALID_INPUT" | "DIVISION_BY_ZERO" | "OVERFLOW";
export type Ok<T> = { ok: true; result: T };
export type Err = { ok: false; error: ErrorCode; detail: string };
export type Result<T> = Ok<T> | Err;

/** 對應 Python 的 type(value).__name__，用於錯誤訊息 */
function typeName(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "number" && !Number.isInteger(value)) {
    return Number.isFinite(value) ? "float" : String(value);
  }
  return Array.isArray(value) ? "array" : typeof value;
}

/** a, b 必須是整數（不可為 boolean），且 -10^9 <= a, b <= 10^9；先檢查 a 再檢查 b */
function validate(a: unknown, b: unknown): Err | null {
  for (const [name, value] of [["a", a], ["b", b]] as const) {
    if (typeof value !== "number" || !Number.isInteger(value)) {
      return { ok: false, error: "INVALID_INPUT", detail: `${name} must be int, got ${typeName(value)}` };
    }
    if (value < -LIMIT || value > LIMIT) {
      return { ok: false, error: "INVALID_INPUT", detail: `${name} out of range [-${LIMIT}, ${LIMIT}]` };
    }
  }
  return null;
}

/** 加法器：結果範圍 -2*10^9 ~ 2*10^9，number 可精確表示 */
export function add(a: number, b: number): Result<number> {
  const err = validate(a, b);
  if (err) return err;
  return { ok: true, result: a + b };
}

/**
 * 乘法器：結果最大可達 10^18，超過 Number.MAX_SAFE_INTEGER（約 9*10^15），
 * 因此用 bigint 計算，確保和 Python 的 int 一樣精確。
 */
export function multiply(a: number, b: number): Result<bigint> {
  const err = validate(a, b);
  if (err) return err;
  return { ok: true, result: BigInt(a) * BigInt(b) };
}

/** 除法器：先檢查型別與範圍，再檢查除數是否為 0 */
export function divide(a: number, b: number): Result<number> {
  const err = validate(a, b);
  if (err) return err;
  if (b === 0) {
    return { ok: false, error: "DIVISION_BY_ZERO", detail: "b must not be 0" };
  }
  return { ok: true, result: a / b };
}

/**
 * 次方器：a 的 b 次方。先檢查型別與範圍，再要求 b >= 0（負指數結果是小數，不支援）。
 * 結果用 bigint，且 |結果| 不可超過 10^18，否則回傳 OVERFLOW。0 的 0 次方為 1（與 Python 相同）。
 */
export function power(a: number, b: number): Result<bigint> {
  const err = validate(a, b);
  if (err) return err;
  if (b < 0) {
    return { ok: false, error: "INVALID_INPUT", detail: "b must be >= 0" };
  }
  // |a| <= 1 時結果只會是 -1、0、1，bigint 的 ** 用平方乘法，b = 10^9 也只需約 30 步
  if (Math.abs(a) <= 1) {
    return { ok: true, result: BigInt(a) ** BigInt(b) };
  }
  // |a| >= 2 時最多乘 60 次就會超過上限（2^60 > 10^18），所以逐次相乘並提早停止，
  // 避免先算出 2^(10^9) 這種巨大數字
  const base = BigInt(a);
  let result = 1n;
  for (let i = 0; i < b; i++) {
    result *= base;
    if (result > RESULT_LIMIT || result < -RESULT_LIMIT) {
      return { ok: false, error: "OVERFLOW", detail: `result out of range [-${RESULT_LIMIT}, ${RESULT_LIMIT}]` };
    }
  }
  return { ok: true, result };
}
