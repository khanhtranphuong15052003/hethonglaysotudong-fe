"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import ToastContainer from "@/components/ToastContainer";
import { useToast } from "@/hooks/useToast";
import {
  getAutoResetSettings,
  getTtsSettings,
  updateAutoResetEnabled,
  updateAutoResetTime,
  updateTtsSettings,
} from "@/services/admin.service";

export default function SettingsPage() {
  const { toasts, removeToast, success, error } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [autoResetEnabled, setAutoResetEnabled] = useState(false);
  const [autoResetTime, setAutoResetTime] = useState("00:00");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAutoReset, setSavingAutoReset] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);

      try {
        const [ttsData, autoResetData] = await Promise.all([
          getTtsSettings(),
          getAutoResetSettings(),
        ]);
        setEnabled(ttsData.enabled);
        setAutoResetEnabled(autoResetData.enabled);
        setAutoResetTime(autoResetData.time);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Không lấy được cấu hình hệ thống";
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

  const handleToggleAutoReset = async () => {
    if (loading || savingAutoReset) {
      return;
    }

    const nextEnabled = !autoResetEnabled;
    setSavingAutoReset(true);

    try {
      const updated = await updateAutoResetEnabled(nextEnabled);
      setAutoResetEnabled(updated.enabled);
      setAutoResetTime(updated.time);
      success(
        updated.enabled
          ? "Đã bật tự động reset vé"
          : "Đã tắt tự động reset vé",
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Cập nhật tự động reset thất bại";
      error(message);
    } finally {
      setSavingAutoReset(false);
    }
  };

  const handleSaveAutoResetTime = async () => {
    if (loading || savingAutoReset) {
      return;
    }

    setSavingAutoReset(true);
    try {
      const updated = await updateAutoResetTime(autoResetTime);
      setAutoResetEnabled(updated.enabled);
      setAutoResetTime(updated.time);
      success(`Đã cập nhật giờ tự động reset thành ${updated.time}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Cập nhật giờ reset thất bại";
      error(message);
    } finally {
      setSavingAutoReset(false);
    }
  };

  const cardStyle: CSSProperties = {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
    padding: "28px",
    fontFamily: "inherit",
  };

  const switchStyle = (disabled: boolean): CSSProperties => ({
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.7 : 1,
  });

  return (
    <div
      style={{
        padding: "24px",
        minHeight: "100%",
        fontFamily: "inherit",
        color: "#1f2937",
      }}
    >
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      <div
        style={{
          maxWidth: "860px",
          display: "grid",
          gap: "20px",
        }}
      >
        <div style={cardStyle}>
          <div style={{ marginBottom: "24px" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 600,
                color: "#1f2937",
              }}
            >
              Thiết lập chế độ phát
            </h2>
            <p
              style={{
                margin: "10px 0 0",
                fontSize: "14px",
                lineHeight: 1.6,
                color: "#4b5563",
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
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#1f2937",
                  marginBottom: "6px",
                }}
              >
                Bật/Tắt Voice
              </div>
              <div style={{ fontSize: "14px", color: "#4b5563" }}>
                Trạng thái hiện tại:{" "}
                <strong>{enabled ? "Đang bật" : "Đang tắt"}</strong>
              </div>
            </div>

            <label style={switchStyle(loading || saving)}>
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
              color: "#6b7280",
            }}
          >
            {loading
              ? "Đang tải cấu hình..."
              : saving
                ? "Đang cập nhật cấu hình..."
                : "Có thể bật/tắt ngay để áp dụng cho thao tác gọi số."}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ marginBottom: "24px" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 600,
                color: "#1f2937",
              }}
            >
              Tự động reset vé theo thời gian
            </h2>
            <p
              style={{
                margin: "10px 0 0",
                fontSize: "14px",
                lineHeight: 1.6,
                color: "#4b5563",
              }}
            >
              Chọn trạng thái bật/tắt và thời gian reset hằng ngày theo quyết định
              của admin.
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
              marginBottom: "18px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#1f2937",
                  marginBottom: "6px",
                }}
              >
                Bật/Tắt Auto Reset
              </div>
              <div style={{ fontSize: "14px", color: "#4b5563" }}>
                Trạng thái hiện tại:{" "}
                <strong>{autoResetEnabled ? "Đang bật" : "Đang tắt"}</strong>
              </div>
            </div>

            <label style={switchStyle(loading || savingAutoReset)}>
              <input
                type="checkbox"
                checked={autoResetEnabled}
                onChange={() => void handleToggleAutoReset()}
                disabled={loading || savingAutoReset}
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
                  background: autoResetEnabled ? "#16a34a" : "#cbd5e1",
                  transition: "all 0.2s ease",
                  position: "relative",
                  display: "inline-block",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "4px",
                    left: autoResetEnabled ? "30px" : "4px",
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
              display: "flex",
              alignItems: "end",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: "1 1 240px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1f2937",
                }}
              >
                Giờ reset mỗi ngày
              </label>
              <input
                type="time"
                value={autoResetTime}
                onChange={(event) => setAutoResetTime(event.target.value)}
                disabled={loading || savingAutoReset}
                style={{
                  width: "100%",
                  minHeight: "48px",
                  padding: "12px 14px",
                  border: "1px solid #cfd8e3",
                  borderRadius: "12px",
                  fontSize: "15px",
                  color: "#1d2a36",
                  background: "#fbfdff",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => void handleSaveAutoResetTime()}
              disabled={loading || savingAutoReset}
              style={{
                minWidth: "180px",
                height: "48px",
                padding: "0 20px",
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: loading || savingAutoReset ? "not-allowed" : "pointer",
                background: "#003366",
                color: "#fff",
                opacity: loading || savingAutoReset ? 0.7 : 1,
              }}
            >
              Lưu giờ reset
            </button>
          </div>

          <div
            style={{
              marginTop: "16px",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            {loading
              ? "Đang tải cấu hình auto reset..."
              : savingAutoReset
                ? "Đang cập nhật auto reset..."
                : "Giờ reset dùng định dạng 24h"}
          </div>
        </div>
      </div>
    </div>
  );
}
