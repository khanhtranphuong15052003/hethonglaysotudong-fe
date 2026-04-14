"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Ticket } from "@/types/queue";
import { getWaitingListByService, getNowCalling } from "@/mock/queue";
import { getServices } from "@/mock/services";

export default function PublicDisplayPage() {
  const params = useParams();
  const serviceId = params.serviceId as string;

  const [waitingList, setWaitingList] = useState<Ticket[]>([]);
  const [nowCalling, setNowCalling] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // Lấy thông tin dịch vụ
      const services = await getServices();
      const service = services.find((s) => s._id === serviceId);
      // Service found, proceed with rest of logic

      // Lấy danh sách chờ của dịch vụ
      const waiting = getWaitingListByService(serviceId);
      setWaitingList(waiting);

      // Lấy số đang gọi
      const calling = getNowCalling();
      if (calling && calling.serviceId === serviceId) {
        setNowCalling(calling);
      }

      setLoading(false);
    };

    loadData();

    // Refresh dữ liệu mỗi 2 giây
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, [serviceId]);

  if (loading) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ fontSize: 20 }}>Đang tải...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 20,
        height: "calc(100vh - 150px)",
        padding: 20,
      }}
    >
      {/* LEFT: Người đang phục vụ */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9f9f9",
          borderRadius: 8,
        }}
      >
        <h2 style={{ color: "#003366", marginBottom: 20 }}>Đang phục vụ</h2>
        {nowCalling ? (
          <div
            style={{
              background: "white",
              border: "5px solid #003366",
              borderRadius: 12,
              padding: 60,
              textAlign: "center",
              width: "90%",
            }}
          >
            <div style={{ fontSize: 16, color: "#666", marginBottom: 20 }}>
              Số thứ tự
            </div>
            <div
              style={{ fontSize: 120, fontWeight: "bold", color: "#003366" }}
            >
              {nowCalling.number}
            </div>
            <div style={{ fontSize: 28, marginTop: 30, color: "#333" }}>
              {nowCalling.name}
            </div>
            <div
              style={{
                fontSize: 16,
                color: "#666",
                marginTop: 15,
              }}
            >
              {nowCalling.service}
            </div>
          </div>
        ) : (
          <div
            style={{
              background: "#e8f4f8",
              border: "3px dashed #003366",
              borderRadius: 12,
              padding: 60,
              textAlign: "center",
              width: "90%",
            }}
          >
            <div style={{ fontSize: 28, color: "#003366" }}>
              Chưa gọi số nào
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Danh sách chờ */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          background: "#f9f9f9",
          borderRadius: 8,
          padding: 20,
          overflowY: "auto",
        }}
      >
        <h2 style={{ color: "#003366", marginBottom: 20 }}>
          Danh sách chờ ({waitingList.length})
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 15,
          }}
        >
          {waitingList.slice(0, 6).map((ticket) => (
            <div
              key={ticket.id}
              style={{
                padding: 20,
                background: "white",
                border: "2px solid #ddd",
                borderRadius: 8,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  fontWeight: "bold",
                  color: "#003366",
                  marginBottom: 10,
                }}
              >
                {ticket.number}
              </div>
              <div style={{ fontSize: 14, color: "#333" }}>{ticket.name}</div>
            </div>
          ))}
        </div>
        {waitingList.length === 0 && (
          <div
            style={{
              textAlign: "center",
              fontSize: 16,
              color: "#666",
              marginTop: 40,
            }}
          >
            Không có khách chờ
          </div>
        )}
      </div>
    </div>
  );
}
