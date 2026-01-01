import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getDatabase } from '../lib/db/connection';
import { PhotoRepository } from '../lib/db/repositories/PhotoRepository';
import { authenticate, requireRole } from '../middleware/auth';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { z } from 'zod';

export async function photoRoutes(fastify: FastifyInstance) {
  const db = getDatabase();
  const photoRepo = new PhotoRepository(db);

  // 获取照片列表
  fastify.get(
    '/',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const query = request.query as any;
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 50;
        const offset = (page - 1) * limit;

        // 构建筛选条件
        const filter: any = {};

        if (query.start_date) {
          filter.startDate = new Date(query.start_date);
        }
        if (query.end_date) {
          filter.endDate = new Date(query.end_date);
        }
        if (query.album_id) {
          filter.albumId = query.album_id;
        }
        if (query.tag_ids) {
          filter.tagIds = Array.isArray(query.tag_ids) 
            ? query.tag_ids 
            : query.tag_ids.split(',');
        }
        if (query.has_gps !== undefined) {
          filter.hasLocation = query.has_gps === 'true' || query.has_gps === '1';
        }
        if (query.person_id) {
          filter.personId = query.person_id;
        }
        if (query.search) {
          filter.searchText = query.search;
        }

        const photos = photoRepo.findAll(filter, limit, offset);
        const total = photoRepo.count(filter);

        return {
          photos,
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

  // 获取照片详情
  fastify.get(
    '/:id',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const photo = photoRepo.findById(id);

        if (!photo) {
          return reply.code(404).send({ error: 'Photo not found' });
        }

        return photo;
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 获取照片文件
  fastify.get(
    '/:id/file',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const photo = photoRepo.findById(id);

        if (!photo) {
          return reply.code(404).send({ error: 'Photo not found' });
        }

        if (!existsSync(photo.filePath)) {
          return reply.code(404).send({ error: 'Photo file not found' });
        }

        const fileBuffer = await readFile(photo.filePath);
        reply.type(photo.mimeType);
        return fileBuffer;
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 软删除照片
  fastify.delete(
    '/:id',
    { preHandler: [authenticate, requireRole(['owner'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const success = photoRepo.softDelete(id);

        if (!success) {
          return reply.code(404).send({ error: 'Photo not found' });
        }

        return { message: 'Photo deleted successfully' };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 恢复照片
  fastify.post(
    '/:id/restore',
    { preHandler: [authenticate, requireRole(['owner'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const success = photoRepo.restore(id);

        if (!success) {
          return reply.code(404).send({ error: 'Photo not found' });
        }

        return { message: 'Photo restored successfully' };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );
}

