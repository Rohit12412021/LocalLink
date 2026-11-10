import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: Error | null, user: TUser): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Please sign in to continue');
    }
    return user;
  }
}

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: { authorization?: string } }>();
    if (!request.headers?.authorization) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest<TUser>(_err: Error | null, user: TUser): TUser {
    return user;
  }
}
