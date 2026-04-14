"use client";

import { io, Socket } from "socket.io-client";

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function stripApiSuffix(value: string) {
  return value.replace(/\/api$/i, "");
}

function getSocketBaseUrl() {
  const explicitSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (explicitSocketUrl) {
    return trimTrailingSlash(explicitSocketUrl);
  }

  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (backendApiUrl) {
    return trimTrailingSlash(stripApiSuffix(backendApiUrl));
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    return trimTrailingSlash(apiUrl);
  }

  return "";
}

const SOCKET_BASE_URL = getSocketBaseUrl();

export interface StaffDisplaySnapshot {
  counter: {
    id: string;
    name: string;
    number: number;
    isActive: boolean;
    processedCount: number;
  };
  services: Array<{ id: string; name: string; code: string }>;
  currentTicket: {
    id: string;
    number: number;
    formattedNumber: string;
    customerName: string;
    phone: string;
    status: "waiting" | "processing" | "completed" | "skipped" | "done";
    serviceName: string;
    createdAt: string;
  } | null;
  waitingTickets: Array<{
    id: string;
    number: number;
    formattedNumber: string;
    customerName: string;
    phone: string;
    status: "waiting" | "processing" | "completed" | "skipped" | "done";
    serviceName: string;
    createdAt: string;
  }>;
  totalWaiting: number;
}

export interface StaffDisplayUpdatedPayload {
  reason: string;
  counterId: string;
  updatedAt?: string;
  ticketId?: string;
  serviceId?: string;
  data: StaffDisplaySnapshot;
}

export interface JoinedCounterRoomPayload {
  counterId: string;
  room: string;
}

export interface SocketErrorPayload {
  message: string;
}

export function createStaffSocket() {
  return io(SOCKET_BASE_URL, {
    transports: ["websocket"],
  });
}

export function joinCounterRoom(socket: Socket, counterId: string) {
  socket.emit("join-staff-display", { counterId });
  socket.emit("join-counter", counterId);
}

export function onStaffDisplayUpdated(
  socket: Socket,
  handler: (payload: StaffDisplayUpdatedPayload) => void,
) {
  socket.on("staff-display-updated", handler);
  return () => {
    socket.off("staff-display-updated", handler);
  };
}

export function onJoinedCounterRoom(
  socket: Socket,
  handler: (payload: JoinedCounterRoomPayload) => void,
) {
  socket.on("joined-counter-room", handler);
  return () => {
    socket.off("joined-counter-room", handler);
  };
}

export function onSocketError(
  socket: Socket,
  handler: (payload: SocketErrorPayload) => void,
) {
  socket.on("socket-error", handler);
  return () => {
    socket.off("socket-error", handler);
  };
}
