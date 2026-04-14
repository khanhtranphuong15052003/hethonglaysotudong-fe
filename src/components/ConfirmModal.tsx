import React from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

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
        zIndex: 9999,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "white",
          borderRadius: 12,
          boxShadow: "0 12px 48px rgba(0, 0, 0, 0.3)",
          maxWidth: 420,
          width: "420px",
          padding: 0,
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: "#003366",
            padding: "24px 28px",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: 16,
            borderRadius: "12px 12px 0 0",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#ffffff",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.3px",
            }}
          >
            {title}
          </h2>
        </div>

        {/* Content */}
        <div
          style={{
            padding: "28px 28px",
            minHeight: 80,
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
            justifyContent: "center",
          }}
        >
          <button
            onClick={onCancel}
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
              minWidth: 100,
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
            onClick={onConfirm}
            style={{
              padding: "12px 32px",
              fontSize: 14,
              fontWeight: 700,
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              transition: "all 0.2s ease",
              textTransform: "uppercase",
              letterSpacing: "0.6px",
              minWidth: 100,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = "0.88";
              e.currentTarget.style.boxShadow =
                "0 6px 20px rgba(16, 185, 129, 0.5)";
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
        </div>
      </div>
    </div>
  );
}
