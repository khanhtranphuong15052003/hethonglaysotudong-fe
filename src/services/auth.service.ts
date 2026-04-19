// src/services/auth.service.ts

import { getPublicApiBase } from "@/lib/runtime-config";

const API_BASE = getPublicApiBase();

export interface StaffLoginResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      id: string;
      username: string;
      fullName: string;
      role: "staff";
      counterId: string;
    };
  };
  message?: string; // message vẫn ở đây
}
export async function loginStaff(
  credentials: Record<"username" | "password", string>,
): Promise<StaffLoginResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Đăng nhập thất bại");
  }

  return data;
}

export interface AdminLoginResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      id: string;
      username: string;
      fullName: string;
      role: "admin" | "staff";
      counterId?: string;
    };
  };
  message?: string;
}

export async function loginAdmin(
  credentials: Record<"username" | "password", string>,
): Promise<AdminLoginResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const rawText = await response.text();

  let data: AdminLoginResponse;
  try {
    data = JSON.parse(rawText) as AdminLoginResponse;
  } catch {
    throw new Error("Phản hồi đăng nhập admin không hợp lệ");
  }

  if (!response.ok) {
    throw new Error(data.message || "Đăng nhập admin thất bại");
  }

  return data;
}
