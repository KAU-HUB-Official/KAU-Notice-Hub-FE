import { ChatAnswer, Notice, NoticeQuery, NoticeReference } from "@/lib/types";
import { getNoticeSourceNames } from "@/lib/notices";
import { noticeService } from "@/server/notices";

import { getOpenAIClient } from "./openai-client";

const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

const SYSTEM_PROMPT = `
너는 대학 공지 도우미다.
반드시 제공된 공지 컨텍스트 안에서만 답한다.
모르면 모른다고 말하고, 확인할 공지 제목/링크를 안내한다.
답변은 한국어로 간결하게 작성한다.
`.trim();

function truncate(input: string, maxLength: number): string {
  if (input.length <= maxLength) {
    return input;
  }

  return `${input.slice(0, maxLength)}...`;
}

function buildReferences(notices: Notice[]): NoticeReference[] {
  return notices.map((notice) => ({
    id: notice.id,
    title: notice.title,
    url: notice.url,
    source: notice.source,
    date: notice.date
  }));
}

function buildContext(notices: Notice[]): string {
  if (notices.length === 0) {
    return "관련 공지를 찾지 못했습니다.";
  }

  return notices
    .map((notice, index) => {
      const summary = notice.summary ?? "요약 없음";
      const content = truncate(notice.content, 1400);
      return [
        `공지 ${index + 1}`,
        `id: ${notice.id}`,
        `title: ${notice.title}`,
        `date: ${notice.date ?? "날짜 미상"}`,
        `audience: ${notice.audienceGroup ?? "대상 미분류"}`,
        `source_group: ${notice.sourceGroup ?? "중분류 없음"}`,
        `sources: ${getNoticeSourceNames(notice).join(", ") || "출처 미상"}`,
        `category: ${notice.category ?? "분류 없음"}`,
        `url: ${notice.url ?? "링크 없음"}`,
        `summary: ${summary}`,
        `content: ${content}`
      ].join("\n");
    })
    .join("\n\n");
}

function fallbackAnswer(question: string, notices: Notice[]): string {
  if (notices.length === 0) {
    return "관련 공지를 찾지 못했습니다. 검색어를 더 구체적으로 입력하거나 공지 목록에서 직접 확인해주세요.";
  }

  const lines = notices.slice(0, 3).map((notice, index) => {
    const prefix = `${index + 1}. ${notice.title}`;
    const meta = [notice.date, notice.source].filter(Boolean).join(" | ");
    const summary = notice.summary ?? "요약 정보 없음";
    return `${prefix}\n${meta}\n${summary}`;
  });

  return [
    `질문: ${question}`,
    "",
    "OpenAI API 키가 없어 로컬 검색 결과를 기준으로 안내합니다.",
    "",
    ...lines,
    "",
    "정확한 일정/세부조건은 각 공지 원문 링크에서 확인해주세요."
  ].join("\n");
}

function extractMessageText(content: string | Array<{ type: string; text?: string }> | null | undefined): string {
  if (!content) {
    return "";
  }

  if (typeof content === "string") {
    return content;
  }

  const textParts = content
    .filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text?.trim())
    .filter((value): value is string => Boolean(value));

  return textParts.join("\n");
}

interface AskNoticeQuestionInput {
  question: string;
  filters?: Omit<NoticeQuery, "q" | "page" | "pageSize">;
}

export async function askNoticeQuestion(input: AskNoticeQuestionInput): Promise<ChatAnswer> {
  const question = input.question.trim();
  const referencesSource = await noticeService.findRelevantNotices(question, 6, input.filters ?? {});
  const references = buildReferences(referencesSource);
  const context = buildContext(referencesSource);

  const client = getOpenAIClient();

  if (!client) {
    return {
      answer: fallbackAnswer(question, referencesSource),
      references,
      usedFallback: true,
      model: "local-fallback"
    };
  }

  try {
    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `질문:\n${question}\n\n공지 컨텍스트:\n${context}`
        }
      ]
    });

    const answer = extractMessageText(completion.choices[0]?.message?.content) || fallbackAnswer(question, referencesSource);

    return {
      answer,
      references,
      usedFallback: false,
      model: DEFAULT_MODEL
    };
  } catch (error) {
    console.error("Failed to call OpenAI:", error);

    return {
      answer: `${fallbackAnswer(question, referencesSource)}\n\n(OpenAI 호출 중 오류가 발생하여 로컬 답변으로 대체되었습니다.)`,
      references,
      usedFallback: true,
      model: "local-fallback"
    };
  }
}
