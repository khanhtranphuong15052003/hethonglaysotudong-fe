"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCounters } from "@/mock/counters";
import type { Counter } from "@/types/queue";

export default function DisplayPage() {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCounters = async () => {
      const data = await getCounters();
      setCounters(data);
      setLoading(false);
    };
    loadCounters();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "60px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "60px",
          backgroundColor: "#003d82",
          color: "white",
          padding: "40px",
          borderRadius: "8px",
        }}
      >
        <h1
          style={{ margin: "0 0 10px 0", fontSize: "48px", fontWeight: "bold" }}
        >
          CHỌN CỬA (BỘ PHẬN)
        </h1>
        <p style={{ margin: 0, fontSize: "24px", opacity: 0.9 }}>
          TÒA ÁN NHÂN DÂN KHU VỰC 1
        </p>
      </div>

      {/* List counters */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "30px",
        }}
      >
        {counters.map((counter) => (
          <Link
            href={`/public/display/counter/${counter.counterId}`}
            key={counter.counterId}
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "40px",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                border: "2px solid transparent",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 8px 20px rgba(0,0,0,0.2)";
                (e.currentTarget as HTMLElement).style.borderColor = "#003d82";
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(-5px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 4px 12px rgba(0,0,0,0.1)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "transparent";
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(0)";
              }}
            >
              <h2
                style={{
                  margin: "0 0 15px 0",
                  fontSize: "36px",
                  fontWeight: "bold",
                  color: "#003d82",
                }}
              >
                {counter.name}
              </h2>
              <p
                style={{
                  margin: "0 0 20px 0",
                  fontSize: "16px",
                  color: "#666",
                  minHeight: "48px",
                }}
              >
                {counter.serviceName}
              </p>
              <div
                style={{
                  display: "inline-block",
                  backgroundColor: "#003d82",
                  color: "white",
                  padding: "12px 24px",
                  borderRadius: "4px",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                Xem danh sách chờ →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
