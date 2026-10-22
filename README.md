# ts-math：加法器、乘法器、除法器（TypeScript 版）

將上一章的 Python 版本（`../adder.py`、`../multiply.py`、`../divider.py` 與其 `test_*.py`）以 TypeScript 重寫，規格與測試案例一一對應。

## 1. 專案結構

```text
ts-math/
├── package.json        ← scripts：npm test / npm run build / npm start
├── tsconfig.json       ← 編譯 src/ → dist/
├── src/
│   ├── math.ts         ← add / multiply / divide 與輸入檢查
│   └── index.ts        ← 對外匯出 + 命令列入口
├── tests/
│   └── math.test.ts    ← 46 個 Jest 單元測試
└── dist/               ← npm run build 後產生
```

## 2. 安裝

```bash
npm install
```

第一次從零建立時使用的指令：

```bash
npm install --save-dev typescript@5 jest ts-jest @types/jest @types/node
```

> ⚠️ 必須固定 `typescript@5`。現在的最新版是 TypeScript 7，ts-jest 不支援，`npm test` 會出現 "does not expose the JavaScript compiler API required by ts-jest" 錯誤。

## 3. 規格（與 Python 版相同）

| 項目 | 規格 |
|---|---|
| 輸入 | `a`、`b` 為整數（不可為 boolean），`-10^9 <= a, b <= 10^9`；先檢查 a 再檢查 b |
| 成功 | `{ ok: true, result }` |
| 型別或範圍錯誤 | `{ ok: false, error: "INVALID_INPUT", detail: "a must be int, got float" }` |
| 除以 0 | `{ ok: false, error: "DIVISION_BY_ZERO", detail: "b must not be 0" }`（型別檢查優先） |
| 乘法結果 | `bigint`，因為 10^9 × 10^9 = 10^18 超過 `Number.MAX_SAFE_INTEGER` |

### 和 Python 版不可避免的差異

| 情境 | Python | TypeScript / JavaScript |
|---|---|---|
| `multiply(4.0, 4)` | `INVALID_INPUT`（float） | `16n`：JS 只有一種 number，`4.0 === 4` |
| `None` | `got NoneType` | `null` → `got null` |
| 傳入字串 | 執行期才發現 | **編譯期**就報錯（測試用 `@ts-expect-error` 標示），執行期 `validate()` 仍會擋 |
| 未定義變數 `x` | `NameError` | 編譯期 "Cannot find name 'x'"，執行期 `ReferenceError` |
| 大整數乘法 | `int` 天生無限精度 | 必須改用 `bigint`，否則 `999999999 * 999999999` 會失真 |

## 4. 執行測試

```bash
npm test
```

```text
Test Suites: 1 passed, 1 total
Tests:       46 passed, 46 total
```

## 5. 編譯

```bash
npm run build
```

`dist/` 內會產生：

```text
dist/
├── index.js       ← 編譯後的 JavaScript
├── index.js.map   ← source map（除錯時對應回 src/index.ts）
├── index.d.ts     ← 型別宣告
├── math.js
├── math.js.map
└── math.d.ts
```

`tests/` 被 `tsconfig.json` 排除，不會出現在 `dist/`。

## 6. 用 node 執行

```bash
node dist/index.js add 5 5                            # 10
node dist/index.js multiply 1000000000 1000000000     # 1000000000000000000
node dist/index.js divide 1 4                         # 0.25
node dist/index.js divide 2 0                         # DIVISION_BY_ZERO: b must not be 0   (exit 1)
node dist/index.js add x 4                            # INVALID_INPUT: a must be int, got string (exit 1)
node dist/index.js power 2 3                          # Usage: node dist/index.js <add|multiply|divide> <a> <b>
```

當成模組載入：

```bash
node -e "const m = require('./dist/math'); console.log(m.multiply(4, 4), m.divide(2, 0))"
# { ok: true, result: 16n } { ok: false, error: 'DIVISION_BY_ZERO', detail: 'b must not be 0' }
```

## 7. TypeScript 與編譯後 JavaScript 對比

以下右欄皆為 `tsc` 實際輸出。

### 7.1 `src/math.ts` → `dist/math.js`

| `src/math.ts` | `dist/math.js` |
|---|---|
| *（無）* | `"use strict";`<br>`Object.defineProperty(exports, "__esModule", { value: true });` |
| *（無）* | `exports.LIMIT = void 0;`<br>`exports.add = add;`<br>`exports.multiply = multiply;`<br>`exports.divide = divide;` |
| `export const LIMIT = 1_000_000_000;` | `exports.LIMIT = 1000000000;` |
| `export type ErrorCode = "INVALID_INPUT" \| "DIVISION_BY_ZERO";` | *（整行消失）* |
| `export type Ok<T> = { ok: true; result: T };`<br>`export type Err = ...;`<br>`export type Result<T> = Ok<T> \| Err;` | *（整行消失）* |
| `function typeName(value: unknown): string {` | `function typeName(value) {` |
| `function validate(a: unknown, b: unknown): Err \| null {` | `function validate(a, b) {` |
| `for (const [name, value] of [["a", a], ["b", b]] as const) {` | `for (const [name, value] of [["a", a], ["b", b]]) {` |
| `if (value < -LIMIT \|\| value > LIMIT) {` | `if (value < -exports.LIMIT \|\| value > exports.LIMIT) {` |
| `export function add(a: number, b: number): Result<number> {` | `function add(a, b) {` |
| `export function multiply(a: number, b: number): Result<bigint> {` | `function multiply(a, b) {` |
| `export function divide(a: number, b: number): Result<number> {` | `function divide(a, b) {` |
| `if (err) return err;` | `if (err)`<br>`    return err;` |
| `BigInt(a) * BigInt(b)` | `BigInt(a) * BigInt(b)` *（不變）* |
| *（無）* | `//# sourceMappingURL=math.js.map` |

