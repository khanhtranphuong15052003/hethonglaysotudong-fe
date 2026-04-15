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

const TOP_HEADER_HEIGHT = "clamp(88px, 9vh, 118px)";
const TITLE_HEADER_HEIGHT = "clamp(84px, 9vh, 122px)";
const TABLE_HEADER_HEIGHT = "clamp(76px, 7vh, 102px)";

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
      throw new Error(`Không tìm thấy quầy số ${normalizedIdentifier}`);
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
        err instanceof Error ? err.message : "Lỗi hiển thị không xác định";
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
          const textToSpeak = `Mời số ${payload.data.currentTicket.formattedNumber} đến ${payload.data.counter.name}`;
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
        Đang tải...
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
        {error || "Không có dữ liệu"}
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
        background:
          "linear-gradient(180deg, #fdfcf9 0%, #f8f6f1 32%, #f3f3f3 100%)",
        padding: 0,
        margin: 0,
        overflow: "hidden",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: "#003366",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,249,240,0.98) 100%)",
          padding: "clamp(8px, 1.2vw, 14px) clamp(18px, 2.4vw, 34px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "3px solid #003366",
          minHeight: TOP_HEADER_HEIGHT,
          flexShrink: 0,
          gap: "clamp(8px, 1vw, 14px)",
        }}
      >
        <img
          src="/assets/logotoaan.png"
          alt="Logo"
          style={{
            height: "clamp(52px, 6vw, 78px)",
            width: "auto",
            flexShrink: 0,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            textAlign: "left",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(20px, 2.7vw, 34px)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "0.2px",
              textTransform: "uppercase",
              color: "#111111",
            }}
          >
            TÒA ÁN NHÂN DÂN KHU VỰC 1
          </h1>
          <div
            style={{
              marginTop: "clamp(2px, 0.4vh, 6px)",
              fontSize: "clamp(14px, 1.7vw, 22px)",
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: "0px",
              color: "#6c6c6c",
            }}
          >
            Thành Phố Hồ Chí Minh
          </div>
        </div>
      </div>

      <div
        style={{
          background: "white",
          padding: "clamp(6px, 0.8vh, 12px) clamp(16px, 2vw, 28px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "3px solid #003366",
          minHeight: TITLE_HEADER_HEIGHT,
          flexShrink: 0,
          flexDirection: "column",
          gap: "clamp(4px, 0.6vh, 8px)",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "clamp(24px, 3.2vw, 42px)",
            fontWeight: 800,
            color: "#003366",
            letterSpacing: "0.4px",
            lineHeight: 1.02,
            textTransform: "uppercase",
          }}
        >
          Danh Sách Chờ Xử Lý
        </h2>

        <div
          style={{
            fontSize: "clamp(24px, 2.8vw, 38px)",
            fontWeight: 800,
            color: "#003366",
            letterSpacing: "0.3px",
            textTransform: "uppercase",
            lineHeight: 1.1,
            background: "linear-gradient(180deg, #ffd86d 0%, #ffc233 100%)",
            borderRadius: 999,
            padding: "clamp(6px, 0.7vh, 10px) clamp(18px, 1.8vw, 28px)",
            boxShadow: "0 6px 16px rgba(0, 0, 0, 0.12)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "fit-content",
            minWidth: 0,
            maxWidth: "90vw",
            whiteSpace: "nowrap",
          }}
        >
          {data.counter.name}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "hidden" }}>
        <table
          style={{
            width: "100%",
            height: "100%",
            borderCollapse: "collapse",
            background: "white",
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col style={{ width: "26%" }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "27%" }} />
            <col style={{ width: "22%" }} />
          </colgroup>

          <thead>
            <tr style={{ background: "#003366", color: "white" }}>
              <th
                style={{
                  padding: "clamp(12px, 1.2vh, 18px) clamp(10px, 1.2vw, 18px)",
                  textAlign: "center",
                  fontWeight: 800,
                  fontSize: "clamp(24px, 2.8vw, 38px)",
                  letterSpacing: "0.5px",
                  borderRight: "2px solid rgba(255, 255, 255, 0.28)",
                  height: TABLE_HEADER_HEIGHT,
                  lineHeight: 1.12,
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  textTransform: "uppercase",
                }}
              >
                Dịch Vụ
              </th>
              <th
                style={{
                  padding: "clamp(12px, 1.2vh, 18px) clamp(10px, 1.2vw, 18px)",
                  textAlign: "center",
                  fontWeight: 800,
                  fontSize: "clamp(24px, 2.8vw, 38px)",
                  letterSpacing: "0.5px",
                  borderRight: "2px solid rgba(255, 255, 255, 0.28)",
                  height: TABLE_HEADER_HEIGHT,
                  lineHeight: 1.12,
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  textTransform: "uppercase",
                }}
              >
                Số Phiếu
              </th>
              <th
                style={{
                  padding: "clamp(12px, 1.2vh, 18px) clamp(10px, 1.2vw, 18px)",
                  textAlign: "center",
                  fontWeight: 800,
                  fontSize: "clamp(24px, 2.8vw, 38px)",
                  letterSpacing: "0.5px",
                  borderRight: "2px solid rgba(255, 255, 255, 0.28)",
                  height: TABLE_HEADER_HEIGHT,
                  lineHeight: 1.12,
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  textTransform: "uppercase",
                }}
              >
                Đương Sự
              </th>
              <th
                style={{
                  padding: "clamp(12px, 1.2vh, 18px) clamp(10px, 1.2vw, 18px)",
                  textAlign: "center",
                  fontWeight: 800,
                  fontSize: "clamp(22px, 2.5vw, 34px)",
                  letterSpacing: "0.5px",
                  height: TABLE_HEADER_HEIGHT,
                  lineHeight: 1.12,
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  textTransform: "uppercase",
                }}
              >
                Trạng Thái
              </th>
            </tr>
          </thead>

          <tbody>
            {displayTickets.length > 0 ? (
              displayTickets.map((ticket, index) => {
                const isEvenRow = (index + 1) % 2 === 0;
                const bgColor = isEvenRow ? "#0a3d78" : "#ffffff";
                const textColor = isEvenRow ? "#ffffff" : "#003366";
                const statusDisplay =
                  ticket.status === "processing"
                    ? "Đang xử lý"
                    : ticket.status === "completed"
                      ? "Hoàn thành"
                      : "Chờ";
                const statusColor =
                  ticket.status === "processing"
                    ? "#4dd06d"
                    : ticket.status === "completed"
                      ? "#ff6b6b"
                      : "#ffb347";

                return (
                  <tr
                    key={ticket.id}
                    style={{
                      background: bgColor,
                      borderBottom:
                        index === displayTickets.length - 1
                          ? "none"
                          : "2px solid #d8e0ea",
                      height: `calc((100vh - ${TOP_HEADER_HEIGHT} - ${TITLE_HEADER_HEIGHT} - ${TABLE_HEADER_HEIGHT} - 8px) / 5)`,
                    }}
                  >
                    <td
                      style={{
                        padding: "clamp(10px, 1vh, 16px) clamp(8px, 1vw, 16px)",
                        textAlign: "center",
                        fontWeight: 800,
                        color: textColor,
                        fontSize: "clamp(28px, 3vw, 42px)",
                        borderRight: "1px solid rgba(0, 0, 0, 0.12)",
                        verticalAlign: "middle",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "100%",
                          height: "100%",
                          textAlign: "center",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                          lineHeight: 1.15,
                        }}
                      >
                        {formatServiceName(ticket.serviceName)}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: "clamp(10px, 1vh, 16px) clamp(8px, 1vw, 16px)",
                        textAlign: "center",
                        fontWeight: 800,
                        color: textColor,
                        fontSize: "clamp(50px, 5.4vw, 78px)",
                        letterSpacing: "1px",
                        borderRight: "1px solid rgba(0, 0, 0, 0.12)",
                        verticalAlign: "middle",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "100%",
                          height: "100%",
                          lineHeight: 1,
                        }}
                      >
                        {ticket.formattedNumber}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: "clamp(10px, 1vh, 16px) clamp(8px, 1vw, 16px)",
                        textAlign: "center",
                        fontWeight: 800,
                        color: textColor,
                        fontSize: "clamp(28px, 3vw, 42px)",
                        borderRight: "1px solid rgba(0, 0, 0, 0.12)",
                        overflow: "hidden",
                        verticalAlign: "middle",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "100%",
                          height: "100%",
                          textAlign: "center",
                          whiteSpace: "pre-line",
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                          lineHeight: 1.15,
                        }}
                      >
                        {formatDisplayStaffName(ticket.customerName)}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: "clamp(10px, 1vh, 16px) clamp(8px, 1vw, 16px)",
                        textAlign: "center",
                        color: textColor,
                        fontSize: "clamp(26px, 2.8vw, 40px)",
                        verticalAlign: "middle",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "100%",
                          height: "100%",
                          textAlign: "center",
                        }}
                      >
                        <span
                          style={{
                            color: statusColor,
                            padding:
                              "clamp(10px, 1vh, 14px) clamp(12px, 1.2vw, 18px)",
                            borderRadius: 999,
                            fontWeight: 900,
                            display: "inline-block",
                            minWidth: "min(18vw, 180px)",
                            fontSize: "clamp(28px, 2.8vw, 40px)",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                            lineHeight: 1.1,
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
                  Chưa có vé nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
