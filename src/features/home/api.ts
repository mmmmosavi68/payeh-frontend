import { z } from "zod";
import { apiRequest } from "@/lib/api/client";
export const testRequestSchema = z.object({ id: z.number().int(), name: z.string(), email: z.string() });
export type TestRequest = z.infer<typeof testRequestSchema>;
export function getTest() { return apiRequest("home/Test", { schema: z.object({ id: z.number(), name: z.string(), email: z.string() }) }); }
export function postTest(value: TestRequest) { return apiRequest("home/Test", { method: "POST", body: value, schema: testRequestSchema }); }
