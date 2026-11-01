import { z } from "zod";
import { apiRequest } from "@/lib/api/client";

const meSchema = z.object({
  id: z.string(),
  userName: z.string(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  phoneNumber: z.string().nullish(),
  roles: z.array(z.object({ id: z.number(), nameEn: z.string(), nameFa: z.string() })),
});

export type Me = z.infer<typeof meSchema>;

export function getMe(): Promise<Me> {
  return apiRequest("auth/me", { schema: meSchema });
}
