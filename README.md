# Codex 資料包：重啟人生 64＋8＋1 Mandala Grid

這個資料包把兩個 Obsidian 純 section MD 檔，轉成 Codex 網站可直接讀取的資料。

## 檔案

- `data/talks.json`：主資料。包含兩份投影片、中心格、8 個 Section、64 張延伸卡。
- `data/cards.json`：攤平後的卡片清單，方便搜尋。
- `docs/data-schema.md`：資料結構說明。
- `prompts/codex-build-site-prompt.md`：貼給 Codex 的建站指令。
- `src/sample-loader.js`：前端讀取 JSON 的範例。

## 對應關係

```text
1              center，本場投影片核心
1.1 - 1.8      八個 Section
1.1.1 - 1.8.8  六十四張 Trail 卡
```

空白 section 會保留，並標記：

```json
"isBlank": true
```

網站端可以選擇顯示空白卡、淡化空白卡，或隱藏空白卡。
