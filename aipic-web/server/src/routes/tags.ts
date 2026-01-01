import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getDatabase } from '../lib/db/connection';
import { TagRepository } from '../lib/db/repositories/TagRepository';
import { authenticate, requireRole } from '../middleware/auth';
import { z } from 'zod';

const createTagSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  parentId: z.string().optional(),
});

const updateTagSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  parentId: z.string().nullable().optional(),
});

const addTagsToPhotoSchema = z.object({
  tagIds: z.array(z.string()).min(1),
});

const removeTagsFromPhotoSchema = z.object({
  tagIds: z.array(z.string()).min(1),
});

export async function tagRoutes(fastify: FastifyInstance) {
  const db = getDatabase();
  const tagRepo = new TagRepository(db);

  // 获取树形标签结构
  fastify.get(
    '/tree',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tags = tagRepo.findWithStats();
        
        // 构建树形结构
        const buildTree = (parentId: string | null): any[] => {
          return tags
            .filter((tag) => tag.parentId === parentId)
            .map((tag) => ({
              ...tag,
              children: buildTree(tag.id),
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

  // 获取所有标签
  fastify.get(
    '/',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tags = tagRepo.findWithStats();
        return tags;
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 获取标签详情
  fastify.get(
    '/:id',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const tag = tagRepo.findById(id);

        if (!tag) {
          return reply.code(404).send({ error: 'Tag not found' });
        }

        const photoIds = tagRepo.getTagPhotos(id);
        return { ...tag, photoCount: photoIds.length };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 创建标签
  fastify.post(
    '/',
    { preHandler: [authenticate, requireRole(['owner'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createTagSchema.parse(request.body);
        const tag = tagRepo.create(body);
        return tag;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid input', details: error.errors });
        }
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 更新标签
  fastify.patch(
    '/:id',
    { preHandler: [authenticate, requireRole(['owner'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const body = updateTagSchema.parse(request.body);
        
        const success = tagRepo.update(id, body);
        if (!success) {
          return reply.code(404).send({ error: 'Tag not found' });
        }

        const tag = tagRepo.findById(id);
        return tag;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid input', details: error.errors });
        }
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 删除标签
  fastify.delete(
    '/:id',
    { preHandler: [authenticate, requireRole(['owner'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const success = tagRepo.delete(id);

        if (!success) {
          return reply.code(404).send({ error: 'Tag not found' });
        }

        return { message: 'Tag deleted successfully' };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 为照片批量添加标签
  fastify.post(
    '/photos/:photoId',
    { preHandler: [authenticate, requireRole(['owner'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { photoId } = request.params as { photoId: string };
        const body = addTagsToPhotoSchema.parse(request.body);

        let addedCount = 0;
        for (const tagId of body.tagIds) {
          if (tagRepo.addTagToPhoto(photoId, tagId)) {
            addedCount++;
          }
        }

        return { message: `Added ${addedCount} tags to photo`, addedCount };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid input', details: error.errors });
        }
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 从照片批量移除标签
  fastify.delete(
    '/photos/:photoId',
    { preHandler: [authenticate, requireRole(['owner'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { photoId } = request.params as { photoId: string };
        const body = removeTagsFromPhotoSchema.parse(request.body);

        let removedCount = 0;
        for (const tagId of body.tagIds) {
          if (tagRepo.removeTagFromPhoto(photoId, tagId)) {
            removedCount++;
          }
        }

        return { message: `Removed ${removedCount} tags from photo`, removedCount };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid input', details: error.errors });
        }
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 获取照片的标签
  fastify.get(
    '/photos/:photoId',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { photoId } = request.params as { photoId: string };
        const tags = tagRepo.getPhotoTags(photoId);
        return tags;
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );
}

