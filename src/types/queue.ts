export type TicketStatus = "waiting" | "calling" | "processing" | "done";

export interface Ticket {
  id: string;
  number: number;
  formattedNumber: string;
  customerName: string;
  phone: string;
  status: "waiting" | "processing" | "completed" | "skipped";
  serviceName: string;
  createdAt: string;
  name: string; // for speakName compatibility
}

export interface Counter {
  id: string;
  name: string;
  number: number;
  isActive: boolean;
  processedCount: number;
}

export interface Service {
  id: string;
  name: string;
  code: string;
}
