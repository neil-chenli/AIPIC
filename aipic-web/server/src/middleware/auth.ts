import { FastifyRequest, FastifyReply } from 'fastify';
import { getDatabase } from '../lib/db/connection';
import { UserRepository } from '../lib/db/repositories/UserRepository';

// 扩展FastifyRequest类型以包含user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      username: string;
      role: 'owner' | 'member';
    };
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // 从Authorization header获取token
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.code(401).send({ error: 'Unauthorized: Missing or invalid token' });
      return;
    }

    const token = authHeader.substring(7);
    
    // 验证JWT token
    const decoded = request.server.jwt.verify(token) as { userId: string; username: string; role: string };
    
    // 验证会话是否存在且未过期
    const db = getDatabase();
    const userRepo = new UserRepository(db);
    const session = userRepo.findSessionByToken(token);
    
    if (!session) {
      reply.code(401).send({ error: 'Unauthorized: Session expired or invalid' });
      return;
    }

    // 获取用户信息
    const user = userRepo.findById(decoded.userId);
    if (!user || !user.isActive) {
      reply.code(401).send({ error: 'Unauthorized: User not found or inactive' });
      return;
    }

    // 将用户信息附加到request
    request.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  } catch (error) {
    reply.code(401).send({ error: 'Unauthorized: Invalid token' });
  }
}

export function requireRole(roles: ('owner' | 'member')[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      reply.code(401).send({ error: 'Unauthorized' });
      return;
    }

    if (!roles.includes(request.user.role)) {
      reply.code(403).send({ error: 'Forbidden: Insufficient permissions' });
      return;
    }
  };
}

