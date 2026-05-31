# 프론트엔드 배포

이 프로젝트는 Vercel 배포를 기준으로 한다. 공지 데이터와 챗봇 응답은 별도 FastAPI 백엔드에서 가져온다.

## 구조

```text
Browser
  -> Vercel Frontend
  -> Next.js /api/* route handler
  -> FastAPI Backend
```

브라우저 코드는 프론트 `/api/*`만 호출한다. 백엔드 도메인 호출은 `src/server/notices/backend-notice-service.ts`에서 처리한다.

## Vercel 설정

| 항목 | 값 |
| --- | --- |
| Framework | Next.js |
| Root Directory | `.` (저장소 루트가 곧 Next.js 프로젝트) |
| Install Command | `yarn install` |
| Build Command | `yarn build` |
| Output Directory | Next.js 기본값 |
| Node.js Version | 20.x 이상 |

## 환경변수

운영:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
NEXT_PUBLIC_GITHUB_URL=https://github.com/KAU-HUB-Official/KAU-Notice-Hub-Prototype
NEXT_PUBLIC_CONTACT_EMAIL=contact@kauhub.kr
```

로컬:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_GITHUB_URL=https://github.com/KAU-HUB-Official/KAU-Notice-Hub-Prototype
NEXT_PUBLIC_CONTACT_EMAIL=contact@kauhub.kr
```

서버에서만 다른 백엔드 주소를 써야 하면 `NOTICE_API_BASE_URL`을 추가한다. 우선순위는 `NOTICE_API_BASE_URL`, `NEXT_PUBLIC_API_BASE_URL`, `http://localhost:8000` 순서다.

`NEXT_PUBLIC_GITHUB_URL`과 `NEXT_PUBLIC_CONTACT_EMAIL`은 공통 푸터에 노출되는 공개 링크다.

## 백엔드 계약

프론트 route handler는 아래 백엔드 API가 있다고 가정한다.

```text
GET  /api/notices
GET  /api/notices/{id}
POST /api/chat
POST /api/chat/stream   # text/event-stream, SSE
GET  /health
```

`/api/chat/stream`은 SSE(`text/event-stream`)를 반환하고, Next.js route handler가 그대로 클라이언트로 전달한다. Vercel은 Node.js 런타임에서 chunked streaming을 지원하므로 추가 설정은 필요 없다. 다만 응답이 버퍼링되지 않도록 라우트에서 `Cache-Control: no-cache, no-transform`과 `X-Accel-Buffering: no`를 항상 함께 내려준다.

목록 화면에서 유지하는 query parameter:

```text
audience
group
source
q
page
pageSize
```

## 배포 확인

1. 백엔드 `GET /health`가 정상인지 확인한다.
2. Vercel에 `NEXT_PUBLIC_API_BASE_URL`을 설정한다.
3. 새 deployment를 만든다.
4. production URL에서 메인 화면, 상세 화면, 챗봇을 확인한다.
5. 필터 변경 시 URL의 `audience`, `group`, `source`, `q`, `page`가 기대대로 바뀌는지 확인한다.

## 문제 확인

| 증상 | 확인할 것 |
| --- | --- |
| API가 `localhost:8000`으로 나감 | Vercel 환경변수와 재배포 여부 |
| CORS 오류 | 백엔드가 Vercel origin을 허용하는지 |
| 목록이 비어 있음 | 백엔드 `/api/notices` 응답과 `NEXT_PUBLIC_API_BASE_URL` |
| 환경변수 변경이 반영되지 않음 | 변경 후 새 deployment를 만들었는지 |
| 챗봇 답변이 한꺼번에 한 덩어리로 나옴 | 백엔드 응답이 gzip/buffer되는지, route handler의 `no-cache`/`X-Accel-Buffering` 헤더 누락 |
| 챗봇이 404로 실패 | 백엔드가 `/api/chat/stream`을 노출하는 버전으로 배포돼 있는지 |
