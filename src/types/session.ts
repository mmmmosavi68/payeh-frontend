export type SessionRecord = {
  id: string;
  deviceType: "desktop" | "mobile" | "tablet";
  device: string;
  ip: string;
  createdAt: string;
  lastActiveAt: string;
  current: boolean;
};