"use client";

import { ReactNode, useEffect } from "react";
import {
  getCurrentPathWithSearch,
  isCurrentRolePort,
  redirectToRoleUrl,
} from "@/lib/role-routing";

export default function StaffLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!isCurrentRolePort("staff")) {
      redirectToRoleUrl("staff", getCurrentPathWithSearch());
    }
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        width: "100%",
      }}
    >
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
