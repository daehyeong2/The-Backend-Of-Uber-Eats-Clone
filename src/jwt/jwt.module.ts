import { DynamicModule, Module } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { JwtModuleOptions } from './jwt.interfaces';
import { CONFIG_OPTIONS } from '@app/common/common.constants';

@Module({})
export class JwtModule {
  static forRoot(options: JwtModuleOptions): DynamicModule {
    return {
      global: options?.isGlobal,
      module: JwtModule,
      providers: [{ provide: CONFIG_OPTIONS, useValue: options }, JwtService],
      exports: [JwtService],
    };
  }
}
