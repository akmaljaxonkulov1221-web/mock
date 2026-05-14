import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  log(input: {
    actorId?: string | null;
    userId?: string | null;
    action: string;
    resource: string;
    resourceId?: string | null;
    metadata?: Record<string, unknown>;
    ip?: string | null;
  }) {
    return this.prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? undefined,
        userId: input.userId ?? undefined,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId ?? undefined,
        metadata: input.metadata as object | undefined,
        ip: input.ip ?? undefined,
      },
    });
  }
}
