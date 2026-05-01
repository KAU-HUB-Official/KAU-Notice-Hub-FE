# 데이터 계약

프론트는 공지 JSON 파일을 직접 읽지 않는다. 데이터 입력, 정규화, 검색, 분류는 백엔드가 담당하고, 프론트는 백엔드 API 응답 shape만 사용한다.

## 흐름

```text
BackEnd /api/notices
  -> MVP /api/notices route handler
  -> 화면 렌더링
```

## Notice

프론트에서 사용하는 공지 shape:

```ts
interface Notice {
  id: string;
  title: string;
  content: string;
  url?: string;
  source?: string;
  sources?: string[];
  audienceGroup?: string;
  sourceGroup?: string;
  sourceGroups?: string[];
  category?: string;
  date?: string;
  summary?: string;
  tags: string[];
  attachments: Array<{
    name: string;
    url: string;
  }>;
}
```

`source`는 대표 홈페이지, `sources`는 여러 홈페이지에 동시에 걸린 공지를 표시할 때 사용한다.

## 목록 응답

```ts
interface NoticeListResult {
  items: Notice[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: {
    audienceGroups: string[];
    sourceGroups: string[];
    sources: string[];
    categories: string[];
  };
}
```

현재 프론트는 `audienceGroups`, `sourceGroups`, `sources`로 필터 UI를 만들고, `categories`는 공지 카드의 category 표시 여부 판단에만 사용한다.

## 챗봇 응답

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

## 환경변수

백엔드 주소는 아래 순서로 결정한다.

1. `NOTICE_API_BASE_URL`
2. `NEXT_PUBLIC_API_BASE_URL`
3. `http://localhost:8000`
