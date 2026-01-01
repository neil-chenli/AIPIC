import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getDatabase } from '../lib/db/connection';
import { AuditLogRepository } from '../lib/db/repositories/AuditLogRepository';
import { authenticate, requireRole } from '../middleware/auth';

export async function auditLogRoutes(fastify: FastifyInstance) {
  const db = getDatabase();
  const auditLogRepo = new AuditLogRepository(db);

  // 查询审计日志
  fastify.get(
    '/',
    { preHandler: [authenticate, requireRole(['owner'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const query = request.query as any;
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 100;
        const offset = (page - 1) * limit;

        const filter: any = {};
        if (query.entity_type) {
          filter.entityType = query.entity_type;
        }
        if (query.entity_id) {
          filter.entityId = query.entity_id;
        }
        if (query.user_id) {
          filter.userId = query.user_id;
        }
        if (query.start_date) {
          filter.startDate = new Date(query.start_date);
        }
        if (query.end_date) {
          filter.endDate = new Date(query.end_date);
        }

        const logs = auditLogRepo.findAll(filter, limit, offset);

        const total = auditLogRepo.findAll(filter, 10000, 0).length; // 简化计算总数

        return {
          logs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );
}