### 7.2 `src/index.ts` → `dist/index.js`

| `src/index.ts` | `dist/index.js` |
|---|---|
| `import { add, divide, multiply, Result } from "./math";` | `const math_1 = require("./math");`（`Result` 是型別，消失） |
| `export { add, divide, multiply };` | `exports.multiply = exports.divide = exports.add = void 0;`<br>`Object.defineProperty(exports, "add", { enumerable: true, get: function () { return math_1.add; } });`<br>*（divide、multiply 同理）* |
| `type Operation = "add" \| "multiply" \| "divide";` | *（整行消失）* |
| `const operations: Record<Operation, (a: number, b: number) => Result<number \| bigint>> = { add, multiply, divide };` | `const operations = { add: math_1.add, multiply: math_1.multiply, divide: math_1.divide };` |
| `function isOperation(value: string): value is Operation {` | `function isOperation(value) {` |
| `function parseArg(raw: string \| undefined): unknown {` | `function parseArg(raw) {` |
| `export function run(args: string[]): string {` | `exports.run = run;`（提到檔案開頭）<br>`function run(args) {` |
| `operations[op](parseArg(rawA) as number, parseArg(rawB) as number)` | `operations[op](parseArg(rawA), parseArg(rawB))` |
| `console.error((err as Error).message);` | `console.error(err.message);` |
| `} catch (err) {` | `}`<br>`catch (err) {` |

### 7.3 差異總整理

| # | 類別 | TypeScript | JavaScript | 原因 |
|---|---|---|---|---|
| 1 | 參數 / 回傳型別 | `(a: number, b: number): Result<number>` | `(a, b)` | 型別只在編譯期使用，輸出時完全擦除（type erasure） |
| 2 | `type` 別名、泛型 | `type Result<T> = Ok<T> \| Err` | 消失 | 純型別宣告，執行期不存在 |
| 3 | 型別專用的 import | `import { ..., Result }` | `Result` 不出現在 `require` 結果的使用中 | tsc 自動省略只當型別用的匯入 |
| 4 | `unknown`、型別守衛 | `value: unknown`、`value is Operation` | 消失 | 只影響編譯器的型別推論 |
| 5 | 型別斷言 | `x as number`、`err as Error` | `x`、`err` | `as` 不做任何執行期轉換。這就是為什麼 `validate()` 必須在執行期再檢查一次 |
| 6 | `as const` | `[...] as const` | `[...]` | 只是讓編譯器推論成唯讀 tuple |
| 7 | 數字分隔符號 | `1_000_000_000` | `1000000000` | `_` 分隔是 ES2021 語法，`target: ES2020` 需要降級 |
| 8 | `import` | `import { add } from "./math"` | `const math_1 = require("./math")` | `module: commonjs` 轉換模組語法 |
| 9 | 匯入名稱的使用 | `add`、`LIMIT` | `math_1.add`、`exports.LIMIT` | 透過模組物件存取，維持 ES Module 的 live binding 語意 |
| 10 | `export function` | `export function add` | `function add` + 開頭的 `exports.add = add;` | 函式宣告會提升（hoisting），可以在檔案一開始就掛上 `exports` |
| 11 | `export const` | `export const LIMIT = ...` | `exports.LIMIT = void 0;` … `exports.LIMIT = 1000000000;` | 先佔位，執行到宣告那一行才賦值 |
| 12 | 重新匯出 | `export { add, ... }` | `Object.defineProperty(exports, "add", { get ... })` | 用 getter 模擬唯讀綁定 |
| 13 | `__esModule` 標記 | 無 | `Object.defineProperty(exports, "__esModule", ...)` | 讓 CommonJS 與 ES Module 的 default import 互通 |
| 14 | 嚴格模式 | 無（ES Module 預設嚴格） | `"use strict";` | CommonJS 預設非嚴格，需要明確加上 |
| 15 | Source map | 無 | `//# sourceMappingURL=...` | `sourceMap: true` |
| 16 | 排版 | `if (err) return err;`、`} catch` | 拆成多行 | tsc 的輸出格式，不影響行為 |
| 17 | 保留不變 | `const`、解構、樣板字串、`BigInt`、`for...of`、註解 | 相同 | ES2020 原生支援；`removeComments` 預設為 false |
| 18 | 型別去向 | 寫在 `.ts` | 移到 `.d.ts`，例如 `export declare function multiply(a: number, b: number): Result<bigint>;` | `declaration: true` |

**總結：** 編譯做三件事：① 擦除型別（#1–6、#18）；② 把新語法降級到 target 版本（#7）；③ 把 ES Module 轉成 CommonJS（#8–14）。程式邏輯本身原封不動。
