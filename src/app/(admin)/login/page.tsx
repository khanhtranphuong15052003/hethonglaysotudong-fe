"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Toast from "@/components/Toast";
import { loginAdmin } from "@/services/auth.service";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    isOpen: false,
    message: "",
    type: "info" as "success" | "error" | "warning" | "info",
  });

  useEffect(() => {
    const reason = searchParams.get("reason");
    if (reason === "session_expired") {
      setToast({
        isOpen: true,
        message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        type: "warning",
      });
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      if (!username.trim() || !password.trim()) {
        setToast({
          isOpen: true,
          message: "Vui lòng nhập tên đăng nhập và mật khẩu",
          type: "error",
        });
        setLoading(false);
        return;
      }

      // Call API login
      const data = await loginAdmin({
        username: username.trim(),
        password: password.trim(),
      });

      if (data.success && data.data.token) {
        if (data.data.user.role !== "admin") {
          throw new Error("Tài khoản này không có quyền quản trị");
        }
        // Lưu token và user info vào localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("adminToken", data.data.token);
          localStorage.setItem("adminUser", JSON.stringify(data.data.user));
        }

        setToast({
          isOpen: true,
          message: "Đăng nhập thành công!",
          type: "success",
        });

        // Redirect tới trang admin sau 1 giây
        setTimeout(() => {
          router.push("/admin");
        }, 1000);
      } else {
        setToast({
          isOpen: true,
          message: data.message || "Tên đăng nhập hoặc mật khẩu không đúng",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setToast({
        isOpen: true,
        message: "Lỗi kết nối với server, vui lòng thử lại",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "min(560px, calc(100vw - 40px))",
        background: "white",
        borderRadius: 16,
        padding: "clamp(28px, 3vw, 44px)",
        boxShadow: "0 20px 45px rgba(0,0,0,0.18)",
        boxSizing: "border-box",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          color: "#003366",
          marginBottom: 36,
          fontWeight: 700,
          fontSize: "clamp(28px, 2.2vw, 36px)",
        }}
      >
        ĐĂNG NHẬP HỆ THỐNG
      </h1>

      <form onSubmit={handleLogin}>
        {/* Username */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              marginBottom: 10,
              fontWeight: 600,
              color: "#333",
              fontSize: 20,
            }}
          >
            Tên đăng nhập <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nhập tên đăng nhập"
            style={{
              width: "100%",
              padding: "16px 18px",
              fontSize: 22,
              border: "1px solid #ccc",
              borderRadius: 8,
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 28 }}>
          <label
            style={{
              display: "block",
              marginBottom: 10,
              fontWeight: 600,
              color: "#333",
              fontSize: 20,
            }}
          >
            Mật khẩu <span style={{ color: "red" }}>*</span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              style={{
                width: "100%",
                padding: "16px 18px",
                fontSize: 22,
                border: "1px solid #ccc",
                borderRadius: 8,
                boxSizing: "border-box",
                fontFamily: "inherit",
                paddingRight: 70,
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 18,
                fontWeight: 600,
                color: "#666",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {showPassword ? "Ẩn" : "Xem"}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "18px 20px",
            fontSize: 24,
            fontWeight: 600,
            background: loading ? "#ccc" : "#003366",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.3s ease",
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.currentTarget.style.background = "#001f47";
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.currentTarget.style.background = "#003366";
            }
          }}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />

      {/* Demo Info */}
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginContent />
    </Suspense>
  );
}
