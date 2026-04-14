export type TicketStatus = "waiting" | "calling" | "processing" | "done";

export interface Ticket {
  id: string;
  number: string;
  name: string;
  service: string;
  serviceId: string;
  counterId: string;
  createdAt: string;
  status: TicketStatus;
  counter?: number;
}

// Danh sách vé
export const tickets: Ticket[] = [
  {
    id: "1",
    number: "A001",
    name: "Nguyễn Văn A",
    service: "Nộp hồ sơ",
    serviceId: "1",
    counterId: "counter-2",
    createdAt: "2026-03-25T08:00:00",
    status: "waiting",
  },
  {
    id: "2",
    number: "B002",
    name: "Trần Thị B",
    service: "Nhận kết quả",
    serviceId: "2",
    counterId: "counter-2",
    createdAt: "2026-03-25T08:02:00",
    status: "waiting",
  },
  {
    id: "3",
    number: "A003",
    name: "Lê Văn Nguyên",
    service: "Nộp hồ sơ",
    serviceId: "1",
    counterId: "counter-1",
    createdAt: "2026-03-25T08:05:00",
    status: "waiting",
  },
  {
    id: "4",
    number: "A004",
    name: "Phạm Đình Huy",
    service: "Tư vấn",
    serviceId: "3",
    counterId: "counter-1",
    createdAt: "2026-03-25T08:06:00",
    status: "waiting",
  },
  {
    id: "5",
    number: "A005",
    name: "Hoàng Văn E",
    service: "Nộp hồ sơ",
    serviceId: "1",
    counterId: "counter-1",
    createdAt: "2026-03-25T08:10:00",
    status: "waiting",
  },
  {
    id: "6",
    number: "A006",
    name: "Võ Văn F",
    service: "Nộp hồ sơ",
    serviceId: "1",
    counterId: "counter-1",
    createdAt: "2026-03-25T08:12:00",
    status: "waiting",
  },
  {
    id: "7",
    number: "A007",
    name: "Đỗ Thị G",
    service: "Nhận kết quả",
    serviceId: "2",
    counterId: "counter-2",
    createdAt: "2026-03-25T08:15:00",
    status: "waiting",
  },
  {
    id: "8",
    number: "A008",
    name: "Bùi Văn H",
    service: "Tư vấn",
    serviceId: "3",
    counterId: "counter-1",
    createdAt: "2026-03-25T08:18:00",
    status: "waiting",
  },
  {
    id: "9",
    number: "A009",
    name: "Nhan Thị I",
    service: "Nộp hồ sơ",
    serviceId: "1",
    counterId: "counter-1",
    createdAt: "2026-03-25T08:20:00",
    status: "waiting",
  },
  {
    id: "10",
    number: "A010",
    name: "Trương Văn J",
    service: "Nhận kết quả",
    serviceId: "2",
    counterId: "counter-1",
    createdAt: "2026-03-25T08:22:00",
    status: "waiting",
  },
  {
    id: "11",
    number: "A011",
    name: "Lý Thị K",
    service: "Tư vấn",
    serviceId: "3",
    counterId: "counter-1",
    createdAt: "2026-03-25T08:25:00",
    status: "waiting",
  },
  {
    id: "12",
    number: "A012",
    name: "Simm Văn L",
    service: "Nộp hồ sơ",
    serviceId: "1",
    counterId: "counter-1",
    createdAt: "2026-03-25T08:28:00",
    status: "waiting",
  },

  {
    id: "13",
    number: "A013",
    name: "Simm Văn L",
    service: "Nộp hồ sơ",
    serviceId: "1",
    counterId: "counter-1",
    createdAt: "2026-03-25T08:28:00",
    status: "waiting",
  },

  {
    id: "14",
    number: "A014",
    name: "Simm Văn L",
    service: "Nộp hồ sơ",
    serviceId: "1",
    counterId: "counter-2",
    createdAt: "2026-03-25T08:28:00",
    status: "waiting",
  },

  {
    id: "15",
    number: "A015",
    name: "Simm Văn L",
    service: "Nộp hồ sơ",
    serviceId: "1",
    counterId: "counter-1",
    createdAt: "2026-03-25T08:28:00",
    status: "waiting",
  },

  {
    id: "16",
    number: "A016",
    name: "Simm Văn L",
    service: "Nộp hồ sơ",
    serviceId: "1",
    counterId: "counter-1",
    createdAt: "2026-03-25T08:28:00",
    status: "waiting",
  },

  {
    id: "17",
    number: "A017",
    name: "Simm Văn L",
    service: "Nộp hồ sơ",
    serviceId: "1",
    counterId: "counter-1",
    createdAt: "2026-03-25T08:28:00",
    status: "waiting",
  },

  {
    id: "18",
    number: "A018",
    name: "Simm Văn L",
    service: "Nộp hồ sơ",
    serviceId: "1",
    counterId: "counter-1",
    createdAt: "2026-03-25T08:28:00",
    status: "waiting",
  },
];
