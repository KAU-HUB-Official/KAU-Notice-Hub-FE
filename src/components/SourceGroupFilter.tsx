"use client";

import { ALL_SOURCE_GROUPS } from "@/lib/notices";

interface SourceGroupFilterProps {
  sourceGroups: string[];
  selectedSourceGroup: string;
  onSelect: (sourceGroup: string) => void;
}

export default function SourceGroupFilter({
  sourceGroups,
  selectedSourceGroup,
  onSelect
}: SourceGroupFilterProps) {
  const items = [
    { value: ALL_SOURCE_GROUPS, label: "전체 중분류" },
    ...sourceGroups.map((sourceGroup) => ({
      value: sourceGroup,
      label: sourceGroup
    }))
  ];

  return (
    <nav aria-label="중분류 필터" className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-2">
      <div className="mb-2 px-1 text-xs font-semibold text-slate-500">중분류</div>
      <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
        {items.map((item) => {
          const active =
            item.value === ALL_SOURCE_GROUPS
              ? selectedSourceGroup === ALL_SOURCE_GROUPS
              : selectedSourceGroup === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onSelect(item.value)}
              className={`max-w-[70vw] shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition sm:max-w-[260px] ${
                active
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-white text-slate-700 hover:bg-slate-100"
              }`}
              aria-pressed={active}
              title={item.label}
            >
              <span className="block truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
