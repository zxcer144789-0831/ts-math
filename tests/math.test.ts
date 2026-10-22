// 對應上一章的 test_adder.py / test_multiply.py / test_divider.py
// 刻意傳錯型別的測試用 @ts-expect-error：證明 TypeScript 在「編譯期」就會擋下，
// 而 math.ts 的 validate() 在「執行期」也會擋下（例如從純 JS 或命令列呼叫時）。
import { add, divide, LIMIT, multiply, power, RESULT_LIMIT } from "../src/math";
import { run } from "../src/index";

const OUT_OF_RANGE = `out of range [-${LIMIT}, ${LIMIT}]`;
const OVERFLOW = { ok: false, error: "OVERFLOW", detail: `result out of range [-${RESULT_LIMIT}, ${RESULT_LIMIT}]` };

describe("add 加法器（test_adder.py）", () => {
  test("5 + 5", () => {
    expect(add(5, 5)).toEqual({ ok: true, result: 10 });
  });

  test("加 0", () => {
    expect(add(0, 4)).toEqual({ ok: true, result: 4 });
  });

  test("負數", () => {
    expect(add(-3, 4)).toEqual({ ok: true, result: 1 });
  });

  test("兩個都是最大值", () => {
    expect(add(10 ** 9, 10 ** 9)).toEqual({ ok: true, result: 2 * 10 ** 9 });
  });

  test("小數被拒絕", () => {
    expect(add(2.5, 4)).toEqual({ ok: false, error: "INVALID_INPUT", detail: "a must be int, got float" });
  });

  test("超大數被拒絕", () => {
    expect(add(4, 10 ** 100)).toEqual({ ok: false, error: "INVALID_INPUT", detail: `b ${OUT_OF_RANGE}` });
  });

  test("null 被拒絕（Python 的 None）", () => {
    // @ts-expect-error null 不是 number
    expect(add(null, 4)).toEqual({ ok: false, error: "INVALID_INPUT", detail: "a must be int, got null" });
  });

  test("字串被拒絕", () => {
    // @ts-expect-error string 不是 number
    expect(add("x", 4)).toEqual({ ok: false, error: "INVALID_INPUT", detail: "a must be int, got string" });
  });

  test("boolean 被拒絕", () => {
    // @ts-expect-error boolean 不是 number
    expect(add(true, 4)).toMatchObject({ ok: false, error: "INVALID_INPUT" });
  });
});

describe("multiply 乘法器（test_multiply.py）", () => {
  test("4 * 4", () => {
    expect(multiply(4, 4)).toEqual({ ok: true, result: 16n });
  });

  test("字串 x 乘 4 被拒絕", () => {
    // @ts-expect-error string 不是 number
    expect(multiply("x", 4)).toEqual({ ok: false, error: "INVALID_INPUT", detail: "a must be int, got string" });
  });

  test("未定義的變數 x：在呼叫 multiply 前就拋出 ReferenceError", () => {
    // Python 是 NameError；TypeScript 編譯期就報 "Cannot find name 'x'"，執行期則是 ReferenceError
    // @ts-expect-error x 未宣告
    expect(() => multiply(x, 4)).toThrow(ReferenceError);
  });

  test("boolean 被拒絕", () => {
    // @ts-expect-error boolean 不是 number
    expect(multiply(true, 4)).toMatchObject({ error: "INVALID_INPUT" });
  });

  test("超出範圍被拒絕", () => {
    expect(multiply(10 ** 9 + 1, 4)).toMatchObject({ error: "INVALID_INPUT" });
  });

  test("範圍邊界", () => {
    expect(multiply(10 ** 9, -(10 ** 9))).toEqual({ ok: true, result: -(10n ** 18n) });
  });

  // --- edge cases：單一輸入處於極端或特殊值 ---

  test("乘 0", () => {
    expect(multiply(0, 4)).toEqual({ ok: true, result: 0n });
  });

  test("負數", () => {
    expect(multiply(-3, 4)).toEqual({ ok: true, result: -12n });
  });

  test("小數被拒絕", () => {
    expect(multiply(2.5, 4)).toEqual({ ok: false, error: "INVALID_INPUT", detail: "a must be int, got float" });
  });

  test("4.0 在 JS 中就是整數 4（和 Python 不同，無法區分）", () => {
    // Python: multiply(4.0, 4) → INVALID_INPUT；JS 只有一種 number，4.0 === 4
    expect(multiply(4.0, 4)).toEqual({ ok: true, result: 16n });
  });

  test("超大數被拒絕", () => {
    expect(multiply(10 ** 100, 4)).toEqual({ ok: false, error: "INVALID_INPUT", detail: `a ${OUT_OF_RANGE}` });
  });

  test("a 為 null", () => {
    // @ts-expect-error null 不是 number
    expect(multiply(null, 4)).toEqual({ ok: false, error: "INVALID_INPUT", detail: "a must be int, got null" });
  });

  test("b 為 null", () => {
    // @ts-expect-error null 不是 number
    expect(multiply(4, null)).toEqual({ ok: false, error: "INVALID_INPUT", detail: "b must be int, got null" });
  });

  test("NaN 被拒絕", () => {
    expect(multiply(NaN, 4)).toEqual({ ok: false, error: "INVALID_INPUT", detail: "a must be int, got NaN" });
  });

  // --- corner cases：多個特殊條件同時出現 ---

  test("兩個都是最大值", () => {
    expect(multiply(10 ** 9, 10 ** 9)).toEqual({ ok: true, result: 10n ** 18n });
  });

  test("兩個都是最小值", () => {
    expect(multiply(-(10 ** 9), -(10 ** 9))).toEqual({ ok: true, result: 10n ** 18n });
  });

  test("bigint 避免精度遺失：999999999 * 999999999", () => {
    expect(multiply(999_999_999, 999_999_999)).toEqual({ ok: true, result: 999_999_998_000_000_001n });
    // 若用 number 計算，結果超過 MAX_SAFE_INTEGER，已經不是精確值
    expect(Number.isSafeInteger(999_999_999 * 999_999_999)).toBe(false);
  });

  test("0 與 null", () => {
    // @ts-expect-error null 不是 number
    expect(multiply(0, null)).toEqual({ ok: false, error: "INVALID_INPUT", detail: "b must be int, got null" });
  });

  test("兩個都無效時先回報 a", () => {
    // @ts-expect-error null 不是 number
    expect(multiply(null, 2.5)).toEqual({ ok: false, error: "INVALID_INPUT", detail: "a must be int, got null" });
  });
});

