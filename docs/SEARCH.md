# 검색

검색 기준은 백엔드 API가 관리한다. 프론트는 검색어를 `q` query parameter로 전달하고, 응답으로 받은 결과를 렌더링한다.

## 흐름

1. 사용자가 `SearchBar`에 검색어를 입력한다.
2. `notice-explorer`가 `/api/notices?q=...`를 호출한다.
3. Next.js route handler가 백엔드 `/api/notices`로 같은 조건을 전달한다.
4. 백엔드가 검색, 필터링, 정렬을 수행한다.
5. 프론트는 `items`, `facets`, `page`, `totalPages`를 화면에 반영한다.

## 유지할 URL 상태

```text
q
audience
group
source
page
```

검색어가 바뀌면 `page`는 1로 초기화한다.

## 구현 위치

| 역할 | 파일 |
| --- | --- |
| 검색 입력 | `src/components/SearchBar.tsx` |
| URL 상태와 API 호출 | `src/components/notice-explorer.tsx` |
| 프론트 API route handler | `src/app/api/notices/route.ts` |
| 백엔드 API 클라이언트 | `src/server/notices/backend-notice-service.ts` |

검색 랭킹, 토큰화, 불용어 같은 세부 규칙은 백엔드 문서를 기준으로 한다.
