import type { Request } from 'express';
import type { JwtPayload } from '@kasieats/shared';

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
