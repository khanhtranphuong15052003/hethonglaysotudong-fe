export interface Service {
  _id: string;
  name: string;
  code: string;
  description: string;
  displayOrder: number;
  prefixNumber: number;
  counterId: string;
  counterName: string;
  icon?: string;
}

export const services: Service[] = [
  {
    _id: "1",
    name: "Yêu cầu nộp đơn",
    code: "A",
    description: "Tiếp nhận hồ sơ nộp đơn",
    displayOrder: 1,
    prefixNumber: 0,
    counterId: "counter-1",
    counterName: "Quầy 1",
    icon: "FiEdit3",
  },
  {
    _id: "2",
    name: "Yêu cầu nhận kết quả",
    code: "B",
    description: "Nhận kết quả giải quyết hồ sơ",
    displayOrder: 2,
    prefixNumber: 0,
    counterId: "counter-2",
    counterName: "Quầy 2",
    icon: "FiClipboard",
  },
  {
    _id: "3",
    name: "Yêu cầu tư vấn",
    code: "C",
    description: "Tư vấn pháp luật",
    displayOrder: 3,
    prefixNumber: 0,
    counterId: "counter-1",
    counterName: "Quầy 1",
    icon: "FiMessageCircle",
  },
  {
    _id: "4",
    name: "Yêu cầu Khiếu nại",
    code: "D",
    description: "Tiếp nhận khiếu nại",
    displayOrder: 4,
    prefixNumber: 0,
    counterId: "counter-3",
    counterName: "Quầy 3",
    icon: "FiAlertCircle",
  },
  {
    _id: "5",
    name: "Yêu cầu kiểm tra",
    code: "E",
    description: "Thủ tục hành chính",
    displayOrder: 5,
    prefixNumber: 0,
    counterId: "counter-4",
    counterName: "Quầy 4",
    icon: "FiCheckCircle",
  },
  {
    _id: "6",
    name: "Dịch vụ khác",
    code: "F",
    description: "Các dịch vụ khác",
    displayOrder: 6,
    prefixNumber: 0,
    counterId: "counter-2",
    counterName: "Quầy 2",
    icon: "FiMoreHorizontal",
  },
];

// Fetch services từ API
export async function getServices(): Promise<Service[]> {
  try {
    const apiBase =
      process.env.NEXT_PUBLIC_BACKEND_API_URL ||
      `${process.env.NEXT_PUBLIC_API_URL}/api`;
    const apiUrl = `${apiBase}/services/active`;
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Failed to fetch services");

    const data = await response.json();
    if (data.success && Array.isArray(data.data)) {
      // Sắp xếp theo displayOrder
      return data.data.sort(
        (a: Service, b: Service) => a.displayOrder - b.displayOrder,
      );
    }
    return services;
  } catch (error) {
    console.error("Error fetching services:", error);
    return services;
  }
}
