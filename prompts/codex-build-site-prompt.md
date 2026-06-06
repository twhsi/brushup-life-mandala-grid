# Codex 建站指令：重啟人生 Mandala Grid Trail Archive

請幫我建立一個靜態網站，用來瀏覽 `data/talks.json` 的內容。

## 網站目標

把《重啟人生》投影片拆解後的 64＋8＋1 Mandala Grid，做成可瀏覽的卡片網站。

## 版面

四區：

A. 左欄：演講 / PDF 場次與 Section  
- 讀取 `talks[].sections[]`
- 顯示每個 Section 的 grid id，例如 `1.1`
- 顯示 Section title
- 點擊後，中間顯示該 Section 第一張非空白卡；若全空白則顯示第一張卡

B. 中間：卡片內容  
- 顯示目前卡片的 `gridId`
- 顯示 `title`
- 顯示 `content`
- 若 `isBlank = true`，顯示「此格空白」

C. 右欄：九宮羅盤  
九格如下：
1. 搜尋
2. 上一張 Trail
3. Talk / Section 下拉選單
4. 正向關鍵字
5. 本卡定位：Talk / Section / Card
6. 反向或距離最遠關鍵字
7. 引用或來源
8. 下一張 Trail
9. AI 產生下一張草稿

D. 下方：本 Section 的 Trail 卡片序列  
- 顯示目前 Section 的 8 張 cards
- 目前卡片高亮
- 空白卡淡化
- 點擊可切換

## 風格

- 深色主題
- 類似知識卡片盒
- 細線框
- 適合 Mac 與手機
- 手機版左欄與右欄可折疊

## 請建立檔案

```text
index.html
styles.css
app.js
data/talks.json
data/cards.json
```

## 資料說明

`data/talks.json` 已經包含：

```text
1              center
1.1 - 1.8      Section
1.1.1 - 1.8.8  Trail cards
```

請不要重新編造資料，只讀取 JSON 顯示。
