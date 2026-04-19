import Clock from "../components/Clock";
import { ReactNode } from "react";

export default function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* HEADER */}
      <header
        style={{
          height: 80,
          display: "flex",
          alignItems: "center",
          padding: "20px 20px 0",
          fontSize: 20,
          position: "relative",
          justifyContent: "center",
        }}
      >
        {/* Logo và Text - căn giữa */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* Logo */}
          <img
            src="/assets/logotoaan.png"
            alt="Logo"
            style={{
              height: 80,
              width: "auto",
              objectFit: "contain",
              flexShrink: 0,
            }}
          />

          {/* Text */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
            }}
          >
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 750 }}>
              TÒA ÁN NHÂN DÂN KHU VỰC 1
            </h1>
            <h4
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 400,
                opacity: 0.6,
              }}
            >
              Thành Phố Hồ Chí Minh
            </h4>
          </div>
        </div>

        {/* Clock ở bên phải - fixed position */}
        <div
          style={{
            position: "absolute",
            right: 20,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 18,
            whiteSpace: "nowrap",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
          }}
        >
          <Clock />
        </div>
      </header>

      {/* CONTENT */}
      <main
        style={{
          flex: 1,
          padding: "2rem clamp(4px, 3.4vw, 64px) 20px", // Added top padding
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {children}
      </main>
    </div>
  );
}
