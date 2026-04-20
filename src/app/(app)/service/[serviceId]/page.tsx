"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Service, getServices } from "@/mock/services";
import { createTicket } from "@/services/ticket.service";
import { Ticket } from "@/mock/data";
import Link from "next/link";
import Image from "next/image";
import Toast from "@/components/Toast";

interface DisplayTicket extends Ticket {
  qrCode?: string;
  serviceCode?: string;
  displayNumber?: string;
  formattedNumber?: string;
}

const getTicketDisplayNumber = (ticket?: Partial<DisplayTicket> | null) =>
  ticket?.displayNumber ||
  ticket?.formattedNumber ||
  String(ticket?.number ?? "").padStart(3, "0");

function ServiceTicketContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = params.serviceId as string;
  const selectedCounterId = searchParams.get("counterId")?.trim() || "";

  const [service, setService] = useState<Service | null>(null);
  const [step, setStep] = useState<"form" | "done">("form");
  const [ticket, setTicket] = useState<DisplayTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [displayedName, setDisplayedName] = useState(fullName);
  const nameContainerRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (step === "done" && nameContainerRef.current && nameRef.current) {
      const containerWidth = nameContainerRef.current.offsetWidth;
      const nameWidth = nameRef.current.scrollWidth;

      if (nameWidth > containerWidth) {
        setDisplayedName(formatName(fullName));
      } else {
        setDisplayedName(fullName);
      }
    }
  }, [step, fullName, displayedName]);

  // Toast state
  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({
    isOpen: false,
    message: "",
    type: "info",
  });

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info",
  ) => {
    setToast({ isOpen: true, message, type });
  };

  useEffect(() => {
    const loadService = async () => {
      const services = await getServices();
      const found = services.find((s) => s._id === serviceId);
      if (found) {
        setService(found);
      }
      setLoading(false);
    };
    loadService();
  }, [serviceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!fullName.trim()) {
      showToast("Vui lòng nhập họ tên", "error");
      return;
    }

    if (!phoneNumber.trim()) {
      showToast("Vui lòng nhập số điện thoại", "error");
      return;
    }

    if (!/^[0-9]{8,10}$/.test(phoneNumber.replace(/\D/g, ""))) {
      showToast("Vui lòng nhập đúng số điện thoại - từ 8 đến 10 số", "error");
      return;
    }

    if (!service) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createTicket({
        serviceId,
        name: fullName,
        phone: phoneNumber,
        counterId: selectedCounterId || undefined,
      });
      if (result.success && result.data) {
        const ticketData = {
          ...result.data,
          serviceName: result.service?.name || result.data.serviceId?.name,
          serviceCode: result.service?.code || result.data.serviceId?.code,
          number: result.data.number,
          displayNumber: result.data.displayNumber || result.data.formattedNumber,
          formattedNumber: result.data.formattedNumber || result.data.displayNumber,
          qrCode: result.data.qrCode,
        };
        setTicket(ticketData as DisplayTicket);
        setStep("done");
        showToast(result.message || "Lấy số thành công!", "success");
      } else {
        throw new Error(result.message || "Lỗi khi tạo vé");
      }
    } catch (error) {
      setIsSubmitting(false);
      console.error("Error creating ticket:", error);
      showToast(
        error instanceof Error ? error.message : "Không thể kết nối với server",
        "error",
      );
    }
  };

  const formatName = (name: string) => {
    if (!name) return "";
    const words = name.trim().split(/\s+/);
    if (words.length <= 2) {
      return name;
    }
    const firstName = words[0];
    const lastName = words[words.length - 1];
    const middleNames = words.slice(1, -1);
    const abbreviatedMiddleNames = middleNames
      .map((word) => `${word.charAt(0).toUpperCase()}.`)
      .join("");
    return `${firstName} ${abbreviatedMiddleNames}${lastName}`;
  };

  const handleReset = () => {
    router.push("/");
  };

  useEffect(() => {
    if (step === "done" && nameContainerRef.current && nameRef.current) {
      const containerWidth = nameContainerRef.current.offsetWidth;
      const nameWidth = nameRef.current.scrollWidth;

      if (nameWidth > containerWidth) {
        setDisplayedName(formatName(fullName));
      } else {
        setDisplayedName(fullName);
      }
    }
  }, [step, fullName]);

  const qrData = ticket
    ? `${service?.code ?? ""}-${getTicketDisplayNumber(ticket)}|${fullName}|${service?.name ?? ""}`
    : "";

  if (loading) {
    return <div style={{ padding: 20 }}></div>;
  }

  if (!service) {
    return (
      <div style={{ padding: 20 }}>
        <p>Quầy không tồn tại</p>
        <Link href="/">
          <button style={{ padding: 10, fontSize: 16 }}>Quay lại</button>
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 120px)", // Adjust based on header height
        paddingTop: 0,
        paddingBottom: 20,
      }}
    >
      {step === "form" && (
        <div
          style={{
            width: "100%",
            maxWidth: 1000,
            background: "#f9f9f9",
            padding: 40,
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h2
            style={{
              textAlign: "center",
             
              color: "#003366",
              textTransform: "uppercase",
              fontSize: "40px",
              fontWeight: "bold",
            }}
          >
            {service.name}
          </h2>
          <p style={{ textAlign: "center", color: "#666", marginBottom: 18, fontSize:30 }}>
            {service.description}
          </p>

          <form onSubmit={handleSubmit}>
            {/* Họ và tên */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 600,
                  color: "#333",
                }}
              >
                Họ và tên <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên"
                style={{
                  width: "100%",
                  padding: 12,
                  fontSize: 24,
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

           

            {/* Số điện thoại */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 600,
                  color: "#333",
                }}
              >
                Số điện thoại <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Nhập số điện thoại"
                style={{
                  width: "100%",
                  padding: 12,
                  fontSize: 24,
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              {/* Quay lại */}
              <Link href="/" style={{ flex: 1, textDecoration: "none" }}>
                <button
                  type="button"
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    padding: 16,
                    height: 70,
                    fontSize: 24,
                    background: isSubmitting ? "#d1d5db" : "#f0f0f0",
                    color: isSubmitting ? "#6b7280" : "#333",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    transition: "background 0.3s ease",
                    
                  }}
                  onMouseOver={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.background = "#e0e0e0";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = isSubmitting
                      ? "#d1d5db"
                      : "#f0f0f0";
                  }}
                >
                 Quay lại
                </button>
              </Link>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: 16,
                  height: 70,
                  fontSize: 32,
                  fontWeight: 600,
                  background: isSubmitting ? "#9ca3af" : "#003366",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  transition: "background 0.3s ease",
                  opacity: isSubmitting ? 0.95 : 1,
                }}
                onMouseOver={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = "#001f47";
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = isSubmitting
                    ? "#9ca3af"
                    : "#003366";
                }}
              >
                Lấy số
              </button>
            </div>
          </form>
        </div>
      )}

      {step === "done" && (
        <div style={{ display: 'flex', width: '100%', maxWidth: 1200, gap: 20 }}>
          {/* Left Card - Ticket Info */}
          <div
            style={{
              width: "75%",
              background: "white",
              padding: 5,
              borderRadius: 14,
              border: "1px solid #dbe6f2",
              boxShadow: "0 10px 24px rgba(0, 39, 91, 0.1)",
              textAlign: "center",
            }}
          >
            <h1 style={{ color: "#003366",  fontSize: 28,  textTransform: "uppercase", paddingTop: 10 }}>
               YÊU CẦU CỦA QUÝ ÔNG BÀ ĐÃ ĐƯỢC TIẾP NHẬN
            </h1>
            <p style={{ fontSize: 16, color: "#333", marginBottom: 4 }}>
             Xin vui lòng chờ đến thứ tự
            </p>
            <div
              style={{
                background: "white",
                border: "2px solid #0b4a8a",
                borderRadius: 12,
                margin: '0 20px 10px',
                padding: '20px 20px',
                minHeight: "280px",
                display: "flex",
                alignItems: "stretch",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  alignItems: "center",
                  width: "100%",
                  gap: 10,
                }}
              >
                {/* Cột 1: Thông tin yêu cầu */}
                <div
                  style={{
                    paddingLeft: 15,
                    textAlign: "left",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                  ref={nameContainerRef}
                >
                  <p
                    style={{
                      fontSize: 20,
                      color: "#5c6773",
                    
                      textTransform: "uppercase",
                      fontStyle: "italic",
                    }}
                  >
                   Đương sự:
                  </p>
                  <p
                    style={{
                      fontSize: 20,
                      color: "#5c6773",
                      margin: 0,
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                    ref={nameRef}
                  >
                    <strong>{displayedName}</strong>
                  </p>
                  <p
                    style={{
                      fontSize: 20,
                      color: "#5c6773",
                    
                      textTransform: "uppercase",
                      fontStyle: "italic",
                    }}
                  >
                    YÊU CẦU
                  </p>
                  <p
                    style={{
                      fontSize: 20,
                      color: "#5c6773",
                      margin: "0 0 4px 0",
                      textTransform: "uppercase",
                    }}
                  >
                    <strong>{service.name}</strong>
                  </p>
                  
                </div>

                {/* Cột 2: Số thứ tự */}
                <div
                  style={{
                    textAlign: "center",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {/* <p style={{ fontSize: 14, color: "#5c6773", marginBottom:"4px" , textTransform: "uppercase"}}>
                     SỐ THỨ TỰ CỦA QUÝ ÔNG BÀ :
                  </p> */}
                  <h2
                    style={{
                      fontSize: 150,
                      fontWeight: "bold",
                      color: "#003366",
                      margin: "0",
                      letterSpacing: 3,
                      lineHeight: 1,
                    }}
                  >
                    {getTicketDisplayNumber(ticket)}
                  </h2>
                </div>

                {/* Cột 3: Mã QR */}
                <div
                  style={{
                    flex: 1,
                    
                    background: "white",
                    borderRadius: 10,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "220px",
                    gap: 14,
                  }}
                >
                  <Image
                    src={ticket?.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`}
                    alt="QR mã số thứ tự"
                    width={200}
                    height={200}
                    style={{ display: "block" }}
                    unoptimized
                  />
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: "#44515f",
                      lineHeight: 1.4,
                      textAlign: "center",
                    }}
                  >
                   Vui lòng chụp lại mã QR
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleReset}
              style={{
                marginTop: 10,
                marginBottom: 20,
                padding: "16px 30px",
                fontSize: 18,
                fontWeight: 600,
                background: "#003366",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                transition: "background 0.3s ease",
                width: "calc(100% - 40px)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#001f47";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "#003366";
              }}
            >
              Hoàn tất
            </button>
          </div>

          {/* Right Card - Feedback Info */}
          <div
            style={{
              width: "25%",
              background: "#ffffff", // Light blue background
              padding: "24px",
              borderRadius: 12, // Softer corners
              border: "1px solid #dbe6f2",
              boxShadow: "0 4px 12px rgba(0, 39, 91, 0.08)",
              textAlign: "center", // Center align all content
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 16, // Add gap between elements
            }}
          >
            <h1 style={{ 
              color: "#003366", 
              textTransform: "uppercase", 
              fontSize: 22, 
              fontWeight: "bold",
              margin: 0,
            }}>
              Yêu cầu - Phản ánh
            </h1>
            <p style={{ 
              fontSize: 16, 
              color: "#334155", // Softer text color
              lineHeight: 1.7,
              margin: 0,
            }}>
              Mọi ý kiến đóng góp, độ hài lòng, hoặc phản ánh tiêu cực, vui lòng gửi trực tiếp đến Chánh án TAND Khu vực 1 qua email:
              <br />
              <strong style={{ 
                display: "block", 
                marginTop: 12,
                color: "#003366",
                fontSize: 17,
                letterSpacing: '0.5px'
              }} >
                TAKV1.HCM@TOAAN.GOV.VN
              </strong>
            </p>
          </div>
        </div>
      )}

      {/* Toast Component */}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
      {isSubmitting && step === "form" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(6, 20, 37, 0.46)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: 24,
          }}
        >
          <div
            style={{
              background: "#fff",
              width: "min(100%, 360px)",
              borderRadius: 20,
              boxShadow: "0 28px 70px rgba(8, 27, 54, 0.24)",
              border: "1px solid rgba(0, 51, 102, 0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "#003366",
                color: "#fff",
                padding: "18px 22px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                Đang xử lý
              </h2>
            </div>
            <div
              style={{
                padding: 24,
                color: "#31475f",
                lineHeight: 1.6,
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "3px solid #dbe6f2",
                  borderTopColor: "#003366",
                  animation: "serviceTicketSpin 0.8s linear infinite",
                  flexShrink: 0,
                }}
              />
              <p style={{ margin: 0, fontSize: 16 }}>
                Vui lòng chờ trong giây lát, hệ thống đang tạo vé cho bạn.
              </p>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes serviceTicketSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default function ServiceTicketPage() {
  return (
    <Suspense fallback={null}>
      <ServiceTicketContent />
    </Suspense>
  );
}


