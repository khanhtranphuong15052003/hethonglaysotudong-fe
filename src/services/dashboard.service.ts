"use client";

import {
  ADMIN_AUTH_EXPIRED_ERROR,
} from "@/lib/admin-auth";
import { getPublicApiBase } from "@/lib/runtime-config";

const API_BASE = getPublicApiBase();
export const DASHBOARD_AUTH_EXPIRED_ERROR = ADMIN_AUTH_EXPIRED_ERROR;

const getAuthHeaders = () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export interface DashboardAlert {
  type: string;
  message: string;
}

export interface DashboardServiceOverview {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  displayOrder: number;
  counters: number;
  waiting: number;
  processing: number;
  completedToday: number;
}

export interface DashboardCounterOverview {
  id: string;
  code: string;
  name: string;
  number: number;
  isActive: boolean;
  processedCount: number;
  waiting: number;
  overloadThreshold: number;
  isOverloaded: boolean;
  overloadLevel: string;
  isServing: boolean;
  currentTicket: {
    id: string;
    number: number;
    ticketNumber: string;
    customerName: string;
    status: string;
    serviceId: string;
  } | null;
  staff: {
    id: string;
    fullName: string;
    username: string;
  } | null;
}

export interface DashboardRecentTicket {
  id: string;
  number: number;
  ticketNumber: string;
  customerName: string;
  phone?: string;
  status: string;
  skipCount: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  service: {
    id: string;
    code: string;
    name: string;
  } | null;
  counter: {
    id: string;
    code: string;
    name: string;
    number: number;
  } | null;
}

export interface DashboardOverviewSummary {
  totalWaiting: number;
  totalProcessing: number;
  totalServices: number;
  activeServices: number;
  totalCounters: number;
  activeCounters: number;
  totalStaff: number;
  activeStaff: number;
  assignedStaff: number;
  unassignedStaff: number;
  ticketsIssuedToday: number;
  ticketsCompletedToday: number;
  ticketsSkippedToday: number;
  averageHandleTimeInMinutes: number;
  overloadedCounters: number;
  overloadThreshold: number;
}

export interface DashboardOverviewData {
  generatedAt: string;
  summary: DashboardOverviewSummary;
  alerts: DashboardAlert[];
  services: DashboardServiceOverview[];
  counters: DashboardCounterOverview[];
  recentTickets: DashboardRecentTicket[];
}

export interface DashboardReportSummary {
  issued: number;
  waiting: number;
  processing: number;
  completed: number;
  skipped: number;
  averageHandleTimeInMinutes: number;
}

export interface DashboardReportService {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  displayOrder: number;
  issued: number;
  completed: number;
  skipped: number;
  waitingNow: number;
}

export interface DashboardReportCounter {
  id: string;
  code: string;
  name: string;
  number: number;
  isActive: boolean;
  processedCount: number;
  served: number;
  completed: number;
  skipped: number;
  waitingNow: number;
  isOverloaded: boolean;
}

export interface DashboardReportTimelinePoint {
  label: string;
  issued: number;
  completed: number;
}

export interface DashboardReportData {
  generatedAt: string;
  period: "daily" | "monthly";
  label: string;
  range: {
    start: string;
    end: string;
  };
  summary: DashboardReportSummary;
  services: DashboardReportService[];
  counters: DashboardReportCounter[];
  timeline: DashboardReportTimelinePoint[];
}

const ensureApiBase = () => {
  if (!API_BASE) {
    throw new Error(
      "NEXT_PUBLIC_BACKEND_API_URL is not configured in the environment.",
    );
  }

  return API_BASE;
};

export async function getDashboardOverview(): Promise<DashboardOverviewData> {
  const response = await fetch(`${ensureApiBase()}/admin/dashboard/overview`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  const data = await response.json();
  const normalizedMessage = String(data?.message || "").toLowerCase();
  if (
    response.status === 401 ||
    normalizedMessage.includes("token") ||
    normalizedMessage.includes("expired") ||
    normalizedMessage.includes("hết hạn") ||
    normalizedMessage.includes("het han") ||
    normalizedMessage.includes("unauthorized") ||
    normalizedMessage.includes("không hợp lệ") ||
    normalizedMessage.includes("khong hop le")
  ) {
    throw new Error(DASHBOARD_AUTH_EXPIRED_ERROR);
  }
  if (!data.success) {
    throw new Error(data.message || "Khong the tai tong quan thong ke");
  }

  return data.data as DashboardOverviewData;
}

export async function getDashboardReport(params: {
  period: "daily" | "monthly";
  date?: string;
  month?: string;
}): Promise<DashboardReportData> {
  const searchParams = new URLSearchParams({ period: params.period });

  if (params.period === "daily" && params.date) {
    searchParams.set("date", params.date);
  }

  if (params.period === "monthly" && params.month) {
    searchParams.set("month", params.month);
  }

  const response = await fetch(
    `${ensureApiBase()}/admin/dashboard/reports?${searchParams.toString()}`,
    {
      headers: getAuthHeaders(),
      cache: "no-store",
    },
  );

  const data = await response.json();
  const normalizedMessage = String(data?.message || "").toLowerCase();
  if (
    response.status === 401 ||
    normalizedMessage.includes("token") ||
    normalizedMessage.includes("expired") ||
    normalizedMessage.includes("hết hạn") ||
    normalizedMessage.includes("het han") ||
    normalizedMessage.includes("unauthorized") ||
    normalizedMessage.includes("không hợp lệ") ||
    normalizedMessage.includes("khong hop le")
  ) {
    throw new Error(DASHBOARD_AUTH_EXPIRED_ERROR);
  }
  if (!data.success) {
    throw new Error(data.message || "Khong the tai bao cao thong ke");
  }

  return data.data as DashboardReportData;
}
