import { getPublicApiBase } from "@/lib/runtime-config";

const API_BASE = getPublicApiBase();

type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string | string[]>;
};

const getErrorMessageFromPayload = (
  payload: ApiErrorPayload | null,
  rawText: string,
  fallbackMessage: string,
) => {
  if (!payload) {
    if (rawText.trim()) {
      return rawText.trim();
    }

    return fallbackMessage;
  }

  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  if (payload.errors && typeof payload.errors === "object") {
    for (const value of Object.values(payload.errors)) {
      if (Array.isArray(value) && value.length > 0) {
        return String(value[0]);
      }

      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }
  }

  return fallbackMessage;
};

const parseJsonSafely = <T>(rawText: string): T | null => {
  try {
    return JSON.parse(rawText) as T;
  } catch {
    return null;
  }
};

export interface StaffLoginResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      id: string;
      username: string;
      fullName: string;
      role: "staff" | "admin";
      counterId?: string;
    };
  };
  message?: string;
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

  const rawText = await response.text();
  const data = parseJsonSafely<StaffLoginResponse & ApiErrorPayload>(rawText);

  if (!response.ok) {
    throw new Error(
      getErrorMessageFromPayload(data, rawText, "Đăng nhập thất bại"),
    );
  }

  if (!data) {
    throw new Error("Phản hồi đăng nhập không hợp lệ");
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
  const data = parseJsonSafely<AdminLoginResponse & ApiErrorPayload>(rawText);

  if (!response.ok) {
    throw new Error(
      getErrorMessageFromPayload(data, rawText, "Đăng nhập admin thất bại"),
    );
  }

  if (!data) {
    throw new Error("Phản hồi đăng nhập admin không hợp lệ");
  }

  return data;
}
