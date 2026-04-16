import React from "react";
import "@/styles/admin-table.css";

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
    <div className="admin-modal" onClick={onCancel}>
      <div
        className="admin-confirm-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-confirm-header">
          <h2>{title}</h2>
        </div>
        <div className="admin-confirm-body">
          <p>{message}</p>
        </div>
        <div className="admin-confirm-actions">
          <button className="cancel" onClick={onCancel}>
            Hủy
          </button>
          <button className="submit" onClick={onConfirm}>
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
