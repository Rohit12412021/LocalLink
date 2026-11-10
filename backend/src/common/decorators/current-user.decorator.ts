import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { JwtPayloadUser } from '../types/jwt-payload';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayloadUser => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayloadUser }>();
    return request.user;
  },
);
