"use client";

import { useEffect } from "react";
import { redirectToRoleUrl } from "@/lib/role-routing";

export default function StaffPage() {
  useEffect(() => {
    const token = sessionStorage.getItem("staffToken");
    if (token) {
      const staffData = sessionStorage.getItem("staffToken");
      if (staffData) {
        const [, counterId] = staffData.split(":");
        if (counterId) {
          redirectToRoleUrl("staff", `/staff/${counterId}`, false);
          return;
        }
      }
    }

    redirectToRoleUrl("staff", "/staff/login", false);
  }, []);

  return <div>Đang chuyển hướng...</div>;
}
