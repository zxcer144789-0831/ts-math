# 依賴關係筆記（2026-10-22）

## node_modules 數量

- 最上層資料夾：198 個
  - `.bin`：1 個（放可執行指令的捷徑，不是套件）
  - `@` 開頭的 scope 資料夾：14 個（裡面共 84 個套件）
  - 一般套件：183 個
- 實際套件總數：183 + 84 = **267 個**
- package.json 裡親手寫的：**5 個**（全部在 devDependencies）
  - `@types/jest`、`@types/node`、`jest`、`ts-jest`、`typescript`
  - 也就是說約 262 個是間接依賴

## 查「誰帶進來的」的方法

```bash
npm ls <套件名>       # 從專案根往下畫出依賴樹（最短、好讀）
npm explain <套件名>  # 從套件往上列出「所有」引用它的路徑（完整但很長）
```

也可以手動驗證：打開上一層套件的 `node_modules/<上層>/package.json`，看它的 `dependencies`。

## 選的套件：bser

`npm ls bser` 結果：

```
ts-math@1.0.0
└── jest@30.5.2
    └── @jest/core@30.5.2
        └── jest-haste-map@30.5.1
            └── fb-watchman@2.0.4
                └── bser@2.1.2
```

依賴鏈：**jest → @jest/core → jest-haste-map → fb-watchman → bser**

逐層在 package.json 確認過：

| 套件 | dependencies 裡的那一行 |
| --- | --- |
| jest | `"@jest/core": "30.5.2"` |
| @jest/core | `"jest-haste-map": "30.5.1"` |
| jest-haste-map | `"fb-watchman": "^2.0.2"` |
| fb-watchman | `"bser": "2.1.2"` |

用途：bser 是 Facebook Watchman 用的二進位序列化格式；jest 靠 jest-haste-map 掃描、監看檔案（`--watch` 模式），透過 fb-watchman 跟 Watchman 溝通，所以需要 bser。
