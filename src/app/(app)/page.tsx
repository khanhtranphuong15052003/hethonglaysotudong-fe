"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import * as RiIcons from "react-icons/ri";

interface Service {
  _id: string;
  code: string;
  name: string;
  icon: string;
  description: string;
  displayOrder: number;
  id: string;
  counters: Array<{
    _id: string;
    code: string;
    name: string;
    number: number;
  }>;
}

export default function HomePage() {
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await fetch("/api/services/active");
        if (!response.ok) {
          throw new Error("Failed to fetch services");
        }
        const data = await response.json();
        // Sort by displayOrder
        const sorted = data.data.sort(
          (a: Service, b: Service) => a.displayOrder - b.displayOrder,
        );
        setServicesList(sorted);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, []);

  const renderIcon = (iconName: string, color: string) => {
    if (iconName.startsWith("Ri")) {
      const IconComponent = (RiIcons as any)[iconName];
      if (IconComponent) {
        return <IconComponent size="clamp(34px, 5vh, 62px)" color={color} />;
      }
    }
    
    // Fallback cho Font Awesome nếu icon không bắt đầu bằng Ri
    const faClass = iconName.startsWith("fa-") ? `fas ${iconName}` : `fas ${iconName}`;
    return <i className={faClass}></i>;
  };

  const getCardBackground = (
    serviceName: string,
  ): { background: string; hoverBackground: string; color: string } => {
    const normalized = serviceName.trim().toLowerCase();

    if (normalized.includes("nhận đơn")) {
      return { background: "#F05769", hoverBackground: "#E84655", color: "#ffffff" };
    }

    if (
      normalized.includes("trả kết quả") ||
      normalized.includes("trả kết quả")
    ) {
      return { background: "#41B660", hoverBackground: "#36944E", color: "#ffffff" };
    }

    if (normalized.includes("sao y")) {
      return { background: "#0b6d7f", hoverBackground: "#084f5a", color: "#ffffff" };
    }

    return { background: "#8383c1", hoverBackground: "#6B6BA5", color: "#ffffff" };
  };

  if (error) {
    return (
      <div style={{ padding: 20, color: "red" }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        maxWidth: "1800px",
        margin: "0 auto",
        padding: "0 clamp(90px, 9vw, 180px)",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    > 
      <h2
        style={{
          textAlign: "center",
          margin: 0,
          paddingBottom: 30,
          fontWeight: 700,
          fontSize: "clamp(10px, 2vw, 34px)",
          lineHeight: 1.2,
        }}
      >
      QUÝ ÔNG BÀ VUI LÒNG CHỌN
      </h2>
      {loading ? (
        <p style={{ textAlign: "center" }}>Đang tải...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gridTemplateRows: "repeat(2, minmax(0, 1fr))",
              gap: "clamp(24px, 3vw, 44px)",
              flex: 1,
              minHeight: 0,
            }}
          >
            {servicesList.map((s) => {
              const { background, hoverBackground, color } = getCardBackground(s.name);

              return (
                <Link
                  key={s._id}
                  href={`/service/${s._id}`}
                  style={{ display: "block", height: "100%" }}
                >
                  <button
                    style={{
                      height: "100%",
                      padding: "clamp(12px, 1.6vw, 20px)",
                      fontSize: "clamp(14px, 1.2vw, 22px)",
                      borderRadius: 10,
                      background,
                      color,
                      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "clamp(8px, 1vh, 12px)",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      width: "100%",
                      border: "none",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = hoverBackground;
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(0,123,255,0.3)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = background;
                      e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "clamp(34px, 5vh, 62px)",
                        fontSize: "clamp(21px, 2.55vw, 39px)",
                        color,
                      }}
                    >
                      {renderIcon(s.icon, color)}
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontWeight: "bold",
                          fontSize: "clamp(24px, 2.8vw, 50px)",
                          lineHeight: 1.15,
                          whiteSpace: "normal",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {s.name}
                      </div>
                      <div style={{ fontSize: "clamp(16px, 1.4vw, 24px)", marginTop: 4, opacity: 0.8 }}>
                        {s.description}
                      </div>
                    </div>
                  </button>
                </Link>
              );
            })}
          </div>
          <p
            style={{
              textAlign: "center",
              paddingTop: 40,
              fontSize: "clamp(15px, 1.2vw, 20px)",
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            Thời gian làm việc từ Thứ 2 đến Thứ 6 hằng tuần - sáng từ 8 giờ 00 phút đến 16 giờ 30 phút.
          </p>
        </div>
      )}
    </div>
  );
}
