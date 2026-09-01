"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import ChatPanel from "@/components/chat-panel";

// 데스크톱(xl 이상)은 사이드바에 챗봇이 상주하므로 시트를 띄우지 않는다.
const DESKTOP_MEDIA_QUERY = "(min-width: 1280px)";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

interface ViewportBox {
  height: number;
  offsetTop: number;
}

/**
 * 모바일 전용 챗봇 진입점.
 * 공지 목록 끝까지 스크롤하지 않아도 어디서든 열 수 있고, 열리면 화면 전체를
 * 채워 메시지 영역을 최대로 확보한다.
 */
export default function ChatLauncher() {
  const [open, setOpen] = useState(false);
  // 한 번 열면 언마운트하지 않는다. 닫아도 대화 내역과 sessionId가 유지된다.
  const [mounted, setMounted] = useState(false);
  const [viewport, setViewport] = useState<ViewportBox | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  const openSheet = useCallback(() => {
    setMounted(true);
    setOpen(true);
  }, []);

  // 데스크톱 폭으로 넓어지면 시트를 닫는다. 열린 채로 숨기면 body 스크롤 잠금이 남는다.
  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const syncViewportWidth = () => {
      if (mediaQuery.matches) {
        setOpen(false);
      }
    };

    syncViewportWidth();
    mediaQuery.addEventListener("change", syncViewportWidth);
    return () => mediaQuery.removeEventListener("change", syncViewportWidth);
  }, []);

  // 시트가 열린 동안 뒤 페이지가 같이 스크롤되지 않게 막는다.
  useEffect(() => {
    if (!open) {
      return;
    }

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [open]);

  // iOS는 키보드가 올라와도 100dvh가 줄지 않아 입력창이 키보드 뒤로 숨는다.
  // visualViewport 크기에 시트 높이를 맞춰 입력창이 항상 보이게 한다.
  useEffect(() => {
    const visualViewport = window.visualViewport;
    if (!open || !visualViewport) {
      return;
    }

    const syncViewportBox = () => {
      setViewport({
        height: visualViewport.height,
        offsetTop: visualViewport.offsetTop,
      });
    };

    syncViewportBox();
    visualViewport.addEventListener("resize", syncViewportBox);
    visualViewport.addEventListener("scroll", syncViewportBox);
    return () => {
      visualViewport.removeEventListener("resize", syncViewportBox);
      visualViewport.removeEventListener("scroll", syncViewportBox);
    };
  }, [open]);

  // ESC로 닫고, Tab 포커스가 시트 밖으로 나가지 않게 가둔다.
  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  // 열 때는 시트로, 닫을 때는 열었던 버튼으로 포커스를 돌려준다.
  // 입력창이 아니라 시트에 포커스를 줘서 열자마자 키보드가 뜨지 않게 한다.
  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
    } else if (mounted) {
      triggerRef.current?.focus();
    }
  }, [open, mounted]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openSheet}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="fixed bottom-5 right-4 z-40 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 xl:hidden"
      >
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M17 11.5a1.5 1.5 0 0 1-1.5 1.5H7l-3.5 3v-3H3a1.5 1.5 0 0 1-1.5-1.5v-7A1.5 1.5 0 0 1 3 3h12.5A1.5 1.5 0 0 1 17 4.5z" />
        </svg>
        AI 챗봇
      </button>

      {mounted ? (
        <div
          className={`fixed inset-0 z-50 bg-slate-950/40 xl:hidden ${open ? "" : "hidden"}`}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="AI 공지 챗봇"
            tabIndex={-1}
            style={
              viewport
                ? { height: `${viewport.height}px`, top: `${viewport.offsetTop}px` }
                : undefined
            }
            className="absolute inset-x-0 top-0 h-[100dvh] outline-none"
          >
            <ChatPanel variant="sheet" onClose={close} />
          </div>
        </div>
      ) : null}
    </>
  );
}
