import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getDatabase } from '../lib/db/connection';
import { PersonRepository } from '../lib/db/repositories/PersonRepository';
import { PhotoRepository } from '../lib/db/repositories/PhotoRepository';
import { authenticate, requireRole } from '../middleware/auth';
import { z } from 'zod';

const createPersonSchema = z.object({
  name: z.string().optional(),
});

const updatePersonSchema = z.object({
  name: z.string().optional(),
});

const mergePersonsSchema = z.object({
  targetPersonId: z.string(),
  sourcePersonId: z.string(),
});

export async function personRoutes(fastify: FastifyInstance) {
  const db = getDatabase();
  const personRepo = new PersonRepository(db);
  const photoRepo = new PhotoRepository(db);

  // 获取人物列表
  fastify.get(
    '/',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const persons = personRepo.findWithStats();
        return persons;
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 获取人物详情
  fastify.get(
    '/:id',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const person = personRepo.findById(id);

        if (!person) {
          return reply.code(404).send({ error: 'Person not found' });
        }

        const faces = personRepo.findFacesByPerson(id);
        const stats = personRepo.findWithStats().find((p) => p.id === id);

        return {
          ...person,
          faces,
          faceCount: stats?.faceCount || 0,
          photoCount: stats?.photoCount || 0,
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 获取人物照片
  fastify.get(
    '/:id/photos',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const faces = personRepo.findFacesByPerson(id);
        const photoIds = [...new Set(faces.map((f) => f.photoId))];
        const photos = photoIds.map((photoId) => photoRepo.findById(photoId)).filter(Boolean);
        return photos;
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 创建人物
  fastify.post(
    '/',
    { preHandler: [authenticate, requireRole(['owner'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createPersonSchema.parse(request.body);
        const person = personRepo.create(body);
        return person;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid input', details: error.errors });
        }
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 更新人物
  fastify.patch(
    '/:id',
    { preHandler: [authenticate, requireRole(['owner'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const body = updatePersonSchema.parse(request.body);
        
        const success = personRepo.update(id, body);
        if (!success) {
          return reply.code(404).send({ error: 'Person not found' });
        }

        const person = personRepo.findById(id);
        return person;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid input', details: error.errors });
        }
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 删除人物
  fastify.delete(
    '/:id',
    { preHandler: [authenticate, requireRole(['owner'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const success = personRepo.delete(id);

        if (!success) {
          return reply.code(404).send({ error: 'Person not found' });
        }

        return { message: 'Person deleted successfully' };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 合并人物
  fastify.post(
    '/merge',
    { preHandler: [authenticate, requireRole(['owner'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = mergePersonsSchema.parse(request.body);
        const success = personRepo.mergePersons(body.targetPersonId, body.sourcePersonId);

        if (!success) {
          return reply.code(400).send({ error: 'Failed to merge persons' });
        }

        return { message: 'Persons merged successfully' };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid input', details: error.errors });
        }
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 获取共现关系图
  fastify.get(
    '/graph/cooccurrence',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // 简化实现：返回人物共现关系
        const persons = personRepo.findAll();
        const cooccurrence: Array<{ person1: string; person2: string; count: number }> = [];

        // 获取所有照片中的人物共现
        for (const person1 of persons) {
          const faces1 = personRepo.findFacesByPerson(person1.id);
          const photoIds1 = new Set(faces1.map((f) => f.photoId));

          for (const person2 of persons) {
            if (person1.id >= person2.id) continue; // 避免重复

            const faces2 = personRepo.findFacesByPerson(person2.id);
            const photoIds2 = new Set(faces2.map((f) => f.photoId));

            // 计算共同出现的照片数
            const commonPhotos = [...photoIds1].filter((id) => photoIds2.has(id));
            if (commonPhotos.length > 0) {
              cooccurrence.push({
                person1: person1.id,
                person2: person2.id,
                count: commonPhotos.length,
              });
            }
          }
        }

        return cooccurrence;
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );
}

