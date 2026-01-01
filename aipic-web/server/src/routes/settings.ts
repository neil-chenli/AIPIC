import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate, requireRole } from '../middleware/auth';
import { z } from 'zod';

// 简化的设置存储（实际应该存储在数据库或配置文件中）
const settings: Record<string, any> = {
  libraryPath: process.env.DATA_DIR || './data',
  mapTileProvider: 'openstreetmap',
  privacyMode: false,
};

const updateSettingsSchema = z.object({
  libraryPath: z.string().optional(),
  mapTileProvider: z.string().optional(),
  privacyMode: z.boolean().optional(),
});

export async function settingsRoutes(fastify: FastifyInstance) {
  // 获取设置
  fastify.get(
    '/',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        return settings;
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 更新设置
  fastify.patch(
    '/',
    { preHandler: [authenticate, requireRole(['owner'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = updateSettingsSchema.parse(request.body);
        
        Object.assign(settings, body);
        
        return settings;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid input', details: error.errors });
        }
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );
}

