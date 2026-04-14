import { Counter } from "@/types/queue";

export const counters: Counter[] = [
  {
    _id: "1",
    counterId: "counter-1",
    name: "Quầy 1",
    serviceId: "1,3",
    serviceName: "Nộp đơn, Tư vấn",
    status: "active",
  },
  {
    _id: "2",
    counterId: "counter-2",
    name: "Quầy 2",
    serviceId: "2,6",
    serviceName: "Nhận kết quả, Dịch vụ khác",
    status: "active",
  },
  {
    _id: "3",
    counterId: "counter-3",
    name: "Quầy 3",
    serviceId: "4",
    serviceName: "Khiếu nại",
    status: "active",
  },
  {
    _id: "4",
    counterId: "counter-4",
    name: "Quầy 4",
    serviceId: "5",
    serviceName: "Kiểm tra",
    status: "active",
  },
];

export async function getCounters(): Promise<Counter[]> {
  try {
    const apiUrl = "/api/counters";
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Failed to fetch counters");
    const data = await response.json();
    if (data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return counters;
  } catch (error) {
    console.error("Error fetching counters:", error);
    return counters;
  }
}

export async function getCounterById(
  counterId: string,
): Promise<Counter | undefined> {
  return counters.find((c) => c.counterId === counterId);
}
