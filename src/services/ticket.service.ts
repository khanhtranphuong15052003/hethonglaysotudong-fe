const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;
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
  return localStorage.getItem("staffToken");
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
  if (!response.ok || (data && data.success === false)) {
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

export { AUTH_EXPIRED_ERROR };

export const createTicket = async (data: {
  name: string;
  phone: string;
  serviceId: string;
  counterId?: string;
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
