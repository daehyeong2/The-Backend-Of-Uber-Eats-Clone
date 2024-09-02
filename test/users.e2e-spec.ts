import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { getConnection, Repository } from 'typeorm';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '@app/users/entities/user.entity';
import { Verification } from '@app/users/entities/verification.entity';

jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});

const GRAPHQL_ENDPOINT = '/graphql';
const testUser = {
  email: 'baconbacon1231@gmail.com',
  password: '1234',
};

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let verificationsRepository: Repository<Verification>;
  let jwtToken: string;

  const baseTest = () =>
    request(app.getHttpServer())
      .post(GRAPHQL_ENDPOINT)
      .expect(200);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest()
      .set('X-JWT', jwtToken)
      .send({ query });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verificationsRepository = module.get<Repository<Verification>>(
      getRepositoryToken(Verification),
    );
    await app.init();
  });

  afterAll(async () => {
    await getConnection().dropDatabase();
    app.close();
  });

  describe('createAccount', () => {
    it('should create account', () => {
      return publicTest(`
        mutation {
          createAccount(input: {
            email: "${testUser.email}",
            password: "${testUser.password}",
            role: Client
          }) {
            ok
            error
          }
        }
      `).expect(res => {
        expect(res.body.data.createAccount.ok).toBeTruthy();
        expect(res.body.data.createAccount.error).toBeNull();
      });
    });

    it('should fail if account already exists', () => {
      return publicTest(`
        mutation {
          createAccount(input: {
            email: "${testUser.email}",
            password: "${testUser.password}",
            role: Client
          }) {
            ok
            error
          }
        }
      `).expect(res => {
        const {
          body: {
            data: { createAccount },
          },
        } = res;
        expect(createAccount.ok).toBeFalsy();
        expect(createAccount.error).toEqual(expect.any(String));
      });
    });
  });
  describe('login', () => {
    it('should login with correct credentials', () => {
      return publicTest(`
          mutation {
            login(input: {email:"${testUser.email}", password: "${testUser.password}"}){
              ok
              error
              token
            }
          }
        `).expect(res => {
        const {
          body: {
            data: { login },
          },
        } = res;
        expect(login.ok).toBeTruthy();
        expect(login.error).toBeNull();
        expect(login.token).toEqual(expect.any(String));
        jwtToken = login.token;
      });
    });
    it('should not be able to login with wrong credentials', () => {
      return publicTest(`
          mutation {
            login(input: {email:"${testUser.email}", password: "xxx"}){
              ok
              error
              token
            }
          }
        `).expect(res => {
        const {
          body: {
            data: { login },
          },
        } = res;
        expect(login.ok).toBeFalsy();
        expect(login.error).toEqual(expect.any(String));
        expect(login.token).toBeNull();
      });
    });
  });

  describe('userProfile', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });

    it("should see a user's profile", () => {
      return privateTest(`
          {
            userProfile(userId:${userId}){
              ok
              error
              user{
                id
              }
            }
          }
        `).expect(res => {
        const {
          body: {
            data: {
              userProfile: {
                ok,
                error,
                user: { id },
              },
            },
          },
        } = res;
        expect(ok).toBeTruthy();
        expect(error).toBeNull();
        expect(id).toEqual(userId);
      });
    });

    it('should not find a profile', () => {
      return privateTest(`
          {
            userProfile(userId: 9999){
              ok
              error
              user{
                id
              }
            }
          }
        `).expect(res => {
        const {
          body: {
            data: {
              userProfile: { ok, error, user },
            },
          },
        } = res;
        expect(ok).toBeFalsy();
        expect(error).toEqual(expect.any(String));
        expect(user).toBeNull();
      });
    });
  });

  describe('me', () => {
    it('should find my profile', () => {
      return privateTest(`
          {
            me{
              email
            }
          }
        `).expect(res => {
        const {
          body: {
            data: {
              me: { email },
            },
          },
        } = res;
        expect(email).toBe(testUser.email);
      });
    });

    it('should not allow logged out user', () => {
      return publicTest(`
          {
            me{
              email
            }
          }
        `).expect(res => {
        const {
          body: {
            errors: [{ message }],
          },
        } = res;
        expect(message).toBe('Forbidden resource');
      });
    });
  });

  describe('editProfile', () => {
    const NEW_EMAIL = 'new@test.com';
    it('should change email', () => {
      return privateTest(`
            mutation {
              editProfile(input: {email: "${NEW_EMAIL}"}){
                ok
                error
              }
            }
        `).expect(res => {
        const {
          body: {
            data: {
              editProfile: { ok, error },
            },
          },
        } = res;
        expect(ok).toBeTruthy();
        expect(error).toBeNull();
      });
    });
    it('should have new email', () => {
      return privateTest(`
                {
                  me {
                    email
                    verified
                  }
                }
              `).expect(res => {
        const {
          body: {
            data: {
              me: { email, verified },
            },
          },
        } = res;
        expect(email).toBe(NEW_EMAIL);
        expect(verified).toBeFalsy();
      });
    });
  });

  describe('verifyEmail', () => {
    let verificationCode: string;
    beforeAll(async () => {
      const [verification] = await verificationsRepository.find();
      verificationCode = verification.code;
    });
    it('should verify email', () => {
      return privateTest(`
          mutation {
            verifyEmail(code: "${verificationCode}") {
              ok
              error
            }
          }
        `).expect(res => {
        const {
          body: {
            data: {
              verifyEmail: { ok, error },
            },
          },
        } = res;

        expect(ok).toBeTruthy();
        expect(error).toBeNull();
      });
    });
    it('should fail on verification code not found', () => {
      return privateTest(`
        mutation {
          verifyEmail(code: "1234") {
            ok
            error
          }
        }
      `).expect(res => {
        const {
          body: {
            data: {
              verifyEmail: { ok, error },
            },
          },
        } = res;

        expect(ok).toBeFalsy();
        expect(error).toBe('인증 정보를 찾을 수 없습니다.');
      });
    });
  });
});
