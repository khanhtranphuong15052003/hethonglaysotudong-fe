import React from "react";
import Toast from "./Toast";
import { Toast as ToastType } from "@/hooks/useToast";

interface ToastContainerProps {
  toasts: ToastType[];
  onRemoveToast: (id: string) => void;
}

export default function ToastContainer({
  toasts,
  onRemoveToast,
}: ToastContainerProps) {
  return (
    <>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            position: "fixed",
            top: `${24 + toasts.indexOf(toast) * 100}px`,
            right: 24,
            zIndex: 9999,
          }}
        >
          <Toast
            isOpen={true}
            message={toast.message}
            type={toast.type}
            onClose={() => onRemoveToast(toast.id)}
            duration={0}
          />
        </div>
      ))}
    </>
  );
}
