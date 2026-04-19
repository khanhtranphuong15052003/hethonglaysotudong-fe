import { getPublicApiBase } from "@/lib/runtime-config";

const API_URL = getPublicApiBase();
const AUTH_EXPIRED_ERROR = "AUTH_EXPIRED";

const normalizeApiErrorMessage = (message?: string) => {
  if (!message) return "";
  return message.toLowerCase();
};

const isAuthExpiredMessage = (message?: string) => {
  const normalized = normalizeApiErrorMessage(message);
  return (
    normalized.includes("token") ||
    normalized.includes("hết hạn") ||
    normalized.includes("het han") ||
    normalized.includes("expired") ||
    normalized.includes("unauthorized") ||
    normalized.includes("không hợp lệ") ||
    normalized.includes("khong hop le")
  );
};

// Helper to get token
const getToken = () => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("staffToken");
};

export const getStaffDisplay = async () => {
  const token = getToken();
  const response = await fetch(`${API_URL}/tickets/staff/display`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const error = await response.json();
    if (response.status === 401 || isAuthExpiredMessage(error.message)) {
      throw new Error(AUTH_EXPIRED_ERROR);
    }
    throw new Error(error.message || "Failed to fetch staff display data");
  }
  const data = await response.json();
  if (!data.success && isAuthExpiredMessage(data.message)) {
    throw new Error(AUTH_EXPIRED_ERROR);
  }
  return data;
};

export const callTicketById = async (ticketId: string, counterId: string) => {
  const token = getToken();
  const payload = { ticketId, counterId };
  console.log("[callTicketById] payload gửi lên:", JSON.stringify(payload));
  const response = await fetch(`${API_URL}/tickets/call-by-id`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok || (data && data.success === false)) {
    console.error("[callTicketById] 400 response body:", data);
    if (response.status === 401 || isAuthExpiredMessage(data?.message)) {
      throw new Error(AUTH_EXPIRED_ERROR);
    }
    throw new Error(data?.message || "Không thể gọi vé");
  }
  return data;
};

export const completeTicketApi = async (ticketId: string) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/tickets/${ticketId}/complete`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok || (data && data.success === false)) {
    if (response.status === 401 || isAuthExpiredMessage(data?.message)) {
      throw new Error(AUTH_EXPIRED_ERROR);
    }
    throw new Error(data?.message || "Không thể hoàn thành vé");
  }
  return data;
};

export const skipTicketApi = async (ticketId: string) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/tickets/${ticketId}/skip`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok || (data && data.success === false)) {
    if (response.status === 401 || isAuthExpiredMessage(data?.message)) {
      throw new Error(AUTH_EXPIRED_ERROR);
    }
    throw new Error(data?.message || "Không thể bỏ qua vé");
  }
  return data;
};

export const callNextTicket = async (counterId: string) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/tickets/call-next`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ counterId }),
  });
  const data = await response.json();
  if (!response.ok || data?.success === false) {
    if (response.status === 401 || isAuthExpiredMessage(data?.message)) {
      throw new Error(AUTH_EXPIRED_ERROR);
    }
    throw new Error(data?.message || "Không thể gọi số tiếp theo");
  }
  return data;
};

export const recallTicket = async (ticketId: string) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/tickets/${ticketId}/recall`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
  const data = await response.json();
  if (!response.ok || data?.success === false) {
    if (response.status === 401 || isAuthExpiredMessage(data?.message)) {
      throw new Error(AUTH_EXPIRED_ERROR);
    }
    throw new Error(data?.message || "Không thể gọi lại vé");
  }
  return data;
};

export const recallProcessingTicketApi = async (ticketId: string) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/tickets/${ticketId}/recall-processing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
  const data = await response.json();
  if (!response.ok || data?.success === false) {
    if (response.status === 401 || isAuthExpiredMessage(data?.message)) {
      throw new Error(AUTH_EXPIRED_ERROR);
    }
    throw new Error(data?.message || "Không thể gọi lại vé đang xử lý");
  }
  return data;
};

export const getRecallList = async () => {
  const token = getToken();
  const response = await fetch(`${API_URL}/tickets/recall-list`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok || data?.success === false) {
    if (response.status === 401 || isAuthExpiredMessage(data?.message)) {
      throw new Error(AUTH_EXPIRED_ERROR);
    }
    throw new Error(data?.message || "Không thể tải danh sách bỏ qua");
  }
  return data;
};

export { AUTH_EXPIRED_ERROR };

export const createTicket = async (data: {
  name: string;
  phone: string;
  serviceId: string;
  counterId?: string;
  autoPrint?: boolean;
}) => {
  const response = await fetch(`${API_URL}/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return response.json();
};
