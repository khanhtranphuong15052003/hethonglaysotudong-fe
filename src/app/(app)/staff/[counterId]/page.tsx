"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Ticket, Counter, Service } from "@/types/queue";
import Toast from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";
import {
  getStaffDisplay,
  callNextTicket,
  completeTicketApi,
  skipTicketApi,
  AUTH_EXPIRED_ERROR,
} from "@/services/ticket.service";
import { speakTicketCall, waitForResponsiveVoice } from "@/lib/voice";
import {
  StaffDisplayUpdatedPayload,
  createStaffSocket,
  joinCounterRoom,
  onJoinedCounterRoom,
  onSocketError,
  onStaffDisplayUpdated,
} from "@/lib/staff-socket";

const getTicketDisplayNumber = (ticket?: Ticket | null) =>
  ticket?.displayNumber || ticket?.formattedNumber || String(ticket?.number ?? "").padStart(3, "0");

export default function StaffCounterPage() {
  const params = useParams();
  const router = useRouter();
  const counterId = params.counterId as string;

  const [counter, setCounter] = useState<Counter | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staffName, setStaffName] = useState<string>("");
  const [waitingTickets, setWaitingTickets] = useState<Ticket[]>([]);
  const [totalWaiting, setTotalWaiting] = useState(0);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [activeServiceTab, setActiveServiceTab] = useState<string>("Tất cả");
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({
    isOpen: false,
    message: "",
    type: "info",
  });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info" = "info",
  ) => {
    setToast({ isOpen: true, message, type });
  };

  const handleSessionExpired = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("staffToken");
      localStorage.removeItem("staffUser");
      localStorage.removeItem("staffName");
    }
    router.push("/staff/login?reason=session_expired");
  }, [router]);

  const applySnapshot = (snapshot: {
    counter: Counter;
    services: Service[];
    currentTicket: Ticket | null;
    waitingTickets: Ticket[];
    totalWaiting?: number;
    staffName?: string;
  }) => {
    setCounter(snapshot.counter);
    setServices(snapshot.services);
    setCurrentTicket(snapshot.currentTicket);
    setWaitingTickets(snapshot.waitingTickets);
    setTotalWaiting(snapshot.totalWaiting ?? snapshot.waitingTickets.length);
    if (snapshot.staffName) {
      setStaffName(snapshot.staffName);
    }
  };

  useEffect(() => {
    waitForResponsiveVoice();
  }, []);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("staffToken") : null;
    if (!token) {
      router.push("/staff/login");
      return;
    }

    const loadInitialData = async () => {
      try {
        setLoading(true);
        const response = await getStaffDisplay();
        if (response.success) {
          const {
            counter,
            services,
            currentTicket,
            waitingTickets,
            totalWaiting,
            staffName,
          } = response.data;

          if (counter.id !== counterId) {
            localStorage.removeItem("staffToken");
            router.push("/staff/login?error=unauthorized");
            return;
          }

          applySnapshot({
            counter,
            services,
            currentTicket,
            waitingTickets,
            totalWaiting,
            staffName,
          });
          setAuthenticated(true);
        } else {
          localStorage.removeItem("staffToken");
          router.push("/staff/login?error=session_expired");
        }
    } catch (error) {
      console.error("Failed to fetch staff display data:", error);
      if (error instanceof Error && error.message === AUTH_EXPIRED_ERROR) {
        handleSessionExpired();
        return;
      }
      localStorage.removeItem("staffToken");
      router.push("/staff/login?error=fetch_failed");
      } finally {
        setLoading(false);
      }
    };

    void loadInitialData();
  }, [counterId, handleSessionExpired, router]);

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    const socket = createStaffSocket();

    const unsubscribe = onStaffDisplayUpdated(
      socket,
      (payload: StaffDisplayUpdatedPayload) => {
        if (payload.counterId !== counterId) {
          return;
        }

        applySnapshot({
          counter: payload.data.counter as Counter,
          services: payload.data.services as Service[],
          currentTicket: payload.data.currentTicket as Ticket | null,
          waitingTickets: payload.data.waitingTickets as Ticket[],
          totalWaiting: payload.data.totalWaiting,
        });
        if (payload.reason === "ticket-called" && payload.data.currentTicket) {
          void speakTicketCall(
            getTicketDisplayNumber(payload.data.currentTicket as Ticket),
            payload.data.currentTicket.customerName,
            payload.data.counter.name,
          );
        }
      },
    );
    const unsubscribeJoined = onJoinedCounterRoom(socket, (payload) => {
      console.log("Joined counter room on staff screen:", payload);
    });
    const unsubscribeSocketError = onSocketError(socket, (payload) => {
      console.error("Staff socket room error:", payload);
    });

    socket.on("connect", () => {
      joinCounterRoom(socket, counterId);
      console.log("Socket connected on staff screen");
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected on staff screen:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection failed on staff screen:", error);
    });

    return () => {
      unsubscribe();
      unsubscribeJoined();
      unsubscribeSocketError();
      socket.disconnect();
    };
  }, [authenticated, counterId]);

  useEffect(() => {
    const serviceTabNames = Array.from(
      new Set(
        [...services.map((service) => service.name), ...waitingTickets.map((ticket) => ticket.serviceName)]
          .map((name) => name?.trim())
          .filter(Boolean),
      ),
    ) as string[];

    if (
      activeServiceTab !== "Tất cả" &&
      !serviceTabNames.includes(activeServiceTab)
    ) {
      setActiveServiceTab("Tất cả");
    }
  }, [activeServiceTab, services, waitingTickets]);

  const handleCallNext = async () => {
    if (currentTicket) {
      showToast("Đang gọi lại!", "info");
      void speakTicketCall(
        getTicketDisplayNumber(currentTicket),
        currentTicket.customerName,
        counter?.name || "",
      );
      return;
    }

    try {
      const response = await callNextTicket(counterId);
      if (response.success) {
        showToast(response.message, "success");
      } else {
        showToast(response.message || "Không thể gọi vé!", "error");
      }
    } catch (error) {
      if (error instanceof Error && error.message === AUTH_EXPIRED_ERROR) {
        handleSessionExpired();
        return;
      }
      console.error("Call next error:", error);
      showToast("Lỗi hệ thống khi đang gọi vé!", "error");
    }
  };

  const handleComplete = async () => {
    if (!currentTicket) {
      showToast("Không có vé nào đang được xử lý!", "error");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Xác nhận hoàn thành",
      message: `Xác nhận hoàn thành vé số ${getTicketDisplayNumber(currentTicket)}?`,
      onConfirm: async () => {
        try {
          const response = await completeTicketApi(currentTicket.id);
          if (response.success) {
            showToast(response.message, "success");
          } else {
            showToast(response.message || "Không thể hoàn thành vé!", "error");
          }
        } catch (error) {
          if (error instanceof Error && error.message === AUTH_EXPIRED_ERROR) {
            handleSessionExpired();
            return;
          }
          showToast("Lỗi hệ thống khi hoàn thành vé!", "error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleSkip = async () => {
    if (!currentTicket) {
      showToast("Không có vé nào đang được xử lý!", "error");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Xác nhận bỏ qua",
      message: `Xác nhận bỏ qua vé số ${getTicketDisplayNumber(currentTicket)}?`,
      onConfirm: async () => {
        try {
          const response = await skipTicketApi(currentTicket.id);
          if (response.success) {
            showToast(response.message, "success");
          } else {
            showToast(response.message || "Không thể bỏ qua vé!", "error");
          }
        } catch (error) {
          if (error instanceof Error && error.message === AUTH_EXPIRED_ERROR) {
            handleSessionExpired();
            return;
          }
          showToast("Lỗi hệ thống khi bỏ qua vé!", "error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleLogout = () => {
    setConfirmModal({
      isOpen: true,
      title: "Xác nhận đăng xuất",
      message: "Bạn có chắc chắn muốn đăng xuất?",
      onConfirm: () => {
        localStorage.removeItem("staffToken");
        localStorage.removeItem("staffName");
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        router.push("/staff/login");
      },
    });
  };

  if (!authenticated || loading) {
    return (
      <div style={{ padding: 20 }}>
        <p>Đang tải...</p>
      </div>
    );
  }

  const serviceTabNames = Array.from(
    new Set(
      [...services.map((service) => service.name), ...waitingTickets.map((ticket) => ticket.serviceName)]
        .map((name) => name?.trim())
        .filter(Boolean),
    ),
  ) as string[];

  const visibleWaitingTickets =
    activeServiceTab === "Tất cả"
      ? waitingTickets
      : waitingTickets.filter(
          (ticket) => ticket.serviceName?.trim() === activeServiceTab,
        );
  const displayedWaitingCount =
    activeServiceTab === "Tất cả"
      ? totalWaiting
      : visibleWaitingTickets.length;

  return (
    <div
      className="staff-page"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "min(1420px, 100%)",
        maxWidth: "100%",
        padding: "0 clamp(16px, 2.4vw, 36px)",
        boxSizing: "border-box",
      }}
    >
      <div
        className="staff-page__topbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "clamp(16px, 2vh, 24px)",
          fontSize: "clamp(14px, 1.2vw, 20px)",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ color: "#666", fontSize: "clamp(14px, 1.1vw, 18px)" }}>
          {staffName && `Xin chào: ${staffName}`}
        </div>
        <button
          onClick={handleLogout}
          className="staff-page__logout"
          style={{
            padding: "clamp(10px, 1vh, 12px) clamp(16px, 1.4vw, 22px)",
            fontSize: "clamp(14px, 1.1vw, 18px)",
            fontWeight: 600,
            background: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Đăng xuất
        </button>
      </div>

      <div
        className="staff-page__content"
        style={{ display: "flex", gap: "clamp(16px, 2vw, 28px)", flex: 1 }}
      >
        <div className="staff-page__queue" style={{ flex: 0.6, overflowY: "auto", minWidth: 0 }}>
          <div
            className="staff-page__tabs"
            style={{
              display: "flex",
              gap: "clamp(8px, 1vw, 12px)",
              flexWrap: "wrap",
              marginBottom: "clamp(12px, 1.6vh, 18px)",
            }}
          >
            <button
              onClick={() => setActiveServiceTab("Tất cả")}
              className="staff-page__tab"
              style={{
                padding: "clamp(8px, 0.9vh, 12px) clamp(14px, 1.4vw, 22px)",
                fontSize: "clamp(14px, 1.2vw, 20px)",
                fontWeight: 700,
                borderRadius: 999,
                border:
                  activeServiceTab === "Tất cả"
                    ? "2px solid #003366"
                    : "1px solid rgba(0, 61, 130, 0.25)",
                background:
                  activeServiceTab === "Tất cả" ? "#003366" : "#ffffff",
                color: activeServiceTab === "Tất cả" ? "#ffffff" : "#003366",
                cursor: "pointer",
                boxShadow:
                  activeServiceTab === "Tất cả"
                    ? "0 8px 18px rgba(0, 61, 130, 0.18)"
                    : "none",
              }}
            >
              Tất cả
            </button>
            {serviceTabNames.map((serviceName) => {
              const isActive = activeServiceTab === serviceName;

              return (
                <button
                  key={serviceName}
                  onClick={() => setActiveServiceTab(serviceName)}
                  className="staff-page__tab"
                  style={{
                    padding: "clamp(8px, 0.9vh, 12px) clamp(14px, 1.4vw, 22px)",
                    fontSize: "clamp(14px, 1.2vw, 20px)",
                    fontWeight: 700,
                    borderRadius: 999,
                    border: isActive
                      ? "2px solid #003366"
                      : "1px solid rgba(0, 61, 130, 0.25)",
                    background: isActive ? "#003366" : "#ffffff",
                    color: isActive ? "#ffffff" : "#003366",
                    cursor: "pointer",
                    boxShadow: isActive
                      ? "0 8px 18px rgba(0, 61, 130, 0.18)"
                      : "none",
                  }}
                >
                  {serviceName}
                </button>
              );
            })}
          </div>

          <h3
            className="staff-page__title"
            style={{
              marginTop: 0,
              marginBottom: "clamp(12px, 1.6vh, 18px)",
              color: "#003366",
              fontSize: "clamp(24px, 2.3vw, 34px)",
              fontWeight: 700,
            }}
          >
            Danh sách chờ
            {activeServiceTab !== "Tất cả" ? ` - Tab ${activeServiceTab}` : ""}
            {` (${displayedWaitingCount} người)`}
          </h3>
          <table
            className="staff-page__table"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "#ffffff",
              boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
              fontSize: "clamp(14px, 1.1vw, 20px)",
              textAlign: "center",
              tableLayout: "fixed",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#003366",
                  color: "white",
                }}
              >
                <th style={{ width: "10%", padding: "clamp(8px, 1vh, 12px) 10px", borderRight: "1px solid #ddd", fontSize: "clamp(12px, 0.9vw, 16px)" }}>STT</th>
                <th style={{ width: "20%", padding: "clamp(8px, 1vh, 12px) 10px", borderRight: "1px solid #ddd", fontSize: "clamp(12px, 0.9vw, 16px)" }}>SỐ PHIẾU</th>
                <th style={{ width: "42%", padding: "clamp(8px, 1vh, 12px) 10px", borderRight: "1px solid #ddd", fontSize: "clamp(12px, 0.9vw, 16px)" }}>TÊN</th>
                <th style={{ width: "28%", padding: "clamp(8px, 1vh, 12px) 10px", fontSize: "clamp(12px, 0.9vw, 16px)" }}>DỊCH VỤ</th>
              </tr>
            </thead>
            <tbody>
              {visibleWaitingTickets.slice(0, 10).length > 0 ? (
                visibleWaitingTickets.slice(0, 10).map((ticket, index) => (
                  <tr key={ticket.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <td style={{ padding: "clamp(8px, 0.95vh, 12px) 10px", borderRight: "1px solid #ddd", fontSize: "clamp(14px, 1vw, 18px)" }}>
                      {index + 1}
                    </td>
                    <td style={{ padding: "clamp(8px, 0.95vh, 12px) 10px", color: "#003366", fontWeight: 700, fontSize: "clamp(16px, 1.25vw, 20px)", borderRight: "1px solid #ddd" }}>
                      {getTicketDisplayNumber(ticket)}
                    </td>
                    <td
                      style={{
                        padding: "clamp(8px, 0.95vh, 12px) 10px",
                        borderRight: "1px solid #ddd",
                        fontSize: "clamp(14px, 1vw, 17px)",
                        lineHeight: 1.2,
                        wordBreak: "break-word",
                      }}
                    >
                      {ticket.customerName}
                    </td>
                    <td
                      style={{
                        padding: "clamp(8px, 0.95vh, 12px) 10px",
                        fontSize: "clamp(14px, 1vw, 17px)",
                        fontWeight: 600,
                        lineHeight: 1.2,
                        wordBreak: "break-word",
                      }}
                    >
                      {ticket.serviceName}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "24px 16px",
                      color: "#6b7280",
                      fontStyle: "italic",
                      fontSize: 22,
                    }}
                  >
                    Không có vé chờ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div
          className="staff-page__actions"
          style={{ flex: 0.4, display: "flex", flexDirection: "column", gap: "clamp(16px, 1.8vh, 24px)", minWidth: 0 }}
        >
          <div
            className="staff-page__current-ticket"
            style={{
              background: "#ffffff",
              border: "2px solid #003366",
              borderRadius: 12,
              padding: "clamp(16px, 1.8vw, 24px)",
              flex: 0.35,
              marginTop: "clamp(24px, 4vh, 52px)",
              boxShadow: "0 10px 24px rgba(0, 61, 130, 0.08)",
            }}
          >
            <h2
              style={{
                margin: "0 0 20px 0",
                color: "#003366",
                fontSize: "clamp(32px, 3vw, 48px)",
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              Vé đang xử lý
            </h2>
            {currentTicket ? (
              <div style={{ fontSize: "clamp(18px, 1.8vw, 30px)", marginLeft: 16, lineHeight: 1.45 }}>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, color: "#333" }}>Số phiếu: </span>
                  <span style={{ color: "#003366", fontWeight: 700, fontSize: "clamp(22px, 2vw, 34px)" }}>
                    {getTicketDisplayNumber(currentTicket)}
                  </span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, color: "#333" }}>Đương sự: </span>
                  <span style={{ color: "#555" }}>{currentTicket.customerName}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, color: "#333" }}>Dịch vụ: </span>
                  <span style={{ color: "#555" }}>{currentTicket.serviceName}</span>
                </div>
              </div>
            ) : (
              <div style={{ color: "#999", fontSize: "clamp(15px, 1.2vw, 22px)", fontStyle: "italic", textAlign: "center" }}>
                Chờ gọi người tiếp theo
              </div>
            )}
          </div>

          <div className="staff-page__button-group" style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 1.2vh, 14px)", flex: 0.5 }}>
            <button onClick={handleCallNext} style={{ padding: "clamp(12px, 1.5vh, 18px) 20px", fontSize: "clamp(18px, 1.8vw, 28px)", fontWeight: 700, background: "white", color: "#333", border: "2px solid #003366", borderRadius: 10, cursor: "pointer" }}>
              {currentTicket ? "Gọi lại" : "Gọi tiếp theo"}
            </button>
            <button onClick={handleComplete} disabled={!currentTicket} style={{ padding: "clamp(12px, 1.5vh, 18px) 20px", fontSize: "clamp(18px, 1.8vw, 28px)", fontWeight: 700, background: currentTicket ? "white" : "#f0f0f0", color: currentTicket ? "#333" : "#999", border: `2px solid ${currentTicket ? "#003366" : "#ccc"}`, borderRadius: 10, cursor: currentTicket ? "pointer" : "not-allowed" }}>
              Hoàn thành
            </button>
            <button onClick={handleSkip} disabled={!currentTicket} style={{ padding: "clamp(12px, 1.5vh, 18px) 20px", fontSize: "clamp(18px, 1.8vw, 28px)", fontWeight: 700, background: currentTicket ? "white" : "#f0f0f0", color: currentTicket ? "#333" : "#999", border: `2px solid ${currentTicket ? "#003366" : "#ccc"}`, borderRadius: 10, cursor: currentTicket ? "pointer" : "not-allowed" }}>
              Bỏ qua
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1600px) and (max-height: 900px) {
          .staff-page {
            width: min(1280px, 100%) !important;
            padding: 0 20px !important;
          }

          .staff-page__topbar {
            margin-bottom: 14px !important;
          }

          .staff-page__content {
            gap: 16px !important;
          }

          .staff-page__queue {
            flex: 0.62 !important;
          }

          .staff-page__actions {
            flex: 0.38 !important;
            gap: 14px !important;
          }

          .staff-page__tabs {
            margin-bottom: 12px !important;
            gap: 8px !important;
          }

          .staff-page__tab {
            padding: 8px 16px !important;
            font-size: 15px !important;
          }

          .staff-page__title {
            margin-bottom: 12px !important;
            font-size: 24px !important;
            line-height: 1.15 !important;
          }

          .staff-page__table {
            font-size: 15px !important;
          }

          .staff-page__table th {
            padding: 8px 8px !important;
            font-size: 12px !important;
          }

          .staff-page__table td {
            padding: 9px 8px !important;
          }

          .staff-page__current-ticket {
            margin-top: 12px !important;
            padding: 16px !important;
          }

          .staff-page__button-group {
            gap: 10px !important;
          }

          .staff-page__button-group button {
            padding: 12px 16px !important;
            font-size: 20px !important;
          }
        }

        @media (max-width: 1366px) {
          .staff-page__content {
            gap: 16px !important;
          }

          .staff-page__queue {
            flex: 0.58 !important;
          }

          .staff-page__actions {
            flex: 0.42 !important;
          }

          .staff-page__current-ticket {
            margin-top: 24px !important;
          }
        }

        @media (max-width: 1366px) and (max-height: 800px) {
          .staff-page {
            padding: 0 16px !important;
          }

          .staff-page__topbar {
            margin-bottom: 10px !important;
          }

          .staff-page__queue {
            flex: 0.64 !important;
          }

          .staff-page__actions {
            flex: 0.36 !important;
            gap: 12px !important;
          }

          .staff-page__title {
            font-size: 22px !important;
          }

          .staff-page__table th {
            font-size: 11px !important;
            padding: 7px 6px !important;
          }

          .staff-page__table td {
            padding: 8px 6px !important;
            font-size: 14px !important;
          }

          .staff-page__current-ticket h2 {
            font-size: 30px !important;
            margin-bottom: 14px !important;
          }

          .staff-page__current-ticket > div {
            font-size: 18px !important;
            margin-left: 4px !important;
            line-height: 1.35 !important;
          }

          .staff-page__current-ticket > div span {
            word-break: break-word;
          }

          .staff-page__button-group button {
            font-size: 18px !important;
            padding: 11px 14px !important;
          }
        }

        @media (max-width: 1180px) {
          .staff-page__content {
            flex-direction: column !important;
          }

          .staff-page__queue,
          .staff-page__actions {
            flex: 1 1 auto !important;
            width: 100% !important;
          }

          .staff-page__current-ticket {
            margin-top: 0 !important;
          }
        }

        @media (max-width: 768px) {
          .staff-page__topbar {
            align-items: stretch !important;
          }

          .staff-page__logout,
          .staff-page__tab {
            width: 100%;
            justify-content: center;
          }

          .staff-page__button-group button {
            width: 100%;
          }
        }
      `}</style>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
        duration={3000}
      />
    </div>
  );
}

