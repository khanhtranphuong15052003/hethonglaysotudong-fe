"use client";

import Link from "next/link";
import { CSSProperties, ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";
import { clearAdminSession } from "@/lib/admin-auth";
import {
  FiActivity,
  FiGrid,
  FiLogOut,
  FiPrinter,
  FiSettings,
  FiTool,
  FiUsers,
} from "react-icons/fi";
import { IconType } from "react-icons";

interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
  counterId: string | null;
}

type NavItem = {
  href: string;
  label: string;
  icon: IconType;
};

const navItems: NavItem[] = [
  { href: "/admin", label: "Thống kê", icon: FiActivity },
  { href: "/admin/users", label: "Người dùng", icon: FiUsers },
  { href: "/admin/counter", label: "Quản lý phòng", icon: FiGrid },
  { href: "/admin/services", label: "Quản lý quầy", icon: FiTool },
  { href: "/admin/printers", label: "Máy in", icon: FiPrinter },
  { href: "/admin/settings", label: "Cài đặt", icon: FiSettings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const isLoginPage = pathname === "/login";

  const handleSessionExpired = () => {
    clearAdminSession();
    router.replace("/login?reason=session_expired");
  };

  useEffect(() => {
    if (isLoginPage) {
      return;
    }

    const token = localStorage.getItem("adminToken");
    const user = localStorage.getItem("adminUser");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      if (user) {
        setAdminUser(JSON.parse(user));
      }
      setIsLoggedIn(true);
    } catch {
      handleSessionExpired();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoginPage]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    clearAdminSession();
    router.replace("/login");
  };

  const activeIndex = navItems.reduce((matchedIndex, item, index) => {
    const isExactMatch = pathname === item.href;
    const isNestedMatch =
      item.href !== "/admin" && pathname.startsWith(`${item.href}/`);

    if (!isExactMatch && !isNestedMatch) {
      return matchedIndex;
    }

    if (matchedIndex === -1) {
      return index;
    }

    return item.href.length > navItems[matchedIndex].href.length
      ? index
      : matchedIndex;
  }, -1);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          height: "100vh",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          <div
            className="admin-sidebar-container"
            style={{
              background: "white",
              borderRight: "1px solid #e0e0e0",
              display: "flex",
              flexDirection: "column",
              boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
              transition: "width 0.3s ease",
            }}
          >
            <div
              className="admin-sidebar-logo"
              style={{
                padding: "10px",
                textAlign: "center",
                borderBottom: "1px solid #e0e0e0",
              }}
            >
              <div
                className="logo-image"
                style={{
                  margin: "0 auto",
                  backgroundImage: "url(/assets/logotoaan.png)",
                  backgroundSize: "contain",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              />
            </div>

            <nav
              className="admin-side-nav"
              style={
                {
                  flex: 1,
                  overflowY: "auto",
                  padding: "0",
                  textAlign: "left",
                  "--nav-item-height": "72px",
                  "--nav-item-gap": "0px",
                  "--active-index": activeIndex < 0 ? 0 : activeIndex,
                } as CSSProperties
              }
            >
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                }}
              >
                {navItems.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <li key={item.href} style={{ margin: 0 }}>
                      <Link
                        href={item.href}
                        className={`admin-side-link ${
                          activeIndex === index ? "is-active" : ""
                        }`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "0 20px",
                          color: "#333",
                          fontFamily: "Outfit, Outfit Fallback",
                        }}
                      >
                        <Icon size={24} style={{ minWidth: "24px" }} />
                        <span className="nav-label">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              minHeight: 0,
              background: "#f5f5f5",
            }}
          >
            <div
              className="admin-subheader"
              style={{
                background: "white",
                borderBottom: "1px solid #e0e0e0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <h1
                className="admin-title"
                style={{
                  margin: 0,
                  fontWeight: 700,
                  color: "#003366",
                }}
              >
                TÒA ÁN NHÂN DÂN KHU VỰC 1 - THÀNH PHỐ HỒ CHÍ MINH
              </h1>
              <div
                className="admin-user-info"
                style={{ display: "flex", alignItems: "center" }}
              >
                <div className="user-name" style={{ color: "#666" }}>
                  {adminUser?.fullName || "Admin"}
                </div>
                <button
                  onClick={handleLogout}
                  className="logout-button"
                  style={{
                    fontWeight: 600,
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#c82333";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#dc3545";
                  }}
                >
                  <FiLogOut size={16} className="logout-icon" />
                  <span className="logout-text">Đăng xuất</span>
                </button>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                minHeight: 0,
                padding: 0,
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Xác Nhận Đăng Xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi hệ thống này?"
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}
