import { DynamicModule, Module } from '@nestjs/common';
import { MailModuleOptions } from './mail.interfaces';
import { MailService } from './mail.service';
import { CONFIG_OPTIONS } from '@app/common/common.constants';

@Module({})
export class MailModule {
  static forRoot(options: MailModuleOptions): DynamicModule {
    return {
      global: options?.isGlobal,
      module: MailModule,
      providers: [{ provide: CONFIG_OPTIONS, useValue: options }, MailService],
      exports: [MailService],
    };
  }
}
