import { z } from "zod";
import { apiRequest } from "@/lib/api/client";

const auditLogSchema = z.object({
  id: z.string(),

  userId: z.string().nullish(),
  userName: z.string().nullish(),

  eventType: z.string(),
  action: z.string(),

  description: z.string().nullish(),
  entityName: z.string().nullish(),
  entityId: z.string().nullish(),

  httpMethod: z.string().nullish(),
  path: z.string().nullish(),

  statusCode: z.number().nullish(),
  durationMs: z.number().nullish(),

  ipAddress: z.string().nullish(),
  userAgent: z.string().nullish(),
  correlationId: z.string().nullish(),

  oldValuesJson: z.string().nullish(),
  newValuesJson: z.string().nullish(),

  occurredAtUtc: z.string(),
});

const pageSchema = z.object({
  items: z.array(auditLogSchema),
  totalCount: z.number(),
  pageNumber: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;

export type AuditQuery = {
  pageNumber: number;
  pageSize: number;
  fromUtc?: string;
  toUtc?: string;
  userId?: string;
  userName?: string;
  ipAddress?: string;
  eventType?: string;
  action?: string;
  entityName?: string;
  entityId?: string;
  statusCode?: number;
  search?: string;
};

export function searchAuditLogs(query: AuditQuery) {
  return apiRequest("auditlogs", {
    query,
    schema: pageSchema,
  });
}
