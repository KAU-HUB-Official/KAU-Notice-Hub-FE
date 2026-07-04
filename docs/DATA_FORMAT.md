# 데이터 계약

프론트는 공지 JSON 파일을 직접 읽지 않는다. 데이터 입력, 정규화, 검색, 분류는 백엔드가 담당하고, 프론트는 백엔드 API 응답 shape만 사용한다.

## 흐름

```text
BackEnd /api/notices
  -> FrontEnd /api/notices route handler
  -> 화면 렌더링
```

## Notice

프론트에서 사용하는 공지 shape:

```ts
interface Notice {
  id: string;
  title: string;
  content: string;
  url?: string;
  source?: string;
  sources?: string[];
  audienceGroup?: string;
  sourceGroup?: string;
  sourceGroups?: string[];
  category?: string;
  date?: string;
  tags: string[];
  attachments: Array<{
    name: string;
    url: string;
  }>;
}
```

`source`는 대표 홈페이지, `sources`는 여러 홈페이지에 동시에 걸린 공지를 표시할 때 사용한다.

## 목록 응답

```ts
interface NoticeListResult {
  items: Notice[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: {
    audienceGroups: string[];
    sourceGroups: string[];
    sources: string[];
    categories: string[];
  };
}
```

현재 프론트는 `audienceGroups`, `sourceGroups`, `sources`로 필터 UI를 만들고, `categories`는 공지 카드의 category 표시 여부 판단에만 사용한다.

## 챗봇 응답

단발 응답(`/api/chat`):

```ts
interface NoticeReference {
  id: string;
  title: string;
  url?: string;
  source?: string;
  date?: string;
}

interface ChatAnswer {
  answer: string;
  references: NoticeReference[];
  usedFallback?: boolean;
  model?: string;
}
```

스트리밍 응답(`/api/chat/stream`)은 SSE `data:` 라인으로 아래 이벤트를 순서대로 보낸다.

```ts
type ChatStreamEvent =
  | { type: "search_started" }
  | { type: "search_completed"; references: NoticeReference[] }
  | { type: "answer_delta"; delta: string }
  | { type: "answer_completed"; answer: string; usedFallback: boolean; model: string }
  | { type: "error"; error: string };
```

`answer_delta`는 LLM 답변 토큰 조각을 도착 순서대로 0회 이상 보내며, `answer_completed.answer`는 모든 `delta`를 이어 붙인 전문과 같다. fallback 경로에서는 `answer_delta` 없이 `answer_completed`만 온다.

자세한 흐름은 [챗봇](CHATBOT.md)을 참고한다.

## 환경변수

백엔드 주소는 아래 순서로 결정한다.

1. `NOTICE_API_BASE_URL`
2. `NEXT_PUBLIC_API_BASE_URL`
3. `http://localhost:8000`
