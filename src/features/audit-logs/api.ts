import { z } from "zod";
import { apiRequest } from "@/lib/api/client";

const auditLogSchema = z.object({
  id: z.string(), userId: z.string().nullable(), userName: z.string().nullable(), eventType: z.string(), action: z.string(),
  description: z.string().nullable(), entityName: z.string().nullable(), entityId: z.string().nullable(), httpMethod: z.string().nullable(),
  path: z.string().nullable(), statusCode: z.number().nullable(), durationMs: z.number().nullable(), ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(), correlationId: z.string().nullable(), oldValuesJson: z.string().nullable(), newValuesJson: z.string().nullable(), occurredAtUtc: z.string(),
});
const pageSchema = z.object({ items: z.array(auditLogSchema), totalCount: z.number(), pageNumber: z.number(), pageSize: z.number(), totalPages: z.number() });
export type AuditLog = z.infer<typeof auditLogSchema>;
export type AuditQuery = { pageNumber: number; pageSize: number; fromUtc?: string; toUtc?: string; userId?: string; userName?: string; ipAddress?: string; eventType?: string; action?: string; entityName?: string; entityId?: string; statusCode?: number; search?: string };
export function searchAuditLogs(query: AuditQuery) {
  return apiRequest("auditlogs", { query, schema: pageSchema });
}
