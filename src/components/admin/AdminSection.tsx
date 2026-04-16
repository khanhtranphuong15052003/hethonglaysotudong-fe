"use client";

import type { ReactNode } from "react";

interface AdminSectionProps {
  title: string;
  children: ReactNode;
}

export default function AdminSection({
  title,
  children,
}: AdminSectionProps) {
  return (
    <section className="admin-table-container">
      <div className="admin-page-heading">
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
