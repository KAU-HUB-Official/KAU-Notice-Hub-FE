# KAU-Notice-Hub-Prototype

JSON 기반 공지 데이터를 웹에서 탐색하고, AI 챗봇으로 공지 내용을 질의할 수 있는 최소 MVP입니다.

## 주요 기능
- 공지 목록 탐색: `대상자(audience)` + `중분류(group)` + 검색
- 세부 홈페이지 탐색: 학부/학과, 대학원, 평생·전문교육원 선택 시 `source` 필터 제공
- 공지 상세 열람: 제목/본문/원문 링크/첨부파일 확인
- AI 챗봇: 질문과 연관된 공지를 찾아 컨텍스트 기반 답변 생성
- URL 상태 동기화: `audience`, `group`, `source`, `q`, `page`
- JSON 스키마 유연 매핑: 입력 필드가 조금 달라도 정규화하여 처리

## 기술 스택
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Next.js Route Handler (`/api/*`)
- OpenAI API (`openai` SDK)
- JSON 파일 저장소 (DB 없이 운영)

## 빠른 시작

### 1) 요구사항
- Node.js 18+
- npm 또는 yarn

### 2) 설치
```bash
npm install
```

### 3) 환경변수 설정
```bash
cp .env.example .env.local
```

`.env.local` 예시:
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
NOTICE_JSON_PATH=kau_official_posts.json
```

### 4) 실행
```bash
npm run dev
```

브라우저:
- 홈: `http://localhost:3000`
- 목록 API: `http://localhost:3000/api/notices`

## 스크립트
- `npm run dev`: 개발 서버
- `npm run build`: 프로덕션 빌드
- `npm run start`: 프로덕션 실행
- `npm run lint`: ESLint
- `npm run typecheck`: TypeScript 타입 검사

## API 요약

### `GET /api/notices`
쿼리 파라미터:
- `q`: 검색어
- `audience`: 대상자 그룹 필터
- `group`: 중분류 필터
- `source`: 학부/학과, 대학원, 평생·전문교육원에서 사용하는 세부 홈페이지 필터
- `page`: 페이지 번호 (기본 1)
- `pageSize`: 페이지 크기 (기본 20, 최대 100)

예시:
`/api/notices?audience=학부 재학생(학과/전공별)&group=공과대&source=한국항공대학교 컴퓨터공학과`

응답: `items`, `total`, `page`, `totalPages`, `facets`

### `GET /api/notices/[id]`
공지 상세 조회

### `POST /api/chat`
요청 예시:
```json
{
  "question": "공모전 정보 알려줘",
  "audienceGroup": "학부 재학생(학과/전공별)",
  "sourceGroup": "공과대",
  "source": "한국항공대학교 컴퓨터공학과"
}
```

응답 예시 필드:
- `answer`: 챗봇 답변
- `references`: 근거 공지 목록
- `usedFallback`: OpenAI 호출 실패/미설정 시 `true`
- `model`: 사용 모델 또는 `local-fallback`

## 챗봇 동작 방식 (요약)
1. 질문으로 관련 공지 검색(최대 6건)
2. 검색 결과를 컨텍스트로 OpenAI 호출
3. API 키가 없거나 호출 실패 시 로컬 fallback 답변

상세: [docs/CHATBOT.md](docs/CHATBOT.md)

## 검색 동작 방식 (요약)
- 불용어 제거 + 의미 토큰 추출
- 전체 문장 매칭 / 공백 제거 매칭 / 토큰 부분 매칭(완화 규칙) 조합
- 결과를 점수화 후 정렬

상세: [docs/SEARCH.md](docs/SEARCH.md)

## 분류 체계 (요약)
- 상위: 공지를 보는 대상자(`audience`)
- 중위: 대상자별 의미 분류(`group`)
- 하위: 학부/학과, 대학원, 평생·전문교육원에서 세부 홈페이지(`source`)
- `source_name` 배열까지 보존해 여러 홈페이지에 동시에 걸린 공지도 필터링

상세: [docs/CLASSIFICATION.md](docs/CLASSIFICATION.md)

## 데이터 입력 형식
입력 JSON은 배열이어야 하며, 필드명은 유연 매핑됩니다.
- 대표 매핑: `title`, `content`, `source_name`, `category_raw`, `published_at`, `original_url`, `attachments`

상세: [docs/DATA_FORMAT.md](docs/DATA_FORMAT.md)

## 프로젝트 구조
```text
.
├── kau_official_posts.json
├── src
│   ├── app
│   │   ├── api
│   │   │   ├── chat/route.ts
│   │   │   └── notices
│   │   │       ├── route.ts
│   │   │       └── [id]/route.ts
│   │   ├── notices/[id]/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components
│   │   ├── AudienceNav.tsx
│   │   ├── SourceNav.tsx
│   │   ├── SearchBar.tsx
│   │   ├── SourceGroupFilter.tsx
│   │   ├── NoticeList.tsx
│   │   ├── NoticeCard.tsx
│   │   ├── notice-explorer.tsx
│   │   └── chat-panel.tsx
│   ├── lib
│   │   ├── types.ts
│   │   └── notices.ts
│   └── server
│       ├── ai
│       │   ├── openai-client.ts
│       │   └── chat-service.ts
│       └── notices
│           ├── notice-repository.ts
│           ├── json-notice-repository.ts
│           ├── normalize-notice.ts
│           ├── notice-service.ts
│           └── index.ts
└── docs
    ├── CHATBOT.md
    ├── SEARCH.md
    ├── CLASSIFICATION.md
    └── DATA_FORMAT.md
```

## 확장 포인트
- 저장소 추상화: `NoticeRepository` 구현 교체로 DB 전환 가능
- 검색 고도화: 임베딩/벡터DB/하이브리드 검색으로 확장 가능
- 챗봇 고도화: 재랭킹, query rewrite, context window 최적화

## 참고
- `OPENAI_API_KEY` 미설정 시 챗봇은 fallback 모드로 동작합니다.
- category 품질이 낮으면 자동으로 UI에서 숨깁니다.
