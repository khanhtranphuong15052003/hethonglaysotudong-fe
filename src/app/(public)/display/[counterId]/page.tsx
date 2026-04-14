"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatServiceName, formatStaffName } from "@/lib/formatter";
import {
  StaffDisplaySnapshot,
  StaffDisplayUpdatedPayload,
  createStaffSocket,
  joinCounterRoom,
  onJoinedCounterRoom,
  onSocketError,
  onStaffDisplayUpdated,
} from "@/lib/staff-socket";
import {
  speakVietnameseAnnouncement,
  waitForResponsiveVoice,
} from "@/lib/voice";

interface Ticket {
  id: string;
  number: number;
  formattedNumber: string;
  customerName: string;
  phone: string;
  status: "waiting" | "processing" | "completed" | "skipped" | "done";
  serviceName: string;
}

interface Counter {
  id: string;
  name: string;
  number: number;
  isActive: boolean;
  processedCount: number;
}

interface DisplayData {
  counter: Counter;
  services: Array<{ id: string; name: string; code: string }>;
  currentTicket: Ticket | null;
  waitingTickets: Ticket[];
  totalWaiting: number;
}

const formatDisplayStaffName = (name: string) => {
  const formattedName = formatStaffName(name);
  const lastDotIndex = formattedName.lastIndexOf(".");

  if (lastDotIndex <= 0 || lastDotIndex === formattedName.length - 1) {
    return formattedName;
  }

  return `${formattedName.slice(0, lastDotIndex + 1)} ${formattedName.slice(
    lastDotIndex + 1,
  )}`;
};

