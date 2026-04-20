"use client";

import { useEffect, useState } from "react";
import ToastContainer from "@/components/ToastContainer";
import { useToast } from "@/hooks/useToast";
import { getTtsSettings, updateTtsSettings } from "@/services/admin.service";

export default function SettingsPage() {
  const { toasts, removeToast, success, error } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);

      try {
        const data = await getTtsSettings();
        setEnabled(data.enabled);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Không lấy được cấu hình voice";
        error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, [error]);

  const handleToggle = async () => {
    if (loading || saving) {
      return;
    }

    const nextEnabled = !enabled;
    setSaving(true);

    try {
      const updated = await updateTtsSettings(nextEnabled);
      setEnabled(updated.enabled);
      success(
        updated.enabled
          ? "Đã bật voice TTS thành công"
          : "Đã tắt voice TTS thành công",
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Cập nhật cấu hình voice thất bại";
      error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        padding: "24px",
        minHeight: "100%",
      }}
    >
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      <div
        style={{
          maxWidth: "760px",
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
          padding: "28px",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 800,
              color: "#003366",
            }}
          >
            Thiết lặp chế độ phát   
          </h2>
          <p
            style={{
              margin: "10px 0 0",
              fontSize: "15px",
              lineHeight: 1.6,
              color: "#526277",
            }}
          >
            Cấu hình voice (TTS) cho chức năng gọi số tiếp theo và gọi lại số.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            padding: "20px 22px",
            borderRadius: "14px",
            background: "#f8fafc",
            border: "1px solid #dbe5f0",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#16324f",
                marginBottom: "6px",
              }}
            >
              Bật/Tắt Voice
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#5d6b7c",
              }}
            >
              Trạng thái hiện tại:{" "}
              <strong>{enabled ? "Đang bật" : "Đang tắt"}</strong>
            </div>
          </div>

          <label
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              cursor: loading || saving ? "not-allowed" : "pointer",
              opacity: loading || saving ? 0.7 : 1,
            }}
          >
            <input
              type="checkbox"
              checked={enabled}
              onChange={() => void handleToggle()}
              disabled={loading || saving}
              style={{
                position: "absolute",
                opacity: 0,
                pointerEvents: "none",
              }}
            />
            <span
              style={{
                width: "58px",
                height: "32px",
                borderRadius: "999px",
                background: enabled ? "#16a34a" : "#cbd5e1",
                transition: "all 0.2s ease",
                position: "relative",
                display: "inline-block",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "4px",
                  left: enabled ? "30px" : "4px",
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "#fff",
                  boxShadow: "0 2px 6px rgba(15, 23, 42, 0.2)",
                  transition: "all 0.2s ease",
                }}
              />
            </span>
          </label>
        </div>

        <div
          style={{
            marginTop: "16px",
            fontSize: "13px",
            color: "#64748b",
          }}
        >
          {loading
  ? "Đang tải cấu hình..."
  : saving
    ? "Đang cập nhật cấu hình..."
    : "Có thể bật/tắt ngay để áp dụng cho thao tác gọi số."}
        </div>
      </div>
    </div>
  );
}
