"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Service, getServices } from "@/mock/services";
import { createTicket } from "@/services/ticket.service";
import { Ticket } from "@/mock/data";
import Link from "next/link";
import Image from "next/image";
import Toast from "@/components/Toast";

interface DisplayTicket extends Ticket {
  qrCode?: string;
  serviceCode?: string;
}

export default function ServiceTicketPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;

  const [service, setService] = useState<Service | null>(null);
  const [step, setStep] = useState<"form" | "done">("form");
  const [ticket, setTicket] = useState<DisplayTicket | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("male");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formError, setFormError] = useState("");

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
    setFormError("");

    if (!fullName.trim()) {
      showToast("Vui lĂ²ng nháº­p há» tĂªn", "error");
      return;
    }

    if (!phoneNumber.trim()) {
      showToast("Vui lĂ²ng nháº­p sá»‘ Ä‘iá»‡n thoáº¡i", "error");
      return;
    }

    if (!/^[0-9]{10}$/.test(phoneNumber.replace(/\D/g, ""))) {
      showToast("Sá»‘ Ä‘iá»‡n thoáº¡i khĂ´ng há»£p lá»‡", "error");
      return;
    }

    if (!service) {
      return;
    }
    try {
      const result = await createTicket({
        serviceId,
        name: fullName,
        phone: phoneNumber,
      });
      if (result.success && result.data) {
        const ticketData = {
          ...result.data,
          serviceName: result.service?.name || result.data.serviceId?.name,
          serviceCode: result.service?.code || result.data.serviceId?.code,
          number: result.data.ticketNumber || result.data.number,
          qrCode: result.data.qrCode,
        };
        setTicket(ticketData as DisplayTicket);
        setStep("done");
        showToast(result.message || "Lay so thanh cong!", "success");
      } else {
        throw new Error(result.message || "Loi khi tao ve");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      showToast(
        error instanceof Error ? error.message : "Khong the ket noi voi server",
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
    ? `${service?.code ?? ""}-${String(ticket.number).padStart(3, "0")}|${fullName}|${service?.name ?? ""}`
    : "";

  if (loading) {
    return <div style={{ padding: 20 }}></div>;
  }

  if (!service) {
    return (
      <div style={{ padding: 20 }}>
        <p>Dá»‹ch vá»¥ khĂ´ng tá»“n táº¡i</p>
        <Link href="/">
          <button style={{ padding: 10, fontSize: 16 }}>Quay láº¡i</button>
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
        justifyContent: step === "done" ? "flex-start" : "center",
        minHeight: "70vh",
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
            {/* Há» vĂ  tĂªn */}
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

           

            {/* Sá»‘ Ä‘iá»‡n thoáº¡i */}
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
              {/* Quay láº¡i */}
              <Link href="/" style={{ flex: 1, textDecoration: "none" }}>
                <button
                  type="button"
                  style={{
                    width: "100%",
                    padding: 16,
                    height: 70,
                    fontSize: 24,
                    background: "#f0f0f0",
                    color: "#333",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    cursor: "pointer",
                    transition: "background 0.3s ease",
                    
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#e0e0e0";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#f0f0f0";
                  }}
                >
                 Quay lại
                </button>
              </Link>

              {/* Submit button */}
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: 16,
                  height: 70,
                  fontSize: 32,
                  fontWeight: 600,
                  background: "#003366",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  transition: "background 0.3s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#001f47";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#003366";
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
               YÊU CẦU CỦA ÔNG BÀ ĐÃ ĐƯỢC TIẾP NHẬN
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
                {/* Cá»™t 1: ThĂ´ng tin yĂªu cáº§u */}
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

                {/* Cá»™t 2: Sá»‘ thá»© tá»± */}
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
                     Sá» THá»¨ Tá»° Cá»¦A Ă”NG BĂ€ :
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
                    {String(ticket?.number).padStart(3, "0")}
                  </h2>
                </div>

                {/* Cá»™t 3: MĂ£ QR */}
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
                    alt="QR mĂ£ sá»‘ thá»© tá»±"
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
              background: "white",
              padding: 20,
              borderRadius: 14,
              border: "1px solid #dbe6f2",
              boxShadow: "0 10px 24px rgba(0, 39, 91, 0.1)",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <h1 style={{ color: "#003366", textTransform: "uppercase", fontSize: 20, textAlign: 'center', marginBottom: 20, fontWeight: "bold" }}>
              Yêu cầu - Phản ánh
            </h1>
            <p style={{ fontSize: 16, color: "#333", lineHeight: 1.6 }}>
            Mọi ý kiến đóng góp, độ hài lòng, phản ánh tiêu cực gửi trực tiếp đến Chánh án TAND Khu vực 1, vui lòng email về:
              <br />
              <strong style={{ 
    display: "block", 
    textAlign: "center", 
    marginTop: 10,
    color: "#003366"
  }} >TAKV1.HCM.@TOAANSO.VN</strong>
            
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
    </div>
  );
}
