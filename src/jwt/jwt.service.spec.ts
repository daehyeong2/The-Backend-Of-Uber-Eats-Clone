import { Test } from '@nestjs/testing';
import { JwtService } from './jwt.service';
import * as jwt from 'jsonwebtoken';
import { CONFIG_OPTIONS } from '@app/common/common.constants';

jest.mock('jsonwebtoken', () => {
  return {
    sign: jest.fn(() => 'TOKEN'),
  };
});

const TEST_KEY = 'testKey';

describe('JwtService', () => {
  let service: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        { provide: CONFIG_OPTIONS, useValue: { privateKey: TEST_KEY } },
        JwtService,
      ],
    }).compile();
    service = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sign', () => {
    it('should return a signed token', () => {
      const ID = '1';
      const token = service.sign(ID);
      expect(typeof token).toBe('string');
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith({ id: ID }, TEST_KEY);
    });
  });

  describe('verify', () => {
    it('should return the decoded token', () => {});
  });
});
