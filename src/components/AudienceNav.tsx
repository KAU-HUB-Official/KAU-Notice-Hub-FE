"use client";

import { ALL_AUDIENCE_GROUPS } from "@/lib/notices";

interface AudienceNavProps {
  audienceGroups: string[];
  selectedAudience: string;
  onSelect: (audienceGroup: string) => void;
}

interface AudienceItem {
  value: string;
  label: string;
}

function AudienceTab({
  item,
  active,
  onClick
}: {
  item: AudienceItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`max-w-[80vw] shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition sm:max-w-[320px] ${
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
      aria-pressed={active}
      title={item.label}
    >
      <span className="block truncate">{item.label}</span>
    </button>
  );
}

export default function AudienceNav({
  audienceGroups,
  selectedAudience,
  onSelect
}: AudienceNavProps) {
  const items: AudienceItem[] = [
    { value: ALL_AUDIENCE_GROUPS, label: "전체 대상" },
    ...audienceGroups.map((audienceGroup) => ({
      value: audienceGroup,
      label: audienceGroup
    }))
  ];

  return (
    <nav aria-label="대상자 필터" className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-2">
      <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
        {items.map((item) => (
          <AudienceTab
            key={item.value}
            item={item}
            active={selectedAudience === item.value}
            onClick={() => onSelect(item.value)}
          />
        ))}
      </div>
    </nav>
  );
}
