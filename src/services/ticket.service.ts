const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

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
    throw new Error(error.message || "Failed to fetch staff display data");
  }
  return response.json();
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
  return response.json();
};

export const completeTicketApi = async (ticketId: string) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/tickets/${ticketId}/complete`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};

export const skipTicketApi = async (ticketId: string) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/tickets/${ticketId}/skip`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};

export const createTicket = async (data: {
  name: string;
  phone: string;
  serviceId: string;
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
