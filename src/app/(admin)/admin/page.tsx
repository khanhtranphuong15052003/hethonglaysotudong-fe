"use client";

import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";

// Đăng ký các thành phần của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function TicketDashboard() {
  // Giả lập dữ liệu động
  const [data, setData] = useState({
    ticketsIssued: 1200,
    ticketsServed: 950,
    queues: [
      { name: "Quầy 1", count: 300 },
      { name: "Quầy 2", count: 400 },
      { name: "Quầy 3", count: 500 },
    ],
    serviceTypes: [
      { name: "Dịch vụ A", count: 600 },
      { name: "Dịch vụ B", count: 400 },
      { name: "Dịch vụ C", count: 200 },
    ],
    hourlyTickets: [50, 80, 100, 70, 60, 90, 110, 130, 120, 100, 80, 60],
  });

  // Giả lập cập nhật số liệu theo thời gian
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => ({
        ...prev,
        ticketsIssued: prev.ticketsIssued + Math.round(Math.random() * 10 - 5),
        ticketsServed: prev.ticketsServed + Math.round(Math.random() * 8 - 4),
        hourlyTickets: prev.hourlyTickets.map(
          (v) => v + Math.round(Math.random() * 4 - 2)
        ),
        queues: prev.queues.map((q) => ({
          ...q,
          count: q.count + Math.round(Math.random() * 5 - 2),
        })),
        serviceTypes: prev.serviceTypes.map((s) => ({
          ...s,
          count: s.count + Math.round(Math.random() * 4 - 2),
        })),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Chuẩn bị dữ liệu cho các biểu đồ
  const barData = {
    labels: ["Dịch vụ A", "Dịch vụ B", "Dịch vụ C"],
    datasets: [
      {
        label: "Số lượng",
        data: data.serviceTypes.map((s) => s.count),
        backgroundColor: ["#4bc0c0", "#36a2eb", "#ff6384"],
      },
    ],
  };

  const pieData = {
    labels: data.queues.map((q) => q.name),
    datasets: [
      {
        label: "Số lượng",
        data: data.queues.map((q) => q.count),
        backgroundColor: ["#ff6384", "#36a2eb", "#4bc0c0"],
        hoverOffset: 4,
      },
    ],
  };

  const lineData = {
    labels: [
      "6h",
      "7h",
      "8h",
      "9h",
      "10h",
      "11h",
      "12h",
      "13h",
      "14h",
      "15h",
      "16h",
      "17h",
    ],
    datasets: [
      {
        label: "Vé phát hành",
        data: data.hourlyTickets,
        fill: false,
        borderColor: "#36a2eb",
        tension: 0.4,
      },
    ],
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 40, backgroundColor: "#f0f0f0" }}>
      <h1 style={{ marginBottom: 20, color: "#003366", fontWeight: "bold", fontSize: 28 }}>THỐNG KÊ</h1>

      {/* Thống kê tổng quan */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 20,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 24, color: "#4CAF50" }}>Vé đã phát hành</h2>
          <p style={{ fontSize: 32, margin: 10, fontWeight: "bold" }}>{data.ticketsIssued}</p>
        </div>
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 24, color: "#2196F3" }}>Vé đã phục vụ</h2>
          <p style={{ fontSize: 32, margin: 10, fontWeight: "bold" }}>{data.ticketsServed}</p>
        </div>
      </div>

      {/* Các biểu đồ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}
      >
        {/* Biểu đồ loại vé (Bar Chart) */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ marginBottom: 16, color: "#333" }}>Phân Loại Vé Phát Hành</h3>
          <Bar data={barData} />
        </div>

        {/* Biểu đồ quầy (Pie Chart) */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ marginBottom: 16, color: "#333" }}>Phân Bổ Quầy</h3>
          <Pie data={pieData} />
        </div>

        {/* Biểu đồ số vé theo giờ (Line Chart) */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ marginBottom: 16, color: "#333" }}>Vé Phát Hành Theo Giờ</h3>
          <Line data={lineData} />
        </div>
      </div>
    </div>
  );
}