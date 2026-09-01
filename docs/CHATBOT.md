# 챗봇

챗봇 UI는 프론트 `/api/chat/stream` route handler를 통해 백엔드 `/api/chat/stream`을 호출하고, SSE(`text/event-stream`)로 스트리밍 응답을 받는다. 프론트는 질문과 현재 필터 범위만 전달하고, 답변 생성은 백엔드가 담당한다.

단발 JSON 응답이 필요한 경우를 위해 `/api/chat`(스트리밍 없음)도 함께 유지한다. 현재 화면(`ChatPanel`)은 `/api/chat/stream`만 사용한다.

## 요청 흐름

1. 사용자가 `ChatPanel`에 질문을 입력한다.
2. 현재 URL의 `audience`, `group`, `source`를 함께 읽는다.
3. `source`는 허용된 대상자에서만 요청에 포함한다.
4. `/api/chat/stream` route handler가 백엔드 `/api/chat/stream`으로 전달한다.
5. 백엔드가 보내는 SSE 이벤트를 순서대로 처리해 검색 상태, 근거 공지, 최종 답변을 점진적으로 화면에 반영한다.

route handler는 응답이 버퍼링되지 않도록 `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no` 헤더를 함께 내려준다.

## 요청 body

```ts
interface ChatRequestBody {
  question: string;
  history?: { role: "user" | "assistant"; content: string }[];
  audienceGroup?: string;
  sourceGroup?: string;
  source?: string;
  category?: string;
  department?: string;
  sessionId?: string;
}
```

`question`은 필수이며 route handler에서 빈 문자열과 500자 초과 입력을 거부한다.

`sessionId`는 한 대화 흐름을 묶는 식별자다. `ChatPanel`이 마운트될 때(=새 대화) 브라우저에서
한 번 생성해 이후 모든 턴이 같은 값을 보낸다. 백엔드 세션 로깅이 켜져 있을 때만 사용되며,
없으면 해당 대화는 로깅되지 않는다.

`history`는 직전 대화 turn을 담아 후속 질문 맥락을 유지한다. `ChatPanel`이 인사말과
진행 중·에러 메시지를 제외한 완료된 user·assistant 턴을 최근 10개까지 보내고, 백엔드가
다시 최근 10개·메시지당 500자로 자른다. 백엔드는 이 history로 검색 없이 직전 답변을
재가공하는 분기(예: "더 짧게 요약")와 후속 질문의 지시 대명사 해소를 처리한다.

## SSE 응답 이벤트

각 이벤트는 SSE `data:` 라인의 JSON으로 전달된다.

```ts
type ChatStreamEvent =
  | { type: "search_started" }
  | { type: "search_completed"; references: NoticeReference[] }
  | { type: "answer_delta"; delta: string }
  | { type: "answer_completed"; answer: string; usedFallback: boolean; model: string }
  | { type: "error"; error: string };
```

- `search_started`: 관련 공지 검색 시작 (UI는 "관련 공지를 검색하고 있어요" 안내 + 점 애니메이션 표시)
- `search_completed`: 근거 공지(`references`) 확정, 답변 작성 단계로 전환 ("답변을 작성하고 있어요" 안내 + 점 애니메이션)
- `answer_delta`: LLM 답변 토큰 조각(`delta`). 도착 순서대로 0회 이상 온다. UI는 받는 즉시 누적해 화면에 흘려 보여준다.
- `answer_completed`: 최종 답변 텍스트 수신. `answer`는 모든 `delta`를 이어 붙인 전문과 같다.
- `error`: 오류 메시지 표시

`NoticeReference`는 `{ id, title, url?, source?, date? }` 형태다.

## 답변 표시(토큰 스트리밍 + 타이핑 애니메이션)

백엔드는 LLM 답변을 `answer_delta`로 토큰 단위로 흘려보내고 마지막에 `answer_completed`로
전문을 확정한다. `ChatPanel`은 `answer_delta`가 올 때마다 그대로 누적해 실시간으로 렌더하고,
`answer_completed`에서 누적 텍스트를 전문으로 확정한다(끝에 깜빡이는 캐럿 표시).
다만 RAG 비활성·키 부재·도메인 가드처럼 `answer_delta` 없이 `answer_completed`만 오는
fallback 경로에서는, 전문을 글자 단위로 점진 노출하는 클라이언트 타이핑 애니메이션으로
대체해 보여준다(추가 네트워크 요청 없음). 검색/작성 진행 단계에서는 안내 문구와 함께 점
3개가 튀는 애니메이션을 보여준다. `prefers-reduced-motion: reduce` 환경에서는 타이핑·캐럿·점
애니메이션을 끄고 답변 전문을 즉시 표시한다. 애니메이션 keyframe은 `src/app/globals.css`에
정의돼 있다.

