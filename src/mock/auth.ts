export interface StaffUser {
  id: string;
  username: string;
  password: string;
  counterId: string;
  name: string;
  role: "staff";
}

export const staffUsers: StaffUser[] = [
  {
    id: "staff-1",
    username: "1",
    password: "1",
    counterId: "counter-1",
    name: "Nhân viên Quầy 1",
    role: "staff",
  },
  {
    id: "staff-2",
    username: "2",
    password: "2",
    counterId: "counter-2",
    name: "Nhân viên Quầy 2",
    role: "staff",
  },
  {
    id: "staff-3",
    username: "3",
    password: "3",
    counterId: "counter-3",
    name: "Nhân viên Quầy 3",
    role: "staff",
  },
  {
    id: "staff-4",
    username: "4",
    password: "4",
    counterId: "counter-4",
    name: "Nhân viên Quầy 4",
    role: "staff",
  },
];

export async function authenticateStaff(
  username: string,
  password: string,
): Promise<StaffUser | null> {
  // Validate input
  if (!username || !password) {
    console.log("Missing username or password");
    return null;
  }

  // Sử dụng mock data (chưa có API)
  console.log("Authenticating with mock data:", { username, password });

  const staff = staffUsers.find(
    (user) => user.username === username && user.password === password,
  );

  if (staff) {
    console.log("✓ Authentication successful:", staff.name);
    return staff;
  } else {
    console.log(
      "✗ Authentication failed: User not found or password incorrect",
    );
    return null;
  }
}

export function getStaffFromToken(token: string): StaffUser | null {
  try {
    // Token format: staff-id:counterId
    const [staffId, counterId] = token.split(":");
    const staff = staffUsers.find((s) => s.id === staffId);
    if (staff && staff.counterId === counterId) {
      return staff;
    }
  } catch (error) {
    console.error("Error parsing token:", error);
  }
  return null;
}

export function createToken(staff: StaffUser): string {
  return `${staff.id}:${staff.counterId}`;
}
