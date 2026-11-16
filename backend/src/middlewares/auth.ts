import { FastifyRequest, FastifyReply } from 'fastify';

export interface AuthenticatedUser {
  userId: string;
  phoneNumber: string;
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

    const token = authHeader.split(' ')[1];
    const decoded = await request.jwtVerify<{ userId: string; phoneNumber: string }>();
    (request as any).user = decoded;
  } catch (err: any) {
    return reply.status(401).send({ error: 'Unauthorized: Token expired or invalid' });
  }
}
