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
  value: string[];
  options: FilterOption[];
  onChange: (value: string[]) => void;
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
    <div
      className="admin-filter"
      ref={containerRef}
      style={{ display: "flex", alignItems: "center", gap: "10px" }}
    >
      <button
        type="button"
        className={`admin-filter-trigger ${open ? "is-open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <FiFilter size={16} />
        <span>Bộ lọc</span>
        <span
          className={`admin-filter-badge ${hasActiveFilters ? "" : "is-hidden"}`}
          aria-hidden={!hasActiveFilters}
        >
          {hasActiveFilters ? activeCount : 0}
        </span>
      </button>

      {open && (
        <div
          className="admin-filter-popover"
          style={{ maxHeight: "400px", overflowY: "auto" }}
        >
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
              <div key={section.id} className="admin-filter-field">
                <span style={{ display: "block", marginBottom: "8px" }}>
                  {section.label}
                </span>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    maxHeight: "150px",
                    overflowY: "auto",
                  }}
                >
                  {section.options.map((option) => {
                    const isChecked = section.value.includes(option.value);

                    return (
                      <label
                        key={option.value}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          fontWeight: "normal",
                          textTransform: "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(event) => {
                            if (event.target.checked) {
                              if (option.value === "all") {
                                section.onChange(["all"]);
                              } else {
                                const newValue = section.value.filter(
                                  (item) =>
                                    item !== "all" && item !== option.value,
                                );
                                newValue.push(option.value);
                                section.onChange(newValue);
                              }
                            } else {
                              const newValue = section.value.filter(
                                (item) => item !== option.value,
                              );
                              if (newValue.length === 0) newValue.push("all");
                              section.onChange(newValue);
                            }
                          }}
                        />
                        {option.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
