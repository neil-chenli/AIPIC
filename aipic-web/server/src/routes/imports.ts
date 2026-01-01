import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getDatabase } from '../lib/db/connection';
import { ImportTaskRepository } from '../lib/db/repositories/ImportTaskRepository';
import { ImportService } from '../services/ImportService';
import { authenticate, requireRole } from '../middleware/auth';
import { z } from 'zod';

const createImportSchema = z.object({
  sourcePath: z.string().min(1),
});

export async function importRoutes(fastify: FastifyInstance) {
  const db = getDatabase();
  const importTaskRepo = new ImportTaskRepository(db);
  const importService = new ImportService();

  // 创建导入任务
  fastify.post(
    '/',
    { preHandler: [authenticate, requireRole(['owner'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createImportSchema.parse(request.body);
        
        // 创建导入任务
        const task = importTaskRepo.create({ sourcePath: body.sourcePath });
        
        // 异步执行导入（不阻塞响应）
        importService.executeImport(task.id).catch((error) => {
          fastify.log.error(`Import task ${task.id} failed:`, error);
        });
        
        return task;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid input', details: error.errors });
        }
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 获取导入任务列表
  fastify.get(
    '/',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const limit = Number((request.query as any).limit) || 50;
        const offset = Number((request.query as any).offset) || 0;
        
        const tasks = importTaskRepo.findAll(limit, offset);
        return tasks;
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 获取导入任务详情
  fastify.get(
    '/:id',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const task = importTaskRepo.findById(id);
        
        if (!task) {
          return reply.code(404).send({ error: 'Import task not found' });
        }
        
        return task;
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 取消导入任务
  fastify.delete(
    '/:id',
    { preHandler: [authenticate, requireRole(['owner'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const success = importTaskRepo.cancel(id);
        
        if (!success) {
          return reply.code(404).send({ error: 'Import task not found' });
        }
        
        return { message: 'Import task cancelled' };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );
}

