"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// SSR에서 useLayoutEffect 경고를 피하면서, 클라이언트에서는 paint 전에 측정해
// "전부 펼쳤다가 접히는" 깜빡임이 보이지 않도록 한다.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface ChipItem {
  value: string;
  label: string;
}

interface CollapsibleChipRowProps {
  ariaLabel: string;
  label: string;
  items: ChipItem[];
  selectedValue: string;
  allValue: string;
  onSelect: (value: string) => void;
  theme: "emerald" | "brand";
  chipTitle?: (item: ChipItem) => string;
}

const THEME = {
  emerald: {
    activeChip: "bg-emerald-700 text-white shadow-sm",
    toggle:
      "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-solid hover:bg-emerald-100",
  },
  brand: {
    activeChip: "bg-brand-600 text-white shadow-sm",
    toggle:
      "border-brand-300 bg-brand-50 text-brand-700 hover:border-solid hover:bg-brand-100",
  },
} as const;

const CHIP_BASE =
  "shrink-0 whitespace-nowrap rounded-md px-3.5 py-2 text-sm font-medium transition";
const INACTIVE_CHIP =
  "bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50";
const TOGGLE_BASE =
  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-dashed px-3.5 py-2 text-sm font-medium transition";

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
    >
      <path
        d="M5.5 8L10 12.5L14.5 8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CollapsibleChipRow({
  ariaLabel,
  label,
  items,
  selectedValue,
  allValue,
  onSelect,
  theme,
  chipTitle,
}: CollapsibleChipRowProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [needsToggle, setNeedsToggle] = useState(false);

  // 칩 구성이 바뀌면(개수·라벨) 다시 측정한다.
  const signature = items.map((item) => item.value).join("|");

  useIsomorphicLayoutEffect(() => {
    const container = measureRef.current;
    if (!container) {
      return;
    }

    function measure() {
      const node = measureRef.current;
      if (!node) {
        return;
      }

      const available = node.clientWidth;
      if (available === 0) {
        return;
      }

      const gap = Number.parseFloat(window.getComputedStyle(node).columnGap) || 8;

      // 마지막 child는 더보기 버튼 샘플, 앞쪽은 칩들의 자연 너비.
      const children = Array.from(node.children) as HTMLElement[];
      if (children.length === 0) {
        return;
      }
      const toggleWidth =
        children[children.length - 1].getBoundingClientRect().width;
      const widths = children
        .slice(0, children.length - 1)
        .map((child) => child.getBoundingClientRect().width);

      // 전부 한 줄에 들어가면 더보기가 필요 없다.
      let sumAll = 0;
      widths.forEach((width, index) => {
        sumAll += width + (index > 0 ? gap : 0);
      });
      if (sumAll <= available) {
        setNeedsToggle(false);
        setVisibleCount(widths.length);
        return;
      }

      // 더보기 버튼 자리를 남기면서 한 줄에 들어갈 칩 수를 그리디로 계산한다.
      let used = 0;
      let count = 0;
      for (let index = 0; index < widths.length; index += 1) {
        const add = (count > 0 ? gap : 0) + widths[index];
        if (used + add + gap + toggleWidth <= available) {
          used += add;
          count += 1;
        } else {
          break;
        }
      }

      setNeedsToggle(true);
      setVisibleCount(Math.max(1, count));
    }

    measure();

    const observer = new ResizeObserver(() => measure());
    observer.observe(container);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const collapsed = needsToggle && !expanded;

  let visibleItems = items;
  if (collapsed) {
    visibleItems = items.slice(0, visibleCount);
    // 접힌 영역에 현재 선택된 칩이 있으면 항상 함께 보여 선택 상태가 가려지지 않게 한다.
    const selectedIndex = items.findIndex((item) => item.value === selectedValue);
    if (selectedValue !== allValue && selectedIndex >= visibleCount) {
      visibleItems = [...visibleItems, items[selectedIndex]];
    }
  }

  const hiddenCount = items.length - visibleItems.length;

  return (
    <nav
      aria-label={ariaLabel}
      className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-2"
    >
      <div className="mb-2 px-1 text-xs font-semibold text-slate-500">
        {label}
      </div>

      {/* 너비 측정용(화면에 보이지 않음). 모든 칩 + 더보기 버튼 샘플의 자연 너비를 잰다. */}
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none flex h-0 w-full flex-wrap gap-2 overflow-hidden opacity-0"
      >
        {items.map((item) => (
          <span key={item.value} className={`${CHIP_BASE} ${INACTIVE_CHIP}`}>
            {item.label}
          </span>
        ))}
        <span className={`${TOGGLE_BASE} ${THEME[theme].toggle}`}>
          더보기 00개
          <span className="inline-block h-4 w-4" />
        </span>
      </div>

      <div className="flex min-w-0 flex-wrap gap-2">
        {visibleItems.map((item) => {
          const active = selectedValue === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onSelect(item.value)}
              className={`${CHIP_BASE} ${active ? THEME[theme].activeChip : INACTIVE_CHIP}`}
              aria-pressed={active}
              title={chipTitle ? chipTitle(item) : item.label}
            >
              {item.label}
            </button>
          );
        })}

        {needsToggle ? (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className={`${TOGGLE_BASE} ${THEME[theme].toggle}`}
            aria-expanded={expanded}
          >
            {expanded ? "접기" : `더보기 ${hiddenCount}개`}
            <Chevron expanded={expanded} />
          </button>
        ) : null}
      </div>
    </nav>
  );
}