## 화면 배치(데스크톱 / 모바일)

챗봇 UI(`ChatPanel`)는 두 가지 형태로 렌더된다.

| 폭 | 형태 | 진입 |
| --- | --- | --- |
| `xl` 이상(1280px~) | 공지 목록 오른쪽 사이드바에 상주(`variant="embedded"`) | 항상 표시 |
| `xl` 미만 | 화면 전체를 덮는 시트(`variant="sheet"`) | 우하단 고정 버튼(`ChatLauncher`) |

모바일에서 공지 목록 아래에 챗봇을 세로로 쌓으면 목록 끝까지 스크롤해야 도달할 수 있고,
남는 높이가 짧아 답변이 잘려 보였다. 그래서 `xl` 미만에서는 사이드바 챗봇을 숨기고
`ChatLauncher`가 띄우는 전체화면 시트를 사용한다.

`ChatLauncher` 동작:

- 시트를 한 번 열면 닫아도 언마운트하지 않는다. 대화 내역과 `sessionId`가 유지된다.
- 열려 있는 동안 `body` 스크롤을 잠그고, 닫으면 원래 값으로 되돌린다.
- `Esc` 또는 헤더의 닫기 버튼으로 닫고, 닫을 때 열었던 버튼으로 포커스를 되돌린다.
- `Tab` 포커스를 시트 안에 가둔다(`role="dialog"`, `aria-modal="true"`).
- iOS는 키보드가 올라와도 `100dvh`가 줄지 않으므로, `visualViewport` 크기에 시트 높이를
  맞춰 입력창이 키보드 뒤로 숨지 않게 한다.
- 폭이 `xl` 이상으로 넓어지면 시트를 닫아 스크롤 잠금이 남지 않게 한다.

`sheet`에서는 메시지 영역을 최대한 확보하려고 헤더의 익명 처리·정확도 안내를 한 문단으로
합치고, 입력창과 전송 버튼을 한 행에 둔다(버튼은 아이콘). 모바일 입력창 폰트는 16px로
둔다. 16px 미만이면 iOS Safari가 포커스 시 화면을 확대한다.

## 메시지 스크롤

메시지 영역은 바닥에 붙어 있을 때만 새 토큰을 따라 자동 스크롤한다. 사용자가 위로 올려
읽는 중이면 스트리밍이 화면을 끌어내리지 않고, 다시 바닥 근처로 내리면 자동 스크롤이
재개된다. 새 질문을 보내는 순간에는 항상 바닥으로 되돌린다.

## 근거 공지 링크

`NoticeReference.url`은 백엔드/LLM이 내려준 값이므로 그대로 `<a href>`에 넣지 않는다.
`safeHttpUrl`(`src/lib/notices.ts`)로 스킴을 검사해 `http(s)`와 상대 경로만 링크로 렌더하고,
`javascript:`·`data:` 같은 값은 링크 대신 제목 텍스트로 표시한다.

## 단발 응답(`/api/chat`)

스트리밍을 쓰지 않는 `/api/chat`은 아래 shape를 반환한다.

```ts
interface ChatAnswer {
  answer: string;
  references: NoticeReference[];
  usedFallback?: boolean;
  model?: string;
}
```

## 구현 위치

| 역할 | 파일 |
| --- | --- |
| 챗봇 UI, SSE 파싱 | `src/components/chat-panel.tsx` |
| 모바일 전체화면 시트 진입점 | `src/components/chat-launcher.tsx` |
| 링크 스킴 검증(`safeHttpUrl`) | `src/lib/notices.ts` |
| 스트리밍 route handler | `src/app/api/chat/stream/route.ts` |
| 단발 route handler | `src/app/api/chat/route.ts` |
| 백엔드 API 클라이언트 | `src/server/notices/backend-notice-service.ts` |
| 스트림 이벤트 타입 | `src/lib/types.ts` |

답변 품질이나 근거 공지 검색 결과가 맞지 않으면 백엔드 `/api/chat/stream`과 `/api/notices?q=...` 응답을 먼저 확인한다. 답변이 한 덩어리로 늦게 나오면 route handler의 `no-cache`/`X-Accel-Buffering` 헤더와 백엔드 버퍼링 여부를 확인한다.