describe("divide 除法器（test_divider.py）", () => {
  test("8 / 4", () => {
    expect(divide(8, 4)).toEqual({ ok: true, result: 2 });
  });

  test("非整除結果", () => {
    expect(divide(1, 4)).toEqual({ ok: true, result: 0.25 });
  });

  test("被除數為 0", () => {
    expect(divide(0, 4)).toEqual({ ok: true, result: 0 });
  });

  test("負數", () => {
    expect(divide(-12, 4)).toEqual({ ok: true, result: -3 });
  });

  test("除以 0", () => {
    expect(divide(2, 0)).toEqual({ ok: false, error: "DIVISION_BY_ZERO", detail: "b must not be 0" });
  });

  test("0 / 0", () => {
    expect(divide(0, 0)).toMatchObject({ error: "DIVISION_BY_ZERO" });
  });

  test("最大值 / 最小值", () => {
    expect(divide(10 ** 9, -(10 ** 9))).toEqual({ ok: true, result: -1 });
  });

  test("小數被拒絕", () => {
    expect(divide(2.5, 4)).toEqual({ ok: false, error: "INVALID_INPUT", detail: "a must be int, got float" });
  });

  test("超大數被拒絕", () => {
    expect(divide(10 ** 100, 4)).toEqual({ ok: false, error: "INVALID_INPUT", detail: `a ${OUT_OF_RANGE}` });
  });

  test("b 為 null", () => {
    // @ts-expect-error null 不是 number
    expect(divide(4, null)).toEqual({ ok: false, error: "INVALID_INPUT", detail: "b must be int, got null" });
  });

  test("型別檢查優先於除以 0 檢查", () => {
    // @ts-expect-error null 不是 number
    expect(divide(null, 0)).toMatchObject({ error: "INVALID_INPUT" });
  });
});

