"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getStaffFromToken } from "@/mock/auth";

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === "undefined") {
        return;
      }

      const token = localStorage.getItem("staffToken");
      if (!token) {
        router.push("/staff/login");
        setIsLoading(false);
        return;
      }

      const staff = getStaffFromToken(token);
      if (!staff) {
        localStorage.removeItem("staffToken");
        localStorage.removeItem("staffName");
        router.push("/staff/login");
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return <div>Đang tải...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export function StaffLogoutButton() {
  const router = useRouter();
  const staffName =
    typeof window !== "undefined" ? localStorage.getItem("staffName") : "";

  const handleLogout = () => {
    localStorage.removeItem("staffToken");
    localStorage.removeItem("staffName");
    router.push("/staff/login");
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 20,
        display: "flex",
        alignItems: "center",
        gap: 15,
      }}
    >
      <span style={{ fontSize: 14, color: "#666" }}>
        {staffName && `Xin chào: ${staffName}`}
      </span>
      <button
        onClick={handleLogout}
        style={{
          padding: "8px 16px",
          fontSize: 14,
          background: "#dc3545",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        Đăng xuất
      </button>
    </div>
  );
}
