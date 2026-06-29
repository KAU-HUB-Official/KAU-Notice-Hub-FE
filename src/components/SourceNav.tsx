"use client";

import { ALL_SOURCES, formatSourceLabel } from "@/lib/notices";

import CollapsibleChipRow from "./CollapsibleChipRow";

interface SourceNavProps {
  sources: string[];
  selectedSource: string;
  onSelect: (source: string) => void;
}

export default function SourceNav({ sources, selectedSource, onSelect }: SourceNavProps) {
  const items = [
    { value: ALL_SOURCES, label: "전체 홈페이지" },
    ...sources.map((source) => ({
      value: source,
      label: formatSourceLabel(source)
    }))
  ];

  return (
    <CollapsibleChipRow
      ariaLabel="홈페이지 필터"
      label="세부 홈페이지"
      items={items}
      selectedValue={selectedSource}
      allValue={ALL_SOURCES}
      onSelect={onSelect}
      theme="brand"
      chipTitle={(item) => (item.value === ALL_SOURCES ? "전체" : item.value)}
    />
  );
}
