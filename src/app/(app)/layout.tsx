import { ReactNode } from "react";
import Clock from "../components/Clock";

export default function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          minHeight: 96,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "20px 20px 0",
          fontSize: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flex: 1,
            minWidth: 0,
          }}
        >
          <img
            src="/assets/logotoaan.png"
            alt="Logo"
            style={{
              height: 68,
              width: "auto",
              objectFit: "contain",
              flexShrink: 0,
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              minWidth: 0,
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

        <div
          style={{
            fontSize: 18,
            whiteSpace: "nowrap",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            flexShrink: 0,
          }}
        >
          <Clock />
        </div>
      </header>

      <main
        style={{
          flex: 1,
          padding: "2rem clamp(4px, 3.4vw, 64px) 20px",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {children}
      </main>
    </div>
  );
}
