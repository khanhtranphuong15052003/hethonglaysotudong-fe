import { tickets } from "./data";

export const getDashboardStats = () => {
  const total = tickets.length;
  const waiting = tickets.filter((t) => t.status === "waiting").length;
  const calling = tickets.filter((t) => t.status === "calling").length;
  const done = tickets.filter((t) => t.status === "done").length;

  return {
    total,
    waiting,
    calling,
    done,
  };
};

export const getServiceStats = () => {
  const result: Record<string, number> = {};

  tickets.forEach((t) => {
    result[t.service] = (result[t.service] || 0) + 1;
  });

  return result;
};
