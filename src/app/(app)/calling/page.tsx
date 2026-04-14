"use client";

import Link from "next/link";

export default function CallingPage() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Giao diện quầy phục vụ</h1>
      <p style={{ marginBottom: 20 }}>
        Trang này đã được nâng cấp. Vui lòng sử dụng giao diện nhân viên:
      </p>
      <Link href="/staff/login">
        <button
          style={{
            padding: 20,
            fontSize: 18,
            background: "#003366",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Đi tới giao diện nhân viên
        </button>
      </Link>
    </div>
  );
}
