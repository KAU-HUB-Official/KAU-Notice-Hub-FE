export type RawNotice = Record<string, unknown>;

export interface NoticeAttachment {
  name: string;
  url: string;
}

export interface Notice {
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
  attachments: NoticeAttachment[];
}

export interface NoticeQuery {
  q?: string;
  audienceGroup?: string;
  sourceGroup?: string;
  source?: string;
  page?: number;
  pageSize?: number;
}

export interface NoticeFacets {
  audienceGroups: string[];
  sourceGroups: string[];
  sources: string[];
  categories: string[];
}

export interface NoticeListResult {
  items: Notice[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: NoticeFacets;
}

export interface NoticeReference {
  id: string;
  title: string;
  url?: string;
  source?: string;
  date?: string;
}

export interface ChatAnswer {
  answer: string;
  references: NoticeReference[];
  usedFallback?: boolean;
  model?: string;
}

export interface ChatRequestBody {
  question: string;
  audienceGroup?: string;
  sourceGroup?: string;
  source?: string;
  category?: string;
  department?: string;
}

export type ChatStreamEvent =
  | { type: "search_started" }
  | { type: "search_completed"; references: NoticeReference[] }
  | {
      type: "answer_completed";
      answer: string;
      usedFallback: boolean;
      model: string;
    }
  | { type: "error"; error: string };
