"use client";

import * as signalR from "@microsoft/signalr";

const DEFAULT_HUB_PATH = "/ticketHub";

export const TICKET_REALTIME_EVENTS = [
  "new-ticket",
  "NewTicket",
  "ticket-created",
  "TicketCreated",
  "ticket-updated",
  "TicketUpdated",
  "ticket-called",
  "TicketCalled",
  "new-current-ticket",
  "NewCurrentTicket",
  "ticket-completed",
  "TicketCompleted",
  "ticket-finished",
  "TicketFinished",
  "ticket-skipped",
  "TicketSkipped",
] as const;

const JOIN_COUNTER_METHODS = [
  "JoinCounter",
  "join-counter",
  "JoinCounterGroup",
  "SubscribeCounter",
  "SubscribeDisplay",
  "JoinDisplay",
] as const;

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getTicketHubUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_SIGNALR_HUB_URL;
  if (explicitUrl) {
    return explicitUrl;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SOCKET_URL || "";

  return `${trimTrailingSlash(baseUrl)}${DEFAULT_HUB_PATH}`;
}

export function createTicketHubConnection(accessToken?: string | null) {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(getTicketHubUrl(), {
      accessTokenFactory: () => accessToken || "",
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  return connection;
}

export function registerTicketRefreshHandlers(
  connection: signalR.HubConnection,
  onRefresh: () => void | Promise<void>,
) {
  TICKET_REALTIME_EVENTS.forEach((eventName) => {
    connection.on(eventName, () => {
      void onRefresh();
    });
  });
}

export async function tryJoinCounterChannel(
  connection: signalR.HubConnection,
  counterId?: string | null,
) {
  if (!counterId) {
    return;
  }

  await Promise.allSettled(
    JOIN_COUNTER_METHODS.map((methodName) => connection.invoke(methodName, counterId)),
  );
}
