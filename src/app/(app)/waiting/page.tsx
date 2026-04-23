"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface WaitingTicket {
  _id?: string;
  id?: string;
  number: number;
  ticketNumber?: string;
  formattedNumber?: string;
  displayNumber?: string;
  customerName: string;
  phone?: string;
  status: string;
  serviceName: string;
  createdAt?: string;
}

interface LastIssuedCounter {
  counterId: string;
  counterCode: string;
  counterName: string;
  counterNumber: number;
  lastNumber: number;
  lastDisplayNumber: string | null;
}

function getSocketBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const api = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (api) return api.replace(/\/api$/i, "").replace(/\/$/, "");
  return "";
}

function getDisplayNumber(ticket: WaitingTicket) {
  return (
    ticket.displayNumber ||
    ticket.formattedNumber ||
    String(ticket.number).padStart(3, "0")
  );
}

export default function WaitingPage() {
  const [tickets, setTickets] = useState<WaitingTicket[]>([]);
  const [lastIssuedByCounter, setLastIssuedByCounter] = useState<
    LastIssuedCounter[]
  >([]);
  const [totalWaiting, setTotalWaiting] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchWaitingTickets = async () => {
    const apiBase = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    const res = await fetch(`${apiBase}/tickets/waiting`);
    if (!res.ok) {
      throw new Error("Không thể tải dữ liệu phòng chờ");
    }
    const json = await res.json();
    if (json.success) {
      setTickets(json.data || []);
      setTotalWaiting(json.count ?? (json.data?.length ?? 0));
      setLastIssuedByCounter(
        [...(json.lastIssuedByCounter || [])].sort(
          (a: LastIssuedCounter, b: LastIssuedCounter) =>
            a.counterNumber - b.counterNumber,
        ),
      );
    }
  };

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        await fetchWaitingTickets();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi không xác định");
      } finally {
        setLoading(false);
      }
    };

    void fetchInitial();

    const socket = io(getSocketBaseUrl(), { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-waiting-room");
    });

    socket.on(
      "waiting-room-snapshot",
      (payload: {
        tickets?: WaitingTicket[];
        totalWaiting: number;
        lastIssuedByCounter: LastIssuedCounter[];
      }) => {
        setTickets(payload.tickets || []);
        setTotalWaiting(payload.totalWaiting);
        setLastIssuedByCounter(
          [...(payload.lastIssuedByCounter || [])].sort(
            (a, b) => a.counterNumber - b.counterNumber,
          ),
        );
        setLoading(false);
      },
    );

    socket.on(
      "new-ticket",
      (payload: {
        ticket: WaitingTicket;
        totalWaiting: number;
        lastIssuedByCounter: LastIssuedCounter[];
      }) => {
        setTickets((prev) => [...prev, payload.ticket]);
        setTotalWaiting(payload.totalWaiting);
        setLastIssuedByCounter(
          [...(payload.lastIssuedByCounter || [])].sort(
            (a, b) => a.counterNumber - b.counterNumber,
          ),
        );
      },
    );

    const handleReset = (payload: { lastIssuedByCounter: LastIssuedCounter[] }) => {
      setTickets([]);
      setTotalWaiting(0);
      setLastIssuedByCounter(
        [...(payload.lastIssuedByCounter || [])].sort(
          (a, b) => a.counterNumber - b.counterNumber,
        ),
      );
    };

    socket.on("tickets-reset-day", handleReset);
    socket.on("tickets-reset-all", handleReset);
    socket.on("ticket-back-to-waiting", () => {
      void fetchInitial();
    });

    socket.on("socket-error", (payload: { message: string }) => {
      console.error("Waiting room socket error:", payload.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#666", fontSize: 20 }}>
        Đang tải...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#dc3545", fontSize: 18 }}>
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 20,
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: "clamp(18px, 2vw, 28px)",
          fontWeight: 700,
          color: "#003366",
          textTransform: "uppercase",
          textAlign: "center",
        }}
      >
        Danh sách chờ ({totalWaiting} người)
      </h2>

      {lastIssuedByCounter.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "center",
          }}
        >
          {lastIssuedByCounter.map((c) => (
            <div
              key={c.counterId}
              style={{
                background: "#f0f4ff",
                border: "1px solid #c0d0f0",
                borderRadius: 10,
                padding: "10px 18px",
                textAlign: "center",
                minWidth: 130,
              }}
            >
              <div style={{ fontWeight: 700, color: "#003366", fontSize: 15 }}>
                {c.counterName}
              </div>
              <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                Số cuối đã cấp
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: c.lastDisplayNumber ? "#003366" : "#aaa",
                  marginTop: 2,
                }}
              >
                {c.lastDisplayNumber ?? "---"}
              </div>
            </div>
          ))}
        </div>
      )}

      {tickets.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: "#999",
            fontStyle: "italic",
            fontSize: 20,
            paddingTop: 20,
          }}
        >
          Không có vé đang chờ
        </div>
      ) : (
        <div style={{ overflowY: "auto", flex: 1 }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "clamp(14px, 1.1vw, 18px)",
              background: "#fff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            <thead>
              <tr style={{ background: "#003366", color: "#fff" }}>
                <th style={{ padding: "12px 10px", width: "8%" }}>STT</th>
                <th style={{ padding: "12px 10px", width: "18%" }}>Số phiếu</th>
                <th style={{ padding: "12px 10px", width: "34%" }}>Họ tên</th>
                <th style={{ padding: "12px 10px" }}>Quầy</th>
                <th style={{ padding: "12px 10px", width: "16%" }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket, idx) => (
                <tr
                  key={ticket._id ?? ticket.id ?? idx}
                  style={{
                    borderBottom: "1px solid #e5e5e5",
                    background: idx % 2 === 0 ? "#fff" : "#f8f9fc",
                  }}
                >
                  <td style={{ padding: "10px", textAlign: "center", fontWeight: 600 }}>
                    {idx + 1}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      textAlign: "center",
                      fontWeight: 800,
                      fontSize: "1.15em",
                      color: "#003366",
                    }}
                  >
                    {getDisplayNumber(ticket)}
                  </td>
                  <td style={{ padding: "10px" }}>{ticket.customerName}</td>
                  <td style={{ padding: "10px", fontWeight: 600 }}>{ticket.serviceName}</td>
                  <td style={{ padding: "10px", textAlign: "center" }}>
                    <span
                      style={{
                        background: "#e8f5e9",
                        color: "#2e7d32",
                        borderRadius: 6,
                        padding: "3px 10px",
                        fontSize: "0.9em",
                        fontWeight: 600,
                      }}
                    >
                      Đang chờ
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
