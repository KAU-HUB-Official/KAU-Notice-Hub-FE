# 분류와 필터

프론트는 백엔드가 내려주는 `facets`를 기반으로 필터 UI를 그린다. 분류 규칙의 원천은 백엔드이며, 프론트는 URL 상태와 표시 조건만 관리한다.

## 필터 구조

탐색 순서:

1. 대상자 `audience`
2. 중분류 `group`
3. 세부 홈페이지 `source`
4. 검색어 `q`

세부 홈페이지 필터는 아래 대상자에서만 노출한다.

- `학부 재학생(학과/전공별)`
- `대학원생`
- `평생·전문교육원`

그 외 대상자는 `source`를 보내지 않는다.

## UI 동작

- 대상자를 바꾸면 `group`과 `source`를 초기화한다.
- 중분류를 바꾸면 `source`를 초기화한다.
- 같은 중분류 또는 홈페이지를 다시 선택하면 전체 상태로 되돌린다.
- 필터나 검색어가 바뀌면 `page`는 1로 초기화한다.
- 화면 URL에는 선택된 값만 남긴다. 전체 상태는 query parameter를 제거한다.

## API parameter

목록 API에 전달하는 값:

```text
audience
group
source
q
page
pageSize
```

중분류는 `sourceGroup`이라는 내부 타입 이름을 쓰지만 URL과 API query parameter는 `group`으로 유지한다.

## 구현 위치

| 역할 | 파일 |
| --- | --- |
| 대상자 탭 | `src/components/AudienceNav.tsx` |
| 중분류 탭 | `src/components/SourceGroupFilter.tsx` |
| 세부 홈페이지 탭 | `src/components/SourceNav.tsx` |
| 필터 상태와 URL 동기화 | `src/components/notice-explorer.tsx` |
| source 필터 노출 조건 | `src/lib/notices.ts` |
| 백엔드 API 호출 | `src/server/notices/backend-notice-service.ts` |

새 분류나 source가 추가되면 먼저 백엔드 분류 결과와 `facets` 응답을 확인한다. 프론트에서 수정할 가능성이 높은 부분은 `shouldUseSourceFilter`뿐이다.
