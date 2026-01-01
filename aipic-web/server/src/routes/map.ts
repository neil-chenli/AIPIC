import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getDatabase } from '../lib/db/connection';
import { PhotoRepository } from '../lib/db/repositories/PhotoRepository';
import { authenticate } from '../middleware/auth';

export async function mapRoutes(fastify: FastifyInstance) {
  const db = getDatabase();
  const photoRepo = new PhotoRepository(db);

  // 获取热力图数据
  fastify.get(
    '/heat',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const query = request.query as any;
        
        // 构建筛选条件
        const filter: any = { hasLocation: true };

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

        // 获取所有带GPS的照片
        const photos = photoRepo.findAll(filter, 10000, 0); // 最多10000张

        // 生成热力图数据（按经纬度聚合）
        const heatMap: Record<string, { lat: number; lng: number; count: number }> = {};
        
        for (const photo of photos) {
          if (photo.latitude && photo.longitude) {
            // 将坐标四舍五入到小数点后3位（约100米精度）
            const lat = Math.round(photo.latitude * 1000) / 1000;
            const lng = Math.round(photo.longitude * 1000) / 1000;
            const key = `${lat},${lng}`;
            
            if (heatMap[key]) {
              heatMap[key].count++;
            } else {
              heatMap[key] = { lat, lng, count: 1 };
            }
          }
        }

        return Object.values(heatMap);
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 获取地图点位照片
  fastify.get(
    '/photos',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const query = request.query as any;
        
        // 构建筛选条件
        const filter: any = { hasLocation: true };

        if (query.bbox) {
          // bbox格式: minLng,minLat,maxLng,maxLat
          const [minLng, minLat, maxLng, maxLat] = query.bbox.split(',').map(Number);
          // 注意：这里简化处理，实际应该在Repository中实现空间查询
          // 暂时返回所有带GPS的照片，由前端过滤
        }

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

        const limit = Number(query.limit) || 1000;
        const photos = photoRepo.findAll(filter, limit, 0);

        // 只返回带GPS的照片，并格式化
        const points = photos
          .filter((photo) => photo.latitude && photo.longitude)
          .map((photo) => ({
            id: photo.id,
            latitude: photo.latitude!,
            longitude: photo.longitude!,
            altitude: photo.altitude,
            captureTime: photo.captureTime,
            thumbnailPath: photo.thumbnailPath,
          }));

        return points;
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );
}

