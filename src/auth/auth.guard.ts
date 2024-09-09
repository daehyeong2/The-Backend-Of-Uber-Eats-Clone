import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AllowedRoles } from './role.decorator';
import { JwtService } from '@app/jwt/jwt.service';
import { UsersService } from '@app/users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}
  async canActivate(context: ExecutionContext) {
    const roles = this.reflector.get<AllowedRoles[]>(
      'roles',
      context.getHandler(),
    );
    const gqlContext = GqlExecutionContext.create(context).getContext();
    if (!roles) {
      return true;
    }
    const token = gqlContext.token;
    if (!token) {
      return false;
    }
    const decoded = this.jwtService.verify(token.toString());
    if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
      const { user } = await this.userService.findById(decoded.id);
      if (!user) {
        return false;
      }
      gqlContext['user'] = user;
      if (roles.includes('Any')) {
        return true;
      }
      return roles.includes(user.role);
    }
    return false;
  }
}
