import React from "react";

interface Alert2Props {
  isOpen: boolean;
  title?: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  onClose: () => void;
  onConfirm?: () => void;
  isConfirm?: boolean;
}

export default function Alert2({
  isOpen,
  title,
  message,
  type = "info",
  onClose,
  onConfirm,
  isConfirm = false,
}: Alert2Props) {
  if (!isOpen) return null;

  const colorMap = {
    info: { primary: "#0ea81b", light: "#e8f4ff", icon: "x" },
    success: { primary: "#0ea81b", light: "#e8f4ff", icon: "x" },
    warning: { primary: "#dc3545", light: "#f8d7da", icon: "x" },
    error: { primary: "#dc3545", light: "#f8d7da", icon: "x" },
  };

  const colors = colorMap[type];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: 16,
          boxShadow: "0 12px 48px rgba(0, 0, 0, 0.3)",
          width: "100%",
          maxWidth: 480,
          minHeight: 280,
          maxHeight: 480,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          animation: "slideIn 0.3s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Icon */}
        <div
          style={{
            background: colors.light,
            borderLeft: `6px solid ${colors.primary}`,
            padding: "24px 28px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            borderRadius: "16px 16px 0 0",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              flexShrink: 0,
              border: `2px solid ${colors.primary}`,
            }}
          >
            {colors.icon}
          </div>
          <h2
            style={{
              margin: 0,
              color: colors.primary,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.3px",
            }}
          >
            {title || "Thông báo"}
          </h2>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            padding: "28px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#444",
              fontSize: 15,
              lineHeight: 1.7,
              textAlign: "center",
              fontWeight: 500,
            }}
          >
            {message}
          </p>
        </div>

        {/* Footer - Buttons */}
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "20px 28px 28px 28px",
            justifyContent: isConfirm ? "flex-end" : "center",
          }}
        >
          {isConfirm ? (
            <>
              <button
                onClick={onClose}
                style={{
                  padding: "12px 32px",
                  fontSize: 14,
                  fontWeight: 700,
                  background: "white",
                  color: "#666",
                  border: "2px solid #ddd",
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  minWidth: 110,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#f9f9f9";
                  e.currentTarget.style.borderColor = "#999";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.borderColor = "#ddd";
                }}
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  onConfirm?.();
                  onClose();
                }}
                style={{
                  padding: "12px 32px",
                  fontSize: 14,
                  fontWeight: 700,
                  background: colors.primary,
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  minWidth: 110,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.opacity = "0.88";
                  e.currentTarget.style.boxShadow = `0 6px 20px ${colors.primary}50`;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Xác nhận
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              style={{
                padding: "12px 48px",
                fontSize: 14,
                fontWeight: 700,
                background: colors.primary,
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.2s ease",
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                minWidth: 140,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.opacity = "0.88";
                e.currentTarget.style.boxShadow = `0 6px 20px ${colors.primary}50`;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
