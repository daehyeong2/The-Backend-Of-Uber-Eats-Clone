import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}
  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      const exists = await this.users.findOne({ email });
      if (exists) {
        return { ok: false, error: '이미 사용 중인 email입니다.' };
      }
      await this.users.save(this.users.create({ email, password, role }));
      return { ok: true };
    } catch (e) {
      console.log(e);
      if (typeof e === 'string') {
        return { ok: false, error: e };
      }
      return { ok: false };
    }
  }
}
