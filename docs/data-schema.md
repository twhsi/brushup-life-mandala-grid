# Data Schema

## talks.json

```ts
type TalksData = {
  talks: Talk[]
}

type Talk = {
  id: string
  title: string
  sourceFile: string
  center: {
    id: "1"
    title: string
    content: string
  }
  sections: Section[]
}

type Section = {
  id: string          // 1.1 ~ 1.8
  talkId: string
  title: string
  summary: string
  isBlank: boolean
  cards: Card[]
}

type Card = {
  id: string
  gridId: string      // 1.1.1 ~ 1.8.8
  talkId: string
  sectionId: string
  title: string
  content: string
  isBlank: boolean
  keywords: string[]
  previous: string | null
  next: string | null
  sourceFile: string
}
```

## UI 建議

四欄網站可用：

A. 左欄：`talks[].sections[]`  
B. 中間：目前 `card.content`  
C. 右欄九宮羅盤：搜尋、上一張、Trail 選單、關鍵字、中心定位、引用、下一張、AI 下一張  
D. 下方：目前 Section 的 `cards[]`
