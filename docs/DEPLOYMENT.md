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
| Root Directory | `MVP` |
| Install Command | `yarn install` |
| Build Command | `yarn build` |
| Output Directory | Next.js 기본값 |

## 환경변수

운영:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

로컬:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

서버에서만 다른 백엔드 주소를 써야 하면 `NOTICE_API_BASE_URL`을 추가한다. 우선순위는 `NOTICE_API_BASE_URL`, `NEXT_PUBLIC_API_BASE_URL`, `http://localhost:8000` 순서다.

## 백엔드 계약

프론트 route handler는 아래 백엔드 API가 있다고 가정한다.

```text
GET  /api/notices
GET  /api/notices/{id}
POST /api/chat
GET  /health
```

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
