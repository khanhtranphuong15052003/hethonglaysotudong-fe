"use client";

import type { Ticket } from "@/mock/data";

interface CounterDisplayLayoutProps {
  counterName: string;
  waitingList: Ticket[];
  nowCalling: Ticket | null;
}

// Hàm rút gọn tên: Trần Phương Khánh → T.P.Khánh, Lê Văn Nguyên → L.V.Nguyên
const abbreviateName = (name: string): string => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  // Lấy chữ cái đầu của phần trước, giữ nguyên phần cuối (tên)
  const abbreviated = parts
    .slice(0, -1)
    .map((part) => part.charAt(0).toUpperCase())
    .join(".");
  return `${abbreviated}.${parts[parts.length - 1]}`;
};

export default function CounterDisplayLayout({
  counterName,
  waitingList,
  nowCalling,
}: CounterDisplayLayoutProps) {
  // Lấy 5 người đầu tiên từ danh sách chờ
  const displayList = waitingList.slice(0, 5);

  return (
    <div
      style={{
        backgroundColor: "#f5f5f5",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 160px)",
        overflow: "hidden",
      }}
    >
      {/* Header */}

      {/* Main Content - Full Width */}
      <div
        style={{
          flex: 1,
          padding: "0",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Danh sách chờ - Full Width */}
        <div
          style={{
            flex: 1,
            backgroundColor: "white",
            borderRadius: "0",
            boxShadow: "none",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Title */}
          <div
            style={{
              textAlign: "center",
              padding: "6px 10px",
              //   backgroundColor: "#f9f9f9",
              //   borderBottom: "1px solid #eee",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "40px",
                color: "#003d82",
                fontWeight: "bold",
              }}
            >
              DANH SÁCH CHỜ XỬ LÝ
            </h2>
          </div>

          {/* Table Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr 1fr",
              gap: 0,
              backgroundColor: "#003d82",
              color: "white",
              fontWeight: "bold",
              fontSize: "32px",
            }}
          >
            <div style={{ padding: "3px 4px", textAlign: "center" }}>
              SỐ PHIẾU
            </div>
            <div style={{ padding: "3px 4px", textAlign: "center" }}>HỌ VÀ TÊN</div>
            <div style={{ padding: "3px 4px", textAlign: "center" }}>
              ĐẾN QUẦY
            </div>
          </div>

          {/* Table Body - No Scroll */}
          <div
            style={{
              flex: 1,
              overflowY: "hidden",
              overflowX: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {displayList.length > 0 ? (
              displayList.map((ticket, index) => (
                <div
                  key={ticket.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 2fr 1fr",
                    gap: 0,
                    borderBottom: "1px solid #ddd",
                    backgroundColor: index % 2 === 1 ? "#003366" : "white",
                    color: index % 2 === 1 ? "white" : "#003366",
                    fontSize: "50px",
                    fontWeight: "bold",
                    flex: "0 0 20%",
                    minHeight: "auto",
                    lineHeight: "1",
                  }}
                >
                  <div
                    style={{
                      padding: "2px 3px",
                      textAlign: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      wordBreak: "break-word",
                    }}
                  >
                    {ticket.number}
                  </div>
                  <div
                    style={{
                      padding: "2px 3px",
                      textAlign: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      wordBreak: "break-word",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {abbreviateName(ticket.name)}
                  </div>
                  <div
                    style={{
                      padding: "2px 3px",
                      textAlign: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {counterName || "---"}
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                  color: "#999",
                  fontSize: "14px",
                }}
              >
                Không có ai chờ
              </div>
            )}
          </div>

          {/* Footer */}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
