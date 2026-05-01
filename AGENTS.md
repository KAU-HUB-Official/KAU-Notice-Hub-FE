# AGENTS.md

## 범위

이 문서는 `KAU Notice Hub MVP` 프론트엔드 저장소 전체에 적용된다.

이 프로젝트는 Next.js App Router 기반 프론트/BFF다. 브라우저는 프론트 `/api/*`를 호출하고, route handler가 FastAPI 백엔드 API로 전달한다. 검색, 분류, 데이터 정규화, 챗봇 답변 생성의 원천 로직은 백엔드에 둔다.

## 구조

| 경로 | 역할 |
| --- | --- |
| `src/app/` | 페이지, 레이아웃, API route handler |
| `src/components/` | 공지 탐색, 목록, 상세 표시, 챗봇 UI |
| `src/lib/types.ts` | 프론트 타입 |
| `src/lib/notices.ts` | 필터 sentinel, source 표시 유틸 |
| `src/server/notices/` | 백엔드 API 클라이언트 |
| `docs/` | 배포와 API 계약 보조 문서 |

## 기본 원칙

1. 관련 코드와 문서를 먼저 읽는다.
2. 기존 TypeScript, App Router, Tailwind CSS 패턴을 따른다.
3. 프론트에서 백엔드의 검색/분류/정규화 로직을 중복 구현하지 않는다.
4. 변경 범위에 맞게 `yarn typecheck`, `yarn lint`, `yarn build` 중 필요한 검증을 실행한다.
5. API 계약, 환경변수, 필터 동작이 바뀌면 `README.md` 또는 `docs/`를 함께 갱신한다.

## 명령

```bash
yarn install
yarn dev
yarn typecheck
yarn lint
yarn build
```

이 저장소는 `yarn.lock`을 사용한다. 의존성 변경 시 다른 lockfile을 만들지 않는다.

## 환경변수

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NOTICE_API_BASE_URL=
```

백엔드 URL 우선순위:

1. `NOTICE_API_BASE_URL`
2. `NEXT_PUBLIC_API_BASE_URL`
3. `http://localhost:8000`

## API 계약

프론트 route handler:

```text
GET  /api/notices
GET  /api/notices/[id]
POST /api/chat
```

목록 query parameter:

```text
audience
group
source
q
page
pageSize
```

`source` 필터는 `학부 재학생(학과/전공별)`, `대학원생`, `평생·전문교육원`에서만 사용한다.

## 코드 규칙

- 클라이언트 컴포넌트는 프론트 `/api/*`만 호출한다.
- 서버 컴포넌트와 route handler는 `src/server/notices/backend-notice-service.ts`를 통해 백엔드를 호출한다.
- URL 상태는 `audience`, `group`, `source`, `q`, `page`를 기준으로 유지한다.
- route handler는 내부 예외 상세, 파일 경로, secret을 클라이언트에 노출하지 않는다.
- 명시적 요청 없이 상태관리 라이브러리, UI 프레임워크, 별도 API 서버를 추가하지 않는다.

## 문서 갱신

| 변경 | 문서 |
| --- | --- |
| 실행 방법, 구조 | `README.md` |
| Vercel, 환경변수, CORS | `docs/DEPLOYMENT.md` |
| 필터와 URL 상태 | `docs/CLASSIFICATION.md` |
| 응답 shape | `docs/DATA_FORMAT.md` |
| 검색 흐름 | `docs/SEARCH.md` |
| 챗봇 요청/응답 | `docs/CHATBOT.md` |

## 커밋 제외

- `.env`, `.env.*` (`.env.example` 제외)
- secret, SSH key, `*.pem`, `*.key`
- `node_modules/`, `.next/`, `out/`, `build/`
- `*.tsbuildinfo`
- 로컬 공지 JSON 스냅샷과 로그

## 검증 체크리스트

코드 변경 후 가능한 범위에서 실행한다.

```bash
yarn typecheck
yarn lint
yarn build
git diff --check
```

백엔드를 사용할 수 없어 UI/API 연동을 확인하지 못하면 최종 보고에 명시한다.
