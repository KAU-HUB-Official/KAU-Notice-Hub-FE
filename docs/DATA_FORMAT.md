# 입력 데이터 형식 문서

## 기본 조건
- 파일 경로: `NOTICE_JSON_PATH` (기본 `kau_official_posts.json`)
- JSON 최상위 타입: 배열(Array)

## 권장 레코드 예시
```json
{
  "id": "notice-001",
  "title": "2026학년도 수강신청 안내",
  "content": "수강신청 기간은 ...",
  "published_at": "2026-04-20",
  "source_name": "학사공지",
  "category_raw": "수업",
  "department": "교무처",
  "original_url": "https://example.com/notice/1",
  "attachments": []
}
```

## 유연 매핑
정규화 로직(`src/server/notices/normalize-notice.ts`)은 다음 계열 키를 유연하게 매핑합니다.
- 제목: `title`, `subject`, `name`
- 본문: `content`, `body`, `text`, `description`
- 출처: `source`, `source_name`, `source_type`, `board`
- 분류: `category`, `category_raw`, `type`
- 부서: `department`, `department_name`, `office`
- 링크: `url`, `original_url`, `link`, `href`
- 날짜: `date`, `published_at`, `created_at`, `updated_at`
- 아이디: `id`, `notice_id`, `post_id`, `uuid`

## 참고 사항
- 동일 id 충돌 시 자동 suffix를 붙여 고유 id로 보정됩니다.
- 본문에 HTML이 포함되어도 요약 생성 과정에서 기본 정리가 수행됩니다.
- category 품질이 낮으면 UI에서 자동 숨김될 수 있습니다.
- `source_name`과 `category_raw`는 문자열 또는 문자열 배열을 받을 수 있습니다.
- `source_name` 배열은 `sources`로 보존되며, 세부 홈페이지 필터에서 각 항목이 독립적으로 매칭됩니다.
