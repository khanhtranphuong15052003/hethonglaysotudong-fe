"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Ticket, Counter, Service } from "@/types/queue";
import Toast from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";
import {
  getStaffDisplay,
  callNextTicket,
  completeTicketApi,
  skipTicketApi,
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

export default function StaffCounterPage() {
  const params = useParams();
  const router = useRouter();
  const counterId = params.counterId as string;

  const [counter, setCounter] = useState<Counter | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staffName, setStaffName] = useState<string>("");
  const [waitingTickets, setWaitingTickets] = useState<Ticket[]>([]);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
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

  const applySnapshot = (snapshot: {
    counter: Counter;
    services: Service[];
    currentTicket: Ticket | null;
    waitingTickets: Ticket[];
    staffName?: string;
  }) => {
    setCounter(snapshot.counter);
    setServices(snapshot.services);
    setCurrentTicket(snapshot.currentTicket);
    setWaitingTickets(snapshot.waitingTickets);
    if (snapshot.staffName) {
      setStaffName(snapshot.staffName);
    }
  };

  const refreshFromApi = async () => {
    try {
      const response = await getStaffDisplay();
      if (response.success) {
        const { counter, services, currentTicket, waitingTickets, staffName } =
          response.data;
        applySnapshot({
          counter,
          services,
          currentTicket,
          waitingTickets,
          staffName,
        });
      }
    } catch (error) {
      console.error("Failed to refresh staff display data:", error);
      showToast("Loi khi tai lai du lieu!", "error");
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
            staffName,
          });
          setAuthenticated(true);
        } else {
          localStorage.removeItem("staffToken");
          router.push("/staff/login?error=session_expired");
        }
      } catch (error) {
        console.error("Failed to fetch staff display data:", error);
        localStorage.removeItem("staffToken");
        router.push("/staff/login?error=fetch_failed");
      } finally {
        setLoading(false);
      }
    };

    void loadInitialData();
  }, [counterId, router]);

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
        });

        if (payload.reason === "ticket-called" && payload.data.currentTicket) {
          void speakTicketCall(
            payload.data.currentTicket.formattedNumber,
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

  const handleCallNext = async () => {
    if (currentTicket) {
      showToast("Dang goi lai!", "info");
      void speakTicketCall(
        currentTicket.formattedNumber,
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
        showToast(response.message || "Khong the goi ve!", "error");
      }
    } catch (error) {
      console.error("Call next error:", error);
      showToast("Loi he thong khi dang goi ve!", "error");
    }
  };

  const handleComplete = async () => {
    if (!currentTicket) {
      showToast("Khong co ve nao dang duoc xu ly!", "error");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Xac nhan hoan thanh",
      message: `Xac nhan hoan thanh ve so ${currentTicket.formattedNumber}?`,
      onConfirm: async () => {
        try {
          const response = await completeTicketApi(currentTicket.id);
          if (response.success) {
            showToast(response.message, "success");
          } else {
            showToast(response.message || "Khong the hoan thanh ve!", "error");
          }
        } catch (error) {
          showToast("Loi he thong khi hoan thanh ve!", "error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleSkip = async () => {
    if (!currentTicket) {
      showToast("Khong co ve nao dang duoc xu ly!", "error");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Xac nhan bo qua",
      message: `Xac nhan bo qua ve so ${currentTicket.formattedNumber}?`,
      onConfirm: async () => {
        try {
          const response = await skipTicketApi(currentTicket.id);
          if (response.success) {
            showToast(response.message, "success");
          } else {
            showToast(response.message || "Khong the bo qua ve!", "error");
          }
        } catch (error) {
          showToast("Loi he thong khi bo qua ve!", "error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleLogout = () => {
    setConfirmModal({
      isOpen: true,
      title: "Xac nhan dang xuat",
      message: "Ban co chac chan muon dang xuat?",
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
        <p>Dang tai...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 1150,
        maxWidth: "100%",
        padding: "0 30px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          fontSize: 14,
        }}
      >
        <div style={{ color: "#666" }}>
          {staffName && `Xin chao: ${staffName}`}
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            fontSize: 14,
            background: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Dang xuat
        </button>
      </div>

      <div style={{ display: "flex", gap: 20, flex: 1 }}>
        <div style={{ flex: 0.6, overflowY: "auto" }}>
          <h3 style={{ marginTop: 0, marginBottom: 15, color: "#003366" }}>
            Danh sach cho ({waitingTickets.length} nguoi)
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#003366",
                  color: "white",
                }}
              >
                <th style={{ padding: "10px", borderRight: "1px solid #ddd", fontSize: 12 }}>STT</th>
                <th style={{ padding: "10px", borderRight: "1px solid #ddd", fontSize: 12 }}>SỐ PHIẾU</th>
                <th style={{ padding: "10px", borderRight: "1px solid #ddd", fontSize: 12 }}>TÊN</th>
                <th style={{ padding: "10px", fontSize: 12 }}>DỊCH VỤ</th>
              </tr>
            </thead>
            <tbody>
              {waitingTickets.slice(0, 10).map((ticket, index) => (
                <tr key={ticket.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                  <td style={{ padding: "10px", borderRight: "1px solid #ddd" }}>{index + 1}</td>
                  <td style={{ padding: "10px", color: "#003366", fontWeight: 600, borderRight: "1px solid #ddd" }}>
                    {ticket.formattedNumber}
                  </td>
                  <td style={{ padding: "10px", borderRight: "1px solid #ddd", fontSize: 13 }}>
                    {ticket.customerName}
                  </td>
                  <td style={{ padding: "10px" }}>{ticket.serviceName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: 0.4, display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              background: "#ffffff",
              border: "2px solid #003366",
              borderRadius: 8,
              padding: 16,
              flex: 0.35,
              marginTop: 40,
            }}
          >
            <h2
              style={{
                margin: "0 0 12px 0",
                color: "#003366",
                fontSize: 30,
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              Vé đang xử lý
            </h2>
            {currentTicket ? (
              <div style={{ fontSize: 20, marginLeft: 32 }}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, color: "#333" }}>Số phiếu: </span>
                  <span style={{ color: "#003366", fontWeight: 600, fontSize: 16 }}>
                    {currentTicket.formattedNumber}
                  </span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, color: "#333" }}>Đương sự: </span>
                  <span style={{ color: "#555" }}>{currentTicket.customerName}</span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, color: "#333" }}>Dịch vụ: </span>
                  <span style={{ color: "#555" }}>{currentTicket.serviceName}</span>
                </div>
              </div>
            ) : (
              <div style={{ color: "#999", fontSize: 13, fontStyle: "italic", textAlign: "center" }}>
                Chờ gọi người tiếp theo
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 0.5 }}>
            <button onClick={handleCallNext} style={{ padding: "12px 16px", fontSize: 15, fontWeight: 600, background: "white", color: "#333", border: "2px solid #003366", borderRadius: 6, cursor: "pointer" }}>
              {currentTicket ? "Goi lai" : "Goi tiep theo"}
            </button>
            <button onClick={handleComplete} disabled={!currentTicket} style={{ padding: "12px 16px", fontSize: 15, fontWeight: 600, background: currentTicket ? "white" : "#f0f0f0", color: currentTicket ? "#333" : "#999", border: `2px solid ${currentTicket ? "#003366" : "#ccc"}`, borderRadius: 6, cursor: currentTicket ? "pointer" : "not-allowed" }}>
              Hoàn thành
            </button>
            <button onClick={handleSkip} disabled={!currentTicket} style={{ padding: "12px 16px", fontSize: 15, fontWeight: 600, background: currentTicket ? "white" : "#f0f0f0", color: currentTicket ? "#333" : "#999", border: `2px solid ${currentTicket ? "#003366" : "#ccc"}`, borderRadius: 6, cursor: currentTicket ? "pointer" : "not-allowed" }}>
              Bỏ qua
            </button>
          </div>
        </div>
      </div>

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
