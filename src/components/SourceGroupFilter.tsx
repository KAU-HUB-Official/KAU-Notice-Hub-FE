"use client";

import { ALL_SOURCE_GROUPS } from "@/lib/notices";

import CollapsibleChipRow from "./CollapsibleChipRow";

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
    <CollapsibleChipRow
      ariaLabel="중분류 필터"
      label="중분류"
      items={items}
      selectedValue={selectedSourceGroup}
      allValue={ALL_SOURCE_GROUPS}
      onSelect={onSelect}
      theme="emerald"
    />
  );
}
