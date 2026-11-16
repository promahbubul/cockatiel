import { FastifyRequest, FastifyReply } from 'fastify';

export interface AuthenticatedUser {
  userId: string;
  email: string;
}

export async function authenticateToken(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized: Missing or invalid token' });
    }

    const decoded = await request.jwtVerify<{ userId: string; email: string }>();
    (request as any).user = decoded;
  } catch (err: any) {
    return reply.status(401).send({ error: 'Unauthorized: Token expired or invalid' });
  }
}
