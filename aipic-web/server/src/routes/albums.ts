import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getDatabase } from '../lib/db/connection';
import { AlbumRepository } from '../lib/db/repositories/AlbumRepository';
import { authenticate, requireRole } from '../middleware/auth';
import { z } from 'zod';

const createAlbumSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().optional(),
  isSmartAlbum: z.boolean().optional(),
  smartRules: z.string().optional(),
});

const updateAlbumSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
});

const addPhotosSchema = z.object({
  photoIds: z.array(z.string()).min(1),
});

const removePhotosSchema = z.object({
  photoIds: z.array(z.string()).min(1),
});

export async function albumRoutes(fastify: FastifyInstance) {
  const db = getDatabase();
  const albumRepo = new AlbumRepository(db);

  // 获取树形相册结构
  fastify.get(
    '/tree',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const albums = albumRepo.findWithStats();
        
        // 构建树形结构
        const buildTree = (parentId: string | null): any[] => {
          return albums
            .filter((album) => album.parentId === parentId)
            .map((album) => ({
              ...album,
              children: buildTree(album.id),
            }));
        };

        const tree = buildTree(null);
        return tree;
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 获取所有相册（扁平列表）
  fastify.get(
    '/',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const albums = albumRepo.findWithStats();
        return albums;
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 获取相册详情
  fastify.get(
    '/:id',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const album = albumRepo.findById(id);

        if (!album) {
          return reply.code(404).send({ error: 'Album not found' });
        }

        const photoCount = albumRepo.getPhotoCount(id);
        return { ...album, photoCount };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 创建相册
  fastify.post(
    '/',
    { preHandler: [authenticate, requireRole(['owner'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createAlbumSchema.parse(request.body);
        const album = albumRepo.create(body);
        return album;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid input', details: error.errors });
        }
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 更新相册
  fastify.patch(
    '/:id',
    { preHandler: [authenticate, requireRole(['owner'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const body = updateAlbumSchema.parse(request.body);
        
        const success = albumRepo.update(id, body);
        if (!success) {
          return reply.code(404).send({ error: 'Album not found' });
        }

        const album = albumRepo.findById(id);
        return album;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid input', details: error.errors });
        }
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 删除相册
  fastify.delete(
    '/:id',
    { preHandler: [authenticate, requireRole(['owner'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const success = albumRepo.softDelete(id);

        if (!success) {
          return reply.code(404).send({ error: 'Album not found' });
        }

        return { message: 'Album deleted successfully' };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 批量添加照片到相册
  fastify.post(
    '/:id/photos',
    { preHandler: [authenticate, requireRole(['owner'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const body = addPhotosSchema.parse(request.body);

        const album = albumRepo.findById(id);
        if (!album) {
          return reply.code(404).send({ error: 'Album not found' });
        }

        let addedCount = 0;
        for (const photoId of body.photoIds) {
          if (albumRepo.addPhoto(id, photoId)) {
            addedCount++;
          }
        }

        return { message: `Added ${addedCount} photos to album`, addedCount };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid input', details: error.errors });
        }
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 批量从相册移除照片
  fastify.delete(
    '/:id/photos',
    { preHandler: [authenticate, requireRole(['owner'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const body = removePhotosSchema.parse(request.body);

        const album = albumRepo.findById(id);
        if (!album) {
          return reply.code(404).send({ error: 'Album not found' });
        }

        let removedCount = 0;
        for (const photoId of body.photoIds) {
          if (albumRepo.removePhoto(id, photoId)) {
            removedCount++;
          }
        }

        return { message: `Removed ${removedCount} photos from album`, removedCount };
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

