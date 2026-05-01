# 챗봇

챗봇은 프론트 `/api/chat` route handler를 통해 백엔드 `/api/chat`을 호출한다. 프론트는 질문과 현재 필터 범위만 전달하고, 답변 생성은 백엔드가 담당한다.

## 요청 흐름

1. 사용자가 `ChatPanel`에 질문을 입력한다.
2. 현재 URL의 `audience`, `group`, `source`를 함께 읽는다.
3. `source`는 허용된 대상자에서만 요청에 포함한다.
4. `/api/chat` route handler가 백엔드 `/api/chat`으로 전달한다.
5. 응답의 `answer`와 `references`를 화면에 표시한다.

## 요청 body

```ts
interface ChatRequestBody {
  question: string;
  audienceGroup?: string;
  sourceGroup?: string;
  source?: string;
}
```

`question`은 필수이며 route handler에서 빈 문자열과 500자 초과 입력을 거부한다.

## 응답

```ts
interface ChatAnswer {
  answer: string;
  references: Array<{
    id: string;
    title: string;
    url?: string;
    source?: string;
    date?: string;
  }>;
}
```

## 구현 위치

| 역할 | 파일 |
| --- | --- |
| 챗봇 UI | `src/components/chat-panel.tsx` |
| 프론트 route handler | `src/app/api/chat/route.ts` |
| 백엔드 API 클라이언트 | `src/server/notices/backend-notice-service.ts` |

답변 품질이나 근거 공지 검색 결과가 맞지 않으면 백엔드 `/api/chat`과 `/api/notices?q=...` 응답을 먼저 확인한다.
