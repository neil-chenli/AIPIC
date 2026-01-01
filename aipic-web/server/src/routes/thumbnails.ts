import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ThumbnailService } from '../services/ThumbnailService';
import { authenticate } from '../middleware/auth';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export async function thumbnailRoutes(fastify: FastifyInstance) {
  const thumbnailService = new ThumbnailService();

  // 获取缩略图
  fastify.get(
    '/:photoId/:size',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { photoId, size } = request.params as { photoId: string; size: 'small' | 'medium' };
        
        if (size !== 'small' && size !== 'medium') {
          return reply.code(400).send({ error: 'Invalid size. Must be "small" or "medium"' });
        }

        // 获取或生成缩略图
        const thumbnailPath = await thumbnailService.getThumbnail(photoId, size);
        
        if (!existsSync(thumbnailPath)) {
          return reply.code(404).send({ error: 'Thumbnail not found' });
        }

        // 返回图片文件
        const imageBuffer = await readFile(thumbnailPath);
        reply.type('image/jpeg');
        return imageBuffer;
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 手动触发缩略图生成
  fastify.post(
    '/:photoId/generate',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { photoId } = request.params as { photoId: string };
        
        await thumbnailService.generateThumbnails(photoId);
        
        return { message: 'Thumbnails generated successfully' };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: error.message || 'Internal server error' });
      }
    }
  );
}

