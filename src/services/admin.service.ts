const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL;

const getAuthHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
  const headers: { [key: string]: string } = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

// ==================== SERVICES ====================
export interface Service {
  _id: string;
  code: string;
  name: string;
  icon: string;
  isActive: boolean;
  description: string;
  displayOrder: number;
  counters: Array<{
    _id: string;
    code: string;
    name: string;
    number: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export async function getServices(): Promise<Service[]> {
  try {
    const response = await fetch(`${API_BASE}/services`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (data.success && Array.isArray(data.data)) {
      return data.data.sort(
        (a: Service, b: Service) => a.displayOrder - b.displayOrder,
      );
    }
    return [];
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
}

export async function getActiveServices(): Promise<Service[]> {
  try {
    const response = await fetch(`${API_BASE}/services/active`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (data.success && Array.isArray(data.data)) {
      return data.data.sort(
        (a: Service, b: Service) => a.displayOrder - b.displayOrder,
      );
    }
    return [];
  } catch (error) {
    console.error("Error fetching active services:", error);
    return [];
  }
}

export async function createService(
  serviceData: Omit<Service, "_id" | "createdAt" | "updatedAt" | "counters">,
): Promise<Service> {
  const response = await fetch(`${API_BASE}/services`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(serviceData),
  });
  const data = await response.json();
  if (data.success) return data.data;
  throw new Error(data.message || "Lỗi tạo dịch vụ");
}

export async function updateService(
  id: string,
  serviceData: Partial<Service>,
): Promise<Service> {
  const response = await fetch(`${API_BASE}/services/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(serviceData),
  });
  const data = await response.json();
  if (data.success) return data.data;
  throw new Error(data.message || "Lỗi cập nhật dịch vụ");
}

// ==================== COUNTERS ====================
export interface Counter {
  _id: string;
  code: string;
  name: string;
  number: number;
  isActive: boolean;
  processedCount: number;
  currentTicketId: string | null;
  note: string;
  services: Array<{
    _id: string;
    code: string;
    name: string;
    icon?: string;
    displayOrder?: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export async function getCounters(): Promise<Counter[]> {
  try {
    const response = await fetch(`${API_BASE}/counters`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching counters:", error);
    return [];
  }
}

export async function createCounter(counterData: {
  code: string;
  name: string;
  number: number;
  note: string;
  isActive?: boolean;
  serviceIds?: string[];
}): Promise<Counter> {
  const response = await fetch(`${API_BASE}/counters`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(counterData),
  });
  const data = await response.json();
  if (data.success) return data.data;
  throw new Error(data.message || "Lỗi tạo quầy");
}

export async function updateCounter(
  id: string,
  counterData: Partial<Counter>,
): Promise<Counter> {
  const response = await fetch(`${API_BASE}/counters/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(counterData),
  });
  const data = await response.json();
  if (data.success) return data.data;
  throw new Error(data.message || "Lỗi cập nhật quầy");
}

export async function deleteCounter(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/counters/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Lỗi xóa quầy");
  }
}

export async function deleteService(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/services/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Lỗi xóa dịch vụ");
  }
}

// ==================== PRINTERS ====================
export interface Printer {
  _id: string;
  name: string;
  code: string;
  type: "network" | "serial" | "usb";
  connection: {
    host?: string;
    port?: number;
    path?: string;
  };
  location: string;
  isActive: boolean;
  isDefault: boolean;
  lastTestStatus?: "success" | "failed" | "pending";
  services: string[];
}

export async function getPrinters(): Promise<Printer[]> {
  try {
    const response = await fetch(`${API_BASE}/printers`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching printers:", error);
    return [];
  }
}

export async function createPrinter(
  printerData: Omit<Printer, "_id" | "services">,
): Promise<Printer> {
  const response = await fetch(`${API_BASE}/printers`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(printerData),
  });
  const data = await response.json();
  if (data.success) return data.data;
  throw new Error(data.message || "Lỗi tạo máy in");
}

export async function updatePrinter(
  id: string,
  printerData: Partial<Omit<Printer, "_id">>,
): Promise<Printer> {
  const response = await fetch(`${API_BASE}/printers/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(printerData),
  });
  const data = await response.json();
  if (data.success) return data.data;
  throw new Error(data.message || "Lỗi cập nhật máy in");
}

export async function deletePrinter(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/printers/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Lỗi xóa máy in");
  }
}

// ==================== STAFF ====================
export interface Staff {
  _id: string;
  username: string;
  fullName: string;
  role: "staff";
  counterId: {
    _id: string;
    name: string;
    code: string;
  } | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export async function getStaff(): Promise<Staff[]> {
  try {
    const response = await fetch(`${API_BASE}/admin/users/staff`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching staff:", error);
    return [];
  }
}

export async function createStaff(
  staffData: Omit<Staff, "_id" | "role" | "counterId" | "isActive" | "lastLoginAt"> & { password?: string },
): Promise<Staff> {
  const response = await fetch(`${API_BASE}/admin/users/staff`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(staffData),
  });
  const data = await response.json();
  if (data.success) return data.data;
  throw new Error(data.message || "Lỗi tạo nhân viên");
}

export async function updateStaff(
  id: string,
  staffData: Partial<Omit<Staff, "_id" | "role">>,
): Promise<Staff> {
  const response = await fetch(`${API_BASE}/admin/users/staff/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(staffData),
  });
  const data = await response.json();
  if (data.success) return data.data;
  throw new Error(data.message || "Lỗi cập nhật nhân viên");
}

export async function deleteStaff(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/admin/users/staff/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Lỗi xóa nhân viên");
  }
}

export async function assignCounterToStaff(
  staffId: string,
  counterId: string | null,
): Promise<Staff> {
  const response = await fetch(
    `${API_BASE}/admin/users/staff/${staffId}/assign-counter`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ counterId }),
    },
  );
  const data = await response.json();
  if (data.success) return data.data;
  throw new Error(data.message || "Lỗi gán quầy cho nhân viên");
}

export async function toggleCounterActive(id: string): Promise<Counter | null> {
  try {
    const response = await fetch(`${API_BASE}/counters/${id}/toggle-active`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (data.success) return data.data;
    return null;
  } catch (error) {
    console.error("Error toggling counter active:", error);
    return null;
  }
}

export async function addServicesToCounter(
  counterId: string,
  serviceIds: string[],
): Promise<Counter> {
  const response = await fetch(`${API_BASE}/counters/${counterId}/services`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ serviceIds }),
  });
  const data = await response.json();
  if (data.success) return data.data;
  throw new Error(data.message || "Lỗi thêm dịch vụ vào quầy");
}

export async function removeServiceFromCounter(
  counterId: string,
  serviceId: string,
): Promise<Counter> {
  const response = await fetch(
    `${API_BASE}/counters/${counterId}/services/${serviceId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );
  const data = await response.json();
  if (data.success) return data.data;
  throw new Error(data.message || "Lỗi xóa dịch vụ khỏi quầy");
}
