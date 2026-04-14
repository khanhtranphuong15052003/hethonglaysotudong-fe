export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
}

export const users: User[] = [
  {
    id: "1",
    name: "Nguyễn Văn Admin",
    email: "admin@gmail.com",
    role: "admin",
  },
  {
    id: "2",
    name: "Trần Thị Staff",
    email: "staff1@gmail.com",
    role: "staff",
  },
  {
    id: "3",
    name: "Lê Văn Staff",
    email: "staff2@gmail.com",
    role: "staff",
  },
];
