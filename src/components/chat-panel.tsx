"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import { shouldUseSourceFilter } from "@/lib/notices";
import { ChatStreamEvent, NoticeReference } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  references?: NoticeReference[];
  status?: "searching" | "answering" | "done" | "error";
}

const INITIAL_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "공지 데이터 기반으로 답변합니다. 일정/제출 요건처럼 중요한 내용은 원문 공지 링크를 함께 확인하세요.",
  status: "done",
};

const STATUS_PLACEHOLDER: Record<NonNullable<ChatMessage["status"]>, string> = {
  searching: "관련 공지를 검색하고 있어요",
  answering: "답변을 작성하고 있어요",
  done: "",
  error: "",
};

async function* readSseEvents(
  response: Response,
): AsyncGenerator<ChatStreamEvent, void, unknown> {
  if (!response.body) {
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });

    let separatorIndex = buffer.indexOf("\n\n");
    while (separatorIndex !== -1) {
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      separatorIndex = buffer.indexOf("\n\n");

      const dataLines: string[] = [];
      for (const line of rawEvent.split("\n")) {
        if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trimStart());
        }
      }
      if (dataLines.length === 0) {
        continue;
      }

      try {
        yield JSON.parse(dataLines.join("\n")) as ChatStreamEvent;
      } catch (error) {
        console.error("Failed to parse SSE event:", error, rawEvent);
      }
    }
  }
}

export default function ChatPanel() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  function updateLastAssistant(updater: (message: ChatMessage) => ChatMessage) {
    setMessages((prev) => {
      const next = [...prev];
      for (let index = next.length - 1; index >= 0; index -= 1) {
        if (next[index].role === "assistant") {
          next[index] = updater(next[index]);
          break;
        }
      }
      return next;
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const question = input.trim();
    if (!question || loading) {
      return;
    }

    setInput("");
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: question },
      { role: "assistant", content: "", status: "searching" },
    ]);

    try {
      const audienceGroup = searchParams.get("audience") ?? undefined;
      const sourceGroup = searchParams.get("group") ?? undefined;
      const source = shouldUseSourceFilter(audienceGroup)
        ? (searchParams.get("source") ?? undefined)
        : undefined;

      // 직전 대화를 history로 전달해 후속 질문 맥락을 유지한다. 인사말/진행중/에러
      // 메시지는 빼고, 완료된 user·assistant 턴만 보낸다. 서버가 최근 10개로 자른다.
      const history = messages
        .filter(
          (message) =>
            message !== INITIAL_MESSAGE &&
            message.content.trim() !== "" &&
            (message.role === "user" || message.status === "done"),
        )
        .slice(-10)
        .map((message) => ({ role: message.role, content: message.content }));

      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          question,
          history,
          audienceGroup,
          sourceGroup,
          source,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Chat stream API failed: ${response.status}`);
      }

      let receivedAnswer = false;
      for await (const streamEvent of readSseEvents(response)) {
        switch (streamEvent.type) {
          case "search_started":
            updateLastAssistant((message) => ({
              ...message,
              status: "searching",
            }));
            break;
          case "search_completed":
            updateLastAssistant((message) => ({
              ...message,
              status: "answering",
              references: streamEvent.references,
            }));
            break;
          case "answer_completed":
            receivedAnswer = true;
            updateLastAssistant((message) => ({
              ...message,
              status: "done",
              content: streamEvent.answer,
            }));
            break;
          case "error":
            updateLastAssistant((message) => ({
              ...message,
              status: "error",
              content: streamEvent.error,
            }));
            break;
        }
      }

      if (!receivedAnswer) {
        updateLastAssistant((message) =>
          message.status === "error"
            ? message
            : {
                ...message,
                status: "error",
                content:
                  "응답이 완료되지 않았습니다. 잠시 후 다시 시도해주세요.",
              },
        );
      }
    } catch (error) {
      console.error(error);
      updateLastAssistant((message) => ({
        ...message,
        status: "error",
        content: "응답 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex h-[560px] max-h-[calc(100vh-2rem)] w-full min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm md:h-[720px] xl:h-[calc(100vh-4rem)] xl:max-h-[780px]">
      <div className="border-b border-slate-200 px-4 py-4 md:px-5">
        <h2 className="text-xl font-semibold text-slate-950">AI 공지 챗봇</h2>
        <p className="mt-1 text-sm text-slate-600">
          예: &quot;수강신청 관련 최신 공지 요약해줘&quot;
        </p>
      </div>

      <div
        ref={scrollRef}
        className="min-w-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3 md:p-4"
      >
        {messages.map((message, index) => {
          const placeholder =
            message.role === "assistant" &&
            message.status &&
            message.status !== "done" &&
            !message.content
              ? STATUS_PLACEHOLDER[message.status]
              : "";
          const displayContent = message.content || placeholder;
          const isPending =
            message.role === "assistant" &&
            (message.status === "searching" ||
              message.status === "answering") &&
            !message.content;

          return (
            <div
              key={`${message.role}-${index}`}
              className={`flex min-w-0 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[92%] min-w-0 rounded-lg p-3 text-sm shadow-sm sm:max-w-[86%] ${
                  message.role === "user"
                    ? "bg-brand-600 text-white"
                    : "border border-slate-200 bg-white text-slate-800"
                }`}
              >
                <p
                  className={`break-words whitespace-pre-wrap leading-relaxed ${isPending ? "text-slate-500" : ""}`}
                >
                  {displayContent}
                  {isPending ? (
                    <span className="ml-1 animate-pulse">…</span>
                  ) : null}
                </p>

                {message.references && message.references.length > 0 ? (
                  <div className="mt-3 min-w-0 border-t border-slate-200 pt-2">
                    <p className="mb-1 text-xs font-semibold text-slate-500">
                      근거 공지
                    </p>
                    <ul className="space-y-1">
                      {message.references.map((reference) => (
                        <li
                          key={reference.id}
                          className="break-words text-xs text-slate-600"
                        >
                          {reference.url ? (
                            <Link
                              href={reference.url}
                              target="_blank"
                              rel="noreferrer"
                              className="break-all hover:underline"
                            >
                              {reference.title}
                            </Link>
                          ) : (
                            <span className="break-words">
                              {reference.title}
                            </span>
                          )}
                          {reference.date ? ` (${reference.date})` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={onSubmit}
        className="flex min-w-0 flex-col gap-2 border-t border-slate-200 bg-white p-3 sm:flex-row md:p-4"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="공지 관련 질문을 입력하세요"
          className="h-11 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-300 placeholder:text-slate-400 focus:border-brand-500 focus:ring"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full shrink-0 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {loading ? "생성 중" : "질문"}
        </button>
      </form>
    </section>
  );
}
