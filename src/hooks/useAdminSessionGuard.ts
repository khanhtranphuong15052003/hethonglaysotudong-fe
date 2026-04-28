"use client";

import { useCallback } from "react";
import {
  ADMIN_AUTH_EXPIRED_ERROR,
  clearAdminSession,
  isAuthExpiredMessage,
} from "@/lib/admin-auth";
import { redirectToRoleUrl } from "@/lib/role-routing";

export function useAdminSessionGuard() {
  return useCallback(
    (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error || "");

      if (
        message === ADMIN_AUTH_EXPIRED_ERROR ||
        isAuthExpiredMessage(message)
      ) {
        clearAdminSession();
        redirectToRoleUrl("admin", "/login?reason=session_expired");
        return true;
      }

      return false;
    },
    [],
  );
}
