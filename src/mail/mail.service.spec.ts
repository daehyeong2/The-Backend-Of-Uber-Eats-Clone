import { Test } from '@nestjs/testing';
import { MailService } from './mail.service';
import { CONFIG_OPTIONS } from '@app/common/common.constants';

jest.mock('got', () => {});
jest.mock('form-data', () => {
  return {
    append: jest.fn(),
  };
});

describe('MailService', () => {
  let service: MailService;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: {
            apiKey: 'test-apiKey',
            domain: 'test-domain',
            fromEmail: 'test-fromEmail',
          },
        },
        MailService,
      ],
    }).compile();
    service = module.get<MailService>(MailService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it.todo('sendEmail');
  it.todo('sendVerificationEmail');
});
