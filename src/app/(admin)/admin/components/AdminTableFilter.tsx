"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiFilter, FiX } from "react-icons/fi";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterSection {
  id: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

interface AdminTableFilterProps {
  sections: FilterSection[];
  activeCount: number;
  onReset: () => void;
}

export default function AdminTableFilter({
  sections,
  activeCount,
  onReset,
}: AdminTableFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasActiveFilters = useMemo(() => activeCount > 0, [activeCount]);

  return (
    <div className="admin-filter" ref={containerRef}>
      <button
        type="button"
        className={`admin-filter-trigger ${open ? "is-open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <FiFilter size={16} />
        <span>Filter</span>
        {hasActiveFilters && (
          <span className="admin-filter-badge">{activeCount}</span>
        )}
      </button>

      {open && (
        <div className="admin-filter-popover">
          <div className="admin-filter-popover__header">
            <strong>Bộ lọc</strong>
            {hasActiveFilters && (
              <button
                type="button"
                className="admin-filter-reset"
                onClick={onReset}
              >
                <FiX size={14} />
                <span>Xóa lọc</span>
              </button>
            )}
          </div>

          <div className="admin-filter-popover__body">
            {sections.map((section) => (
              <label
                key={section.id}
                className="admin-filter-field"
                htmlFor={`filter-${section.id}`}
              >
                <span>{section.label}</span>
                <select
                  id={`filter-${section.id}`}
                  className="admin-filter-select"
                  value={section.value}
                  onChange={(event) => section.onChange(event.target.value)}
                >
                  {section.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
