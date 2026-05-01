# KAU Notice Hub MVP

KAU Notice Hub 백엔드 API를 화면에서 탐색하고, 공지 기반 챗봇에 질문할 수 있는 Next.js 프론트엔드입니다.

프론트는 공지 JSON 파일을 직접 읽지 않습니다. 브라우저는 프론트 `/api/*`를 호출하고, Next.js Route Handler가 FastAPI 백엔드로 요청을 전달합니다.

## 기능

- 대상자, 중분류, 세부 홈페이지 필터 기반 공지 탐색
- 검색어와 필터 상태의 URL 동기화
- 공지 상세, 원문 링크, 첨부파일 표시
- 현재 필터 범위를 반영한 공지 챗봇

## 기술 스택

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- FastAPI 백엔드 API 프록시

## 빠른 시작

요구사항:

- Node.js 18+
- yarn
- 상위 `BackEnd` FastAPI 서버

설치:

```bash
yarn install
```

환경변수:

```bash
cp .env.example .env.local
```

로컬 기본값:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

백엔드 실행:

```bash
cd ../BackEnd
python3 -m pip install -e '.[dev]'
uvicorn app.main:app --reload --port 8000
```

프론트 실행:

```bash
yarn dev
```

확인 URL:

- 프론트: `http://localhost:3000`
- 프론트 API 프록시: `http://localhost:3000/api/notices`
- 백엔드 API 문서: `http://localhost:8000/docs`

## 스크립트

- `yarn dev`: 개발 서버
- `yarn build`: 프로덕션 빌드
- `yarn start`: 프로덕션 실행
- `yarn lint`: ESLint
- `yarn typecheck`: TypeScript 타입 검사

## API 프록시

프론트가 제공하는 route handler:

```text
GET  /api/notices
GET  /api/notices/[id]
POST /api/chat
```

목록 query parameter:

- `q`: 검색어
- `audience`: 대상자 필터
- `group`: 중분류 필터
- `source`: 세부 홈페이지 필터
- `page`: 페이지 번호
- `pageSize`: 페이지 크기

`source` 필터는 `학부 재학생(학과/전공별)`, `대학원생`, `평생·전문교육원` 범위에서만 사용합니다.

## 프로젝트 구조

```text
src/app                 Next.js 페이지와 API route handler
src/components          공지 탐색, 목록, 상세 표시, 챗봇 UI
src/lib/types.ts        프론트 타입
src/lib/notices.ts      필터 sentinel, source 표시 유틸
src/server/notices      백엔드 API 클라이언트
docs                    운영에 필요한 보조 문서
```

## 문서

- [배포](docs/DEPLOYMENT.md)
- [분류와 필터](docs/CLASSIFICATION.md)
- [데이터 계약](docs/DATA_FORMAT.md)
- [검색](docs/SEARCH.md)
- [챗봇](docs/CHATBOT.md)
