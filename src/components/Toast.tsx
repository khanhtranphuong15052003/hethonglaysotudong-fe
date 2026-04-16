import React, { useEffect } from "react";

interface ToastProps {
  isOpen: boolean;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  isOpen,
  message,
  type = "info",
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const colorMap = {
    success: {
      bg: "#10b981",
      icon: "✓",
      lightBg: "#d1fae5",
    },
    error: {
      bg: "#ef4444",
      icon: "✕",
      lightBg: "#fee2e2",
    },
    warning: {
      bg: "#f59e0b",
      icon: "⚠",
      lightBg: "#fef3c7",
    },
    info: {
      bg: "#3b82f6",
      icon: "ℹ",
      lightBg: "#dbeafe",
    },
  };

  const colors = colorMap[type];

  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 9999,
        animation: "slideInRight 0.4s ease-out",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 8,
          boxShadow: "0 10px 32px rgba(0, 0, 0, 0.15)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 20px",
          minWidth: 300,
          maxWidth: 450,
          borderLeft: `4px solid ${colors.bg}`,
          fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: colors.lightBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            color: colors.bg,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {colors.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              color: "#333",
              fontSize: 14,
              fontWeight: 500,
              lineHeight: 1.5,
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
            }}
          >
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#999",
            cursor: "pointer",
            fontSize: 20,
            padding: 0,
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = "#333";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = "#999";
          }}
        >
          ×
        </button>
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
