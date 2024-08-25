import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { JwtService } from '@app/jwt/jwt.service';
import { MailService } from '@app/mail/mail.service';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verifications: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}
  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      const exists = await this.users.findOne({ email });
      if (exists) {
        return { ok: false, error: '해당 이메일은 이미 사용 중입니다.' };
      }
      const user = await this.users.save(
        this.users.create({ email, password, role }),
      );
      const verification = await this.verifications.save(
        this.verifications.create({
          user,
        }),
      );
      this.mailService.sendVerificationEmail(user.email, verification.code);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: '계정을 생성할 수 없습니다.' };
    }
  }

  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.users.findOne(
        { email },
        { select: ['id', 'password'] },
      );
      if (!user) {
        return {
          ok: false,
          error: '해당 이메일의 계정을 찾을 수 없습니다.',
        };
      }
      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return {
          ok: false,
          error: '비밀번호가 일치하지 않습니다.',
        };
      }
      const token = this.jwtService.sign(user.id + '');
      return {
        ok: true,
        token,
      };
    } catch (e) {
      return {
        ok: false,
        error: e as string,
      };
    }
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.users.findOne(id);
      if (!user) {
        throw Error();
      }
      return {
        ok: true,
        user,
      };
    } catch (e) {
      return {
        ok: false,
        error: '사용자를 찾을 수 없습니다.',
      };
    }
  }

  async editProfile(
    userId: number,
    { email, password }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      const user = await this.users.findOne(userId);
      if (email) {
        user.email = email;
        user.verified = false;
        const verification = await this.verifications.save(
          this.verifications.create({
            user,
          }),
        );
        this.mailService.sendVerificationEmail(user.email, verification.code);
      }
      if (password) {
        user.password = password;
      }
      await this.users.save(user);
      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: e as string,
      };
    }
  }

  async verifyEmail(code: string, userId: number): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verifications.findOne(
        { code },
        { relations: ['user'] },
      );
      if (verification && verification.user.id === userId) {
        verification.user.verified = true;
        await this.users.save(verification.user);
        await this.verifications.delete(verification.id);
        return {
          ok: true,
        };
      }
      return {
        ok: false,
        error: '인증에 실패하였습니다.',
      };
    } catch (e) {
      console.log(e);
      return {
        ok: false,
        error: e as string,
      };
    }
  }
}
