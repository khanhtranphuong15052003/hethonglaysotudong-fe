import { tickets, Ticket } from "./data";

export const createTicket = (
  name: string,
  service: string,
  code: string,
  serviceId: string,
  counterId: string,
): Ticket => {
  const count = tickets.filter((t) => t.number.startsWith(code)).length + 1;

  const newTicket: Ticket = {
    id: Date.now().toString(),
    number: `${code}${count.toString().padStart(3, "0")}`,
    name,
    service,
    serviceId,
    counterId,
    createdAt: new Date().toISOString(),
    status: "waiting",
  };

  tickets.push(newTicket);
  return newTicket;
};

export const getWaitingList = (): Ticket[] => {
  return tickets.filter((ticket) => ticket.status === "waiting");
};

export const getWaitingListByCounter = (counterId: string): Ticket[] => {
  return tickets.filter(
    (ticket) => ticket.counterId === counterId && ticket.status === "waiting",
  );
};

export const getWaitingListByService = (serviceId: string): Ticket[] => {
  return tickets.filter(
    (ticket) => ticket.serviceId === serviceId && ticket.status === "waiting",
  );
};

export const getNowCalling = (): Ticket | undefined => {
  return tickets.find((ticket) => ticket.status === "calling");
};

export const getNowCallingByCounter = (
  counterId: string,
): Ticket | undefined => {
  return tickets.find(
    (ticket) => ticket.counterId === counterId && ticket.status === "calling",
  );
};

export const callNext = (counterId: string): Ticket | null => {
  // reset người đang gọi
  const current = tickets.find(
    (t) => t.counterId === counterId && t.status === "calling",
  );
  if (current) {
    current.status = "processing";
  }

  // lấy người tiếp theo
  const next = tickets.find(
    (t) => t.counterId === counterId && t.status === "waiting",
  );
  if (!next) return null;

  next.status = "calling";
  next.counter = 1;

  return next;
};

export const completeTicket = (id: string): void => {
  const ticket = tickets.find((t) => t.id === id);
  if (ticket) {
    ticket.status = "done";
  }
};

export const getFirstWaitingTicket = (counterId: string): Ticket | null => {
  const ticket = tickets.find(
    (t) => t.counterId === counterId && t.status === "waiting",
  );
  return ticket || null;
};

export const callTicket = (counterId: string): Ticket | null => {
  const ticket = getFirstWaitingTicket(counterId);
  if (!ticket) return null;

  ticket.status = "calling";
  return ticket;
};