describe("power 次方器", () => {
  test("2 ^ 10", () => {
    expect(power(2, 10)).toEqual({ ok: true, result: 1024n });
  });

  test("任何數的 0 次方為 1", () => {
    expect(power(7, 0)).toEqual({ ok: true, result: 1n });
  });

  test("1 次方為本身", () => {
    expect(power(-5, 1)).toEqual({ ok: true, result: -5n });
  });

  test("負底數：奇數次方為負、偶數次方為正", () => {
    expect(power(-2, 3)).toEqual({ ok: true, result: -8n });
    expect(power(-2, 4)).toEqual({ ok: true, result: 16n });
  });

  // --- edge cases：底數為 0、1、-1 ---

  test("0 的 0 次方為 1（與 Python 相同）", () => {
    expect(power(0, 0)).toEqual({ ok: true, result: 1n });
  });

  test("0 的正數次方為 0", () => {
    expect(power(0, 5)).toEqual({ ok: true, result: 0n });
  });

  test("1 的極大次方不會跑 10^9 次迴圈", () => {
    expect(power(1, 10 ** 9)).toEqual({ ok: true, result: 1n });
  });

  test("-1 的極大次方依奇偶決定正負", () => {
    expect(power(-1, 10 ** 9)).toEqual({ ok: true, result: 1n });
    expect(power(-1, 10 ** 9 - 1)).toEqual({ ok: true, result: -1n });
  });

  // --- 結果上限 10^18 ---

  test("剛好等於上限：10 ^ 18", () => {
    expect(power(10, 18)).toEqual({ ok: true, result: 10n ** 18n });
  });

  test("剛好等於負上限：(-10^6) ^ 3", () => {
    expect(power(-(10 ** 6), 3)).toEqual({ ok: true, result: -(10n ** 18n) });
  });

  test("最大底數平方：(10^9) ^ 2", () => {
    expect(power(10 ** 9, 2)).toEqual({ ok: true, result: 10n ** 18n });
  });

  test("bigint 避免精度遺失：3 ^ 37", () => {
    expect(power(3, 37)).toEqual({ ok: true, result: 450_283_905_890_997_363n });
    expect(Number.isSafeInteger(3 ** 37)).toBe(false);
  });

  test("超過上限：10 ^ 19", () => {
    expect(power(10, 19)).toEqual(OVERFLOW);
  });

  test("超過上限：2 ^ 60", () => {
    expect(power(2, 59)).toEqual({ ok: true, result: 2n ** 59n });
    expect(power(2, 60)).toEqual(OVERFLOW);
  });

  test("超過負上限：(-10) ^ 19", () => {
    expect(power(-10, 19)).toEqual(OVERFLOW);
  });

  test("極大指數會提早停止：2 ^ 10^9", () => {
    expect(power(2, 10 ** 9)).toEqual(OVERFLOW);
  });

  // --- 輸入檢查 ---

  test("負指數被拒絕", () => {
    expect(power(2, -1)).toEqual({ ok: false, error: "INVALID_INPUT", detail: "b must be >= 0" });
  });

  test("小數被拒絕", () => {
    expect(power(2, 0.5)).toEqual({ ok: false, error: "INVALID_INPUT", detail: "b must be int, got float" });
  });

  test("超大數被拒絕", () => {
    expect(power(10 ** 100, 2)).toEqual({ ok: false, error: "INVALID_INPUT", detail: `a ${OUT_OF_RANGE}` });
  });

  test("a 為 null", () => {
    // @ts-expect-error null 不是 number
    expect(power(null, 2)).toEqual({ ok: false, error: "INVALID_INPUT", detail: "a must be int, got null" });
  });

  test("型別檢查優先於負指數檢查", () => {
    // @ts-expect-error null 不是 number
    expect(power(null, -1)).toEqual({ ok: false, error: "INVALID_INPUT", detail: "a must be int, got null" });
  });
});

describe("run 命令列入口", () => {
  test.each([
    [["add", "5", "5"], "10"],
    [["multiply", "1000000000", "1000000000"], "1000000000000000000"],
    [["divide", "1", "4"], "0.25"],
    [["power", "2", "10"], "1024"],
  ])("run(%j) 回傳 %s", (args, expected) => {
    expect(run(args)).toBe(expected);
  });

  test("除以 0 拋出 DIVISION_BY_ZERO", () => {
    expect(() => run(["divide", "2", "0"])).toThrow("DIVISION_BY_ZERO: b must not be 0");
  });

  test("非數字參數拋出 INVALID_INPUT", () => {
    expect(() => run(["add", "x", "4"])).toThrow("INVALID_INPUT: a must be int, got string");
  });

  test("缺少參數", () => {
    expect(() => run(["add", "4"])).toThrow("INVALID_INPUT: b must be int, got undefined");
  });

  test("次方結果超過上限拋出 OVERFLOW", () => {
    expect(() => run(["power", "10", "19"])).toThrow(/^OVERFLOW: /);
  });

  test("未知運算拋出使用說明", () => {
    expect(() => run(["modulo", "7", "3"])).toThrow(/Usage/);
  });
});
