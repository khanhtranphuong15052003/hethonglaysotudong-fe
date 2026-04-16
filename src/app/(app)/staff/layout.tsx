"use client";

import { ReactNode } from "react";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        width: "100%",
      }}
    >
      {/* Content wrapper - centered and consistent */}
      <div
        style={{
          flex: 1,
          minHeight: "calc(100vh - 140px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(24px, 4vh, 48px) 20px",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </div>
  );
}
