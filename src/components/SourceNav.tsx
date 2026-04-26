"use client";

import { ALL_SOURCES, formatSourceLabel } from "@/lib/notices";

interface SourceNavProps {
  sources: string[];
  selectedSource: string;
  onSelect: (source: string) => void;
}

interface SourceItem {
  value: string;
  label: string;
}

function SourceTab({
  item,
  active,
  onClick
}: {
  item: SourceItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`max-w-[70vw] shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition sm:max-w-[280px] ${
        active
          ? "bg-brand-600 text-white shadow-sm"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
      aria-pressed={active}
      title={item.value === ALL_SOURCES ? "전체" : item.value}
    >
      <span className="block truncate">{item.label}</span>
    </button>
  );
}

export default function SourceNav({ sources, selectedSource, onSelect }: SourceNavProps) {
  const items: SourceItem[] = [
    { value: ALL_SOURCES, label: "전체 홈페이지" },
    ...sources.map((source) => ({
      value: source,
      label: formatSourceLabel(source)
    }))
  ];

  return (
    <nav aria-label="홈페이지 필터" className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-2">
      <div className="mb-2 px-1 text-xs font-semibold text-slate-500">세부 홈페이지</div>
      <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
        {items.map((item) => (
          <SourceTab
            key={item.value}
            item={item}
            active={selectedSource === item.value}
            onClick={() => onSelect(item.value)}
          />
        ))}
      </div>
    </nav>
  );
}
