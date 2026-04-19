"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StaffPage() {
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem("staffToken");
    if (token) {
      // Nếu đã login, chuyển về trang dashboard (tự động tìm counterId)
      // Bạn có thể lưu counterId trong token hoặc sessionStorage
      const staffData = sessionStorage.getItem("staffToken");
      if (staffData) {
        const [, counterId] = staffData.split(":");
        if (counterId) {
          router.push(`/staff/${counterId}`);
          return;
        }
      }
    }
    // Nếu chưa login, chuyển tới login page
    router.push("/staff/login");
  }, [router]);

  return <div>Đang chuyển hướng...</div>;
}
