export const mockStats = [
  { key: "totalUsers", value: 1284, change: 12.5 },
  { key: "activeSessions", value: 342, change: 4.2 },
  { key: "roles", value: 8, change: 0 },
  { key: "failedLogins", value: 17, change: -9.1 },
] as const;

export type SignInStatus = "success" | "failed";

export type MockSignIn = {
  id: number;
  user: string;
  device: string;
  minutesAgo: number;
  status: SignInStatus;
};

export const mockSignIns: MockSignIn[] = [
  { id: 1, user: "m.mousavi", device: "Chrome · Windows", minutesAgo: 3, status: "success" },
  { id: 2, user: "a.rezaei", device: "Edge · Windows", minutesAgo: 18, status: "success" },
  { id: 3, user: "s.karimi", device: "Safari · iPhone", minutesAgo: 42, status: "failed" },
  { id: 4, user: "h.ahmadi", device: "Chrome · Android", minutesAgo: 95, status: "success" },
  { id: 5, user: "f.hosseini", device: "Firefox · Linux", minutesAgo: 240, status: "failed" },
];