"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { shouldUseSourceFilter } from "@/lib/notices";
import { ChatAnswer } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  references?: ChatAnswer["references"];
}

const INITIAL_MESSAGE: ChatMessage = {
  role: "assistant",
  content: "공지 데이터 기반으로 답변합니다. 일정/제출 요건처럼 중요한 내용은 원문 공지 링크를 함께 확인하세요."
};

export default function ChatPanel() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const question = input.trim();
    if (!question || loading) {
      return;
    }

    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: question }]);

    try {
      const audienceGroup = searchParams.get("audience") ?? undefined;
      const sourceGroup = searchParams.get("group") ?? undefined;
      const source = shouldUseSourceFilter(audienceGroup)
        ? searchParams.get("source") ?? undefined
        : undefined;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question,
          audienceGroup,
          sourceGroup,
          source
        })
      });

      if (!response.ok) {
        throw new Error(`Chat API failed: ${response.status}`);
      }

      const data = (await response.json()) as ChatAnswer;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          references: data.references
        }
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "응답 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex h-[560px] w-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:h-[780px] md:p-5">
      <h2 className="text-xl font-semibold text-slate-900">AI 공지 챗봇</h2>
      <p className="mt-1 text-sm text-slate-600">예: &quot;수강신청 관련 최신 공지 요약해줘&quot;</p>

      <div className="mt-4 min-w-0 flex-1 space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex min-w-0 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[92%] min-w-0 rounded-lg p-3 text-sm sm:max-w-[86%] ${
                message.role === "user"
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-800"
              }`}
            >
              <p className="break-words whitespace-pre-wrap leading-relaxed">{message.content}</p>

              {message.references && message.references.length > 0 ? (
                <div className="mt-3 min-w-0 border-t border-slate-200 pt-2">
                  <p className="mb-1 text-xs font-semibold text-slate-500">근거 공지</p>
                  <ul className="space-y-1">
                    {message.references.map((reference) => (
                      <li key={reference.id} className="break-words text-xs text-slate-600">
                        {reference.url ? (
                          <Link href={reference.url} target="_blank" rel="noreferrer" className="break-all hover:underline">
                            {reference.title}
                          </Link>
                        ) : (
                          <span className="break-words">{reference.title}</span>
                        )}
                        {reference.date ? ` (${reference.date})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="공지 관련 질문을 입력하세요"
          className="w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {loading ? "생성 중" : "질문"}
        </button>
      </form>
    </section>
  );
}
