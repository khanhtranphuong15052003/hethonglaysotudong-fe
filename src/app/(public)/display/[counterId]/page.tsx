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
  displayNumber?: string;
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

const VIEWPORT_HEIGHT = "100dvh";
const TOP_HEADER_HEIGHT = "clamp(84px, 8.4dvh, 126px)";
const INFO_BAR_HEIGHT = "clamp(42px, 4.4dvh, 68px)";
const TABLE_HEADER_HEIGHT = "clamp(54px, 5.2dvh, 76px)";
const TABLE_SAFE_SPACE = "clamp(12px, 1.4dvh, 24px)";
const TABLE_ROW_HEIGHT = `calc((${VIEWPORT_HEIGHT} - ${TOP_HEADER_HEIGHT} - ${INFO_BAR_HEIGHT} - ${TABLE_HEADER_HEIGHT} - ${TABLE_SAFE_SPACE}) / 5)`;
const getTicketDisplayNumber = (ticket?: Ticket | null) =>
  ticket?.displayNumber || ticket?.formattedNumber || String(ticket?.number ?? "").padStart(3, "0");

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
          const textToSpeak = `Mời số ${getTicketDisplayNumber(payload.data.currentTicket as Ticket)} đến ${payload.data.counter.name}`;
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
          height: VIEWPORT_HEIGHT,
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
          height: VIEWPORT_HEIGHT,
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
        height: VIEWPORT_HEIGHT,
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
          padding: "clamp(8px, 1vh, 14px) clamp(18px, 2.4vw, 34px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "3px solid #003366",
          minHeight: TOP_HEADER_HEIGHT,
          flexShrink: 0,
          gap: "clamp(8px, 1vw, 14px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "clamp(8px, 1vw, 14px)",
            minWidth: 0,
            flex: "1 1 auto",
          }}
        >
          <img
            src="/assets/logotoaan.png"
            alt="Logo"
            style={{
              height: "clamp(46px, 5vw, 68px)",
              maxHeight: "clamp(40px, 4.5vw, 60px)",
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
              minWidth: 0,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(18px, 2.4vw, 30px)",
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
                marginTop: "clamp(1px, 0.25vh, 4px)",
                fontSize: "clamp(13px, 1.3vw, 18px)",
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
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "center",
            textAlign: "right",
            gap: "clamp(4px, 0.6vh, 8px)",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "clamp(18px, 2.2vw, 32px)",
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
              fontSize: "clamp(18px, 2vw, 28px)",
              fontWeight: 800,
              color: "#003366",
              letterSpacing: "0.3px",
              textTransform: "uppercase",
              lineHeight: 1.1,
              background: "linear-gradient(180deg, #ffd86d 0%, #ffc233 100%)",
              borderRadius: 999,
              padding: "clamp(4px, 0.4vh, 7px) clamp(18px, 1.8vw, 28px)",
              boxShadow: "0 6px 16px rgba(0, 0, 0, 0.12)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "fit-content",
              minWidth: 0,
              maxWidth: "42vw",
              whiteSpace: "nowrap",
            }}
          >
            {data.counter.name}
          </div>
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
            <col style={{ width: "28%" }} />
            <col style={{ width: "50%" }} />
            <col style={{ width: "22%" }} />
          </colgroup>

          <thead>
            <tr style={{ background: "#003366", color: "white" }}>
              <th
                style={{
                  padding: "clamp(10px, 1vh, 14px) clamp(10px, 1.2vw, 18px)",
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
                  padding: "clamp(10px, 1vh, 14px) clamp(10px, 1.2vw, 18px)",
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
                Thông Tin
              </th>
              <th
                style={{
                  padding: "clamp(10px, 1vh, 14px) clamp(10px, 1.2vw, 18px)",
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
                const isProcessing = ticket.status === "processing";
                const bgColor = isEvenRow ? "#0a3d78" : "#ffffff";
                const textColor = isEvenRow ? "#ffffff" : "#003366";
                const statusDisplay =
                  isProcessing
                    ? "Đang xử lý"
                    : ticket.status === "completed"
                      ? "Hoàn thành"
                      : "Chờ";
                const statusColor =
                  isProcessing
                    ? "#4dd06d"
                    : ticket.status === "completed"
                      ? "#ff6b6b"
                      : "#ffb347";

                return (
                  <tr
                    key={ticket.id}
                    style={{
                      background: isProcessing
                        ? isEvenRow
                          ? "linear-gradient(180deg, #164b87 0%, #0a3d78 100%)"
                          : "linear-gradient(180deg, #ffffff 0%, #f3fbf5 100%)"
                        : bgColor,
                      borderBottom:
                        index === displayTickets.length - 1
                          ? "none"
                          : "2px solid #d8e0ea",
                      height: TABLE_ROW_HEIGHT,
                      maxHeight: TABLE_ROW_HEIGHT,
                      boxShadow: isProcessing
                        ? "inset 0 0 0 3px rgba(77, 208, 109, 0.85)"
                        : "none",
                      animation: isProcessing
                        ? "processingRowPulse 1.8s ease-in-out infinite"
                        : "none",
                    }}
                  >
                    <td
                      style={{
                        padding: "clamp(8px, 0.8vh, 12px) clamp(8px, 1vw, 16px)",
                        textAlign: "center",
                        fontWeight: 800,
                        color: textColor,
                        fontSize: "clamp(24px, 2.5vw, 38px)",
                        borderRight: "1px solid rgba(0, 0, 0, 0.12)",
                        verticalAlign: "middle",
                        overflow: "hidden",
                        height: TABLE_ROW_HEIGHT,
                        maxHeight: TABLE_ROW_HEIGHT,
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
                          maxHeight: "100%",
                          overflow: "hidden",
                        }}
                      >
                        {formatServiceName(ticket.serviceName)}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: "clamp(8px, 0.8vh, 12px) clamp(8px, 1vw, 16px)",
                        textAlign: "center",
                        color: textColor,
                        fontSize: "clamp(22px, 2.2vw, 34px)",
                        borderRight: "1px solid rgba(0, 0, 0, 0.12)",
                        verticalAlign: "middle",
                        overflow: "hidden",
                        height: TABLE_ROW_HEIGHT,
                        maxHeight: TABLE_ROW_HEIGHT,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "100%",
                          height: "100%",
                          gap: "clamp(4px, 0.5vh, 8px)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "clamp(42px, 4.6vw, 72px)",
                            fontWeight: 800,
                            letterSpacing: "1px",
                            lineHeight: 0.96,
                            color: textColor,
                          }}
                        >
                          {getTicketDisplayNumber(ticket)}
                        </div>
                        <div
                          style={{
                            fontSize: "clamp(18px, 1.9vw, 30px)",
                            fontWeight: 700,
                            lineHeight: 1.05,
                            maxWidth: "100%",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {formatDisplayStaffName(ticket.customerName)}
                        </div>
                      </div>
                    </td>

                    <td
                      style={{
                        padding: "clamp(8px, 0.8vh, 12px) clamp(8px, 1vw, 16px)",
                        textAlign: "center",
                        color: textColor,
                        fontSize: "clamp(22px, 2.2vw, 34px)",
                        verticalAlign: "middle",
                        overflow: "hidden",
                        height: TABLE_ROW_HEIGHT,
                        maxHeight: TABLE_ROW_HEIGHT,
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
                              "clamp(4px, 0.45vh, 8px) clamp(8px, 0.9vw, 12px)",
                            borderRadius: 999,
                            fontWeight: 900,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: 0,
                            maxWidth: "100%",
                            fontSize: "clamp(21px, 2vw, 31px)",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                            lineHeight: 1.02,
                            textAlign: "center",
                            background: isProcessing
                              ? "rgba(77, 208, 109, 0.14)"
                              : "transparent",
                            boxShadow: isProcessing
                              ? "0 0 18px rgba(77, 208, 109, 0.18)"
                              : "none",
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
                  colSpan={3}
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

      <div
        style={{
          background: "linear-gradient(180deg, #e6eef9 0%, #d8e7fb 100%)",
          padding: "clamp(6px, 0.8vh, 10px) clamp(16px, 2vw, 28px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderTop: "3px solid #003366",
          minHeight: INFO_BAR_HEIGHT,
          flexShrink: 0,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "clamp(18px, 2vw, 28px)",
            fontWeight: 800,
            color: "#003366",
            letterSpacing: "0.3px",
            textTransform: "uppercase",
            lineHeight: 1.1,
          }}
        >
          Còn 500 vé chờ xử lý
        </div>
      </div>

      <style>{`
        @keyframes processingRowPulse {
          0%, 100% {
            box-shadow: inset 0 0 0 3px rgba(77, 208, 109, 0.78);
          }
          50% {
            box-shadow: inset 0 0 0 5px rgba(77, 208, 109, 1);
          }
        }
      `}</style>
    </div>
  );
}
