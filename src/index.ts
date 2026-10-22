import { add, divide, multiply, Result } from "./math";

export { add, divide, multiply };

type Operation = "add" | "multiply" | "divide";

const operations: Record<Operation, (a: number, b: number) => Result<number | bigint>> = {
  add,
  multiply,
  divide,
};

function isOperation(value: string): value is Operation {
  return Object.prototype.hasOwnProperty.call(operations, value);
}

/** 數字字串轉成 number，其餘保持原字串，交給 math.ts 的執行期檢查回報錯誤 */
function parseArg(raw: string | undefined): unknown {
  if (raw === undefined) return undefined;
  const n = Number(raw);
  return raw.trim() !== "" && !Number.isNaN(n) ? n : raw;
}

/** 解析命令列參數並計算結果，例如 ["add", "3", "4"] → "7"；失敗時拋出 Error */
export function run(args: string[]): string {
  const [op, rawA, rawB] = args;
  if (op === undefined || !isOperation(op)) {
    throw new Error(`Usage: node dist/index.js <add|multiply|divide> <a> <b>`);
  }
  // 型別斷言只騙過編譯器；真正的型別檢查在 math.ts 的 validate() 執行期進行
  const out = operations[op](parseArg(rawA) as number, parseArg(rawB) as number);
  if (!out.ok) {
    throw new Error(`${out.error}: ${out.detail}`);
  }
  return String(out.result);
}

// 只有直接用 node 執行此檔時才跑 CLI；被 import 時不會執行
if (require.main === module) {
  try {
    console.log(run(process.argv.slice(2)));
  } catch (err) {
    console.error((err as Error).message);
    process.exitCode = 1;
  }
}