export default function CounterDisplayPage() {
  const params = useParams();
  const counterParam = params.counterId as string;

  const [data, setData] = useState<DisplayData | null>(null);
  const [resolvedCounterId, setResolvedCounterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applySnapshot = (snapshot: StaffDisplaySnapshot) => {
    setData({
      counter: snapshot.counter,
      services: snapshot.services,
      currentTicket: snapshot.currentTicket,
      waitingTickets: snapshot.waitingTickets,
      totalWaiting: snapshot.totalWaiting,
    });
  };

  const resolveCounterId = useCallback(async (identifier: string) => {
    const normalizedIdentifier = identifier.trim();

    if (!/^\d+$/.test(normalizedIdentifier)) {
      return normalizedIdentifier;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/counters`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch counters");
    }

    const result = await response.json();
    const counters = Array.isArray(result.data) ? result.data : [];
    const matchedCounter = counters.find(
      (counter: { _id?: string; number?: number }) =>
        String(counter.number) === normalizedIdentifier,
    );

    if (!matchedCounter?._id) {
      throw new Error(`Khong tim thay quay so ${normalizedIdentifier}`);
    }

    return matchedCounter._id;
  }, []);

  const fetchDisplayData = useCallback(async () => {
    try {
      setLoading(true);
      const targetCounterId = await resolveCounterId(counterParam);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/tickets/counters/${targetCounterId}/display`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch display data");
      }

      const result = await response.json();
      setResolvedCounterId(targetCounterId);
      applySnapshot(result.data);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown display error";
      setError(errorMessage);
      setResolvedCounterId(null);
      console.error("Error fetching display data:", err);
    } finally {
      setLoading(false);
    }
  }, [counterParam, resolveCounterId]);

  useEffect(() => {
    waitForResponsiveVoice();
    if (counterParam) {
      void fetchDisplayData();
    }
  }, [counterParam, fetchDisplayData]);

  useEffect(() => {
    if (!resolvedCounterId) {
      return;
    }

    const socket = createStaffSocket();

    const unsubscribe = onStaffDisplayUpdated(
      socket,
      (payload: StaffDisplayUpdatedPayload) => {
        if (payload.counterId !== resolvedCounterId) {
          return;
        }

        applySnapshot(payload.data);

        if (payload.reason === "ticket-called" && payload.data.currentTicket) {
          const textToSpeak = `Moi so ${payload.data.currentTicket.formattedNumber} den ${payload.data.counter.name}`;
          void speakVietnameseAnnouncement(textToSpeak);
        }
      },
    );
    const unsubscribeJoined = onJoinedCounterRoom(socket, (payload) => {
      console.log("Joined counter room on display screen:", payload);
    });
    const unsubscribeSocketError = onSocketError(socket, (payload) => {
      console.error("Display socket room error:", payload);
    });

    socket.on("connect", () => {
      joinCounterRoom(socket, resolvedCounterId);
      console.log("Socket connected on display screen");
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected on display screen:", reason);
    });

    socket.on("connect_error", (socketError) => {
      console.error("Socket connection failed on display screen:", socketError);
    });

    return () => {
      unsubscribe();
      unsubscribeJoined();
      unsubscribeSocketError();
      socket.disconnect();
    };
  }, [resolvedCounterId]);

  if (loading) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f5",
          fontSize: 24,
          color: "#666",
        }}
      >
        Dang tai...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f5",
          fontSize: 24,
          color: "#dc3545",
        }}
      >
        {error || "Khong co du lieu"}
      </div>
    );
  }

  const allTickets: Ticket[] = [];
  if (data.currentTicket) {
    allTickets.push(data.currentTicket);
  }
  allTickets.push(...data.waitingTickets);
  const displayTickets = allTickets.slice(0, 5);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f5f5f5",
        padding: 0,
        margin: 0,
        overflow: "hidden",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "3px solid #003366",
          minHeight: 108,
          flexShrink: 0,
          flexDirection: "column",
          gap: 6,
          textAlign: "center",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            color: "#003366",
            letterSpacing: "1px",
            lineHeight: 1.2,
          }}
        >
          DANH SACH CHO XU LY
        </h2>
        <h2
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 700,
            color: "#003366",
            letterSpacing: "1px",
            textTransform: "uppercase",
            lineHeight: 1.2,
            background: "#ffd54f",
            borderRadius: 999,
            padding: "8px 24px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
          }}
        >
          {data.counter.name}
        </h2>
      </div>

      <div
        style={{
          flex: 1,
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            height: "100%",
            borderCollapse: "collapse",
            background: "white",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr style={{ background: "#003366", color: "white" }}>
              <th
                style={{
                  padding: "18px 16px",
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: 24,
                  letterSpacing: "1px",
                  borderRight: "2px solid #e0e0e0",
                  height: 72,
                  lineHeight: 1.3,
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
                DICH VU
              </th>
              <th
                style={{
                  padding: "18px 16px",
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: 24,
                  letterSpacing: "1px",
                  borderRight: "2px solid #e0e0e0",
                  height: 72,
                  lineHeight: 1.3,
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
                SO PHIEU
              </th>
              <th
                style={{
                  padding: "18px 16px",
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: 24,
                  letterSpacing: "1px",
                  borderRight: "2px solid #e0e0e0",
                  height: 72,
                  lineHeight: 1.3,
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
                DUONG SU
              </th>
              <th
                style={{
                  padding: "18px 16px",
                  textAlign: "center",
                  fontWeight: 700,
                  letterSpacing: "1px",
                  height: 72,
                  fontSize: 22,
                  lineHeight: 1.3,
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
                TRANG THAI
              </th>
            </tr>
          </thead>
          <tbody>
            {displayTickets.length > 0 ? (
              displayTickets.map((ticket, index) => {
                const isEvenRow = (index + 1) % 2 === 0;
                const bgColor = isEvenRow ? "#003366" : "white";
                const textColor = isEvenRow ? "white" : "#003366";
                const statusDisplay =
                  ticket.status === "processing"
                    ? "Đang xử lý"
                    : ticket.status === "completed"
                      ? "Hoan thanh"
                      : "Chờ";
                const statusColor =
                  ticket.status === "processing"
                    ? "#51CF66"
                    : ticket.status === "completed"
                      ? "#FF6B6B"
                      : "#FFB84D";

                return (
                  <tr
                    key={ticket.id}
                    style={{
                      background: bgColor,
                      borderBottom: "2px solid #e0e0e0",
                      height: "calc((100vh - 196px) / 5)",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 18px",
                        textAlign: "center",
                        fontWeight: 700,
                        color: textColor,
                        fontSize: 32,
                        borderRight: "1px solid rgba(0, 0, 0, 0.1)",
                        verticalAlign: "middle",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "100%",
                          width: "100%",
                          textAlign: "center",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                          lineHeight: 1.2,
                        }}
                      >
                        {formatServiceName(ticket.serviceName)}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px 18px",
                        textAlign: "center",
                        fontWeight: 700,
                        color: textColor,
                        fontSize: 52,
                        letterSpacing: "2px",
                        borderRight: "1px solid rgba(0, 0, 0, 0.1)",
                        verticalAlign: "middle",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "100%",
                          width: "100%",
                          textAlign: "center",
                          lineHeight: 1,
                        }}
                      >
                        {ticket.formattedNumber}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px 18px",
                        textAlign: "center",
                        fontWeight: 700,
                        color: textColor,
                        fontSize: 32,
                        borderRight: "1px solid rgba(0, 0, 0, 0.1)",
                        overflow: "hidden",
                        verticalAlign: "middle",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "100%",
                          width: "100%",
                          textAlign: "center",
                          whiteSpace: "pre-line",
                          wordBreak: "keep-all",
                          overflowWrap: "break-word",
                          lineHeight: 1.2,
                        }}
                      >
                        {formatDisplayStaffName(ticket.customerName)}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px 18px",
                        textAlign: "center",
                        color: textColor,
                        fontSize: 32,
                        verticalAlign: "middle",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "100%",
                          width: "100%",
                          textAlign: "center",
                        }}
                      >
                        <span
                          style={{
                            color: statusColor,
                            padding: "14px 18px",
                            borderRadius: "25px",
                            fontWeight: 900,
                            display: "inline-block",
                            minWidth: "120px",
                            fontSize: 32,
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                            lineHeight: 1.2,
                          }}
                        >
                          {statusDisplay}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: "40px 24px",
                    textAlign: "center",
                    color: "#999",
                    fontSize: 26,
                  }}
                >
                  Chua co ve nao
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
