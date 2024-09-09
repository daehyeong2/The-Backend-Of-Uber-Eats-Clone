import { Test } from '@nestjs/testing';
import { RestaurantService } from './restaurant.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Dish } from './entities/dish.entity';
import { RestaurantRepository } from './repositories/restaurant.repository';
import { CategoryRepository } from './repositories/category.repository';
import { ILike, Repository } from 'typeorm';
import { User } from '@app/users/entities/user.entity';
import { CreateRestaurantInput } from './dtos/create-restaurant.dto';
import { Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';
import { CreateDishInput } from './dtos/create-dish.dto';

const mockRepository = () => ({
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
});

const mockRestaurantRepository = () => ({
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  findByPagination: jest.fn(),
  count: jest.fn(),
});

const mockCategoryRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  getOrCreate: jest.fn(),
});

type MockCustomRepository<T = any> = Partial<Record<keyof T, jest.Mock>>;

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('RestaurantService', () => {
  let service: RestaurantService;
  let restaurantsRepository: MockCustomRepository<RestaurantRepository>;
  let categoriesRepository: MockCustomRepository<CategoryRepository>;
  let dishesRepository: MockRepository<Dish>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RestaurantService,
        {
          provide: RestaurantRepository,
          useValue: mockRestaurantRepository(),
        },
        {
          provide: CategoryRepository,
          useValue: mockCategoryRepository(),
        },
        { provide: getRepositoryToken(Dish), useValue: mockRepository() },
      ],
    }).compile();

    service = module.get<RestaurantService>(RestaurantService);
    restaurantsRepository = module.get(RestaurantRepository);
    categoriesRepository = module.get(CategoryRepository);
    dishesRepository = module.get(getRepositoryToken(Dish));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRestaurant', () => {
    const owner = {
      email: 'test@test.com',
    } as User;
    const createRestaurantInput = {
      name: 'Test Restaurant',
      categoryName: 'test',
    } as CreateRestaurantInput;

    it('should create a new restaurant', async () => {
      restaurantsRepository.create.mockReturnValue({ category: null });
      categoriesRepository.getOrCreate.mockResolvedValue(
        createRestaurantInput.categoryName,
      );

      const result = await service.createRestaurant(
        owner,
        createRestaurantInput,
      );

      expect(restaurantsRepository.create).toHaveBeenCalledTimes(1);
      expect(restaurantsRepository.create).toHaveBeenCalledWith(
        createRestaurantInput,
      );
      expect(categoriesRepository.getOrCreate).toHaveBeenCalledTimes(1);
      expect(categoriesRepository.getOrCreate).toHaveBeenCalledWith(
        createRestaurantInput.categoryName,
      );

      expect(restaurantsRepository.save).toHaveBeenCalledTimes(1);
      expect(restaurantsRepository.save).toHaveBeenCalledWith({
        category: createRestaurantInput.categoryName,
        owner,
      });

      expect(result).toEqual({
        ok: true,
      });
    });

    it('should fail on exception', async () => {
      restaurantsRepository.save.mockRejectedValue(new Error());

      const result = await service.createRestaurant(
        owner,
        createRestaurantInput,
      );

      expect(result).toEqual({ ok: false, error: '가게 생성에 실패했습니다.' });
    });
  });
  describe('allRestaurants', () => {
    it('should return all restaurants', async () => {
      const findByPaginationArgs = {
        totalPages: 0,
        totalResults: 0,
        restaurants: [],
      };
      restaurantsRepository.findByPagination.mockResolvedValue(
        findByPaginationArgs,
      );

      const result = await service.allRestaurants({ page: 1 });

      expect(restaurantsRepository.findByPagination).toHaveBeenCalledTimes(1);
      expect(restaurantsRepository.findByPagination).toHaveBeenCalledWith(
        expect.any(Object),
        1,
      );

      expect(result).toEqual({
        ok: true,
        totalPages: findByPaginationArgs.totalPages,
        totalResults: findByPaginationArgs.totalResults,
        results: findByPaginationArgs.restaurants,
      });
    });

    it('should fail if restaurants not found', async () => {
      restaurantsRepository.findByPagination.mockResolvedValue(null);

      const result = await service.allRestaurants({});

      expect(result).toEqual({
        ok: false,
        error: '가게를 찾을 수 없습니다.',
      });
    });

    it('should fail on exception', async () => {
      restaurantsRepository.findByPagination.mockRejectedValue(new Error());

      const result = await service.allRestaurants({});

      expect(result).toEqual({
        ok: false,
        error: '가게를 불러오는데 실패했습니다.',
      });
    });
  });
  describe('findRestaurantById', () => {
    it('should find a restaurant', async () => {
      restaurantsRepository.findOne.mockResolvedValue({
        name: 'Test Restaurant',
      });

      const result = await service.findRestaurantById({ restaurantId: 1 });

      expect(restaurantsRepository.findOne).toHaveBeenCalledTimes(1);
      expect(restaurantsRepository.findOne).toHaveBeenCalledWith(
        1,
        expect.any(Object),
      );

      expect(result).toEqual({
        ok: true,
        restaurant: {
          name: 'Test Restaurant',
        },
      });
    });
    it('should fail if the restaurant not found', async () => {
      restaurantsRepository.findOne.mockResolvedValue(null);

      const result = await service.findRestaurantById({ restaurantId: 1 });

      expect(result).toEqual({
        ok: false,
        error: '가게를 찾을 수 없습니다.',
      });
    });
    it('should fail on exception', async () => {
      restaurantsRepository.findOne.mockRejectedValue(new Error());

      const result = await service.findRestaurantById({ restaurantId: 1 });

      expect(result).toEqual({
        ok: false,
        error: '가게를 찾는데 실패했습니다.',
      });
    });
  });
  describe('searchRestaurantByName', () => {
    const searchQuery = 'Test Restaurant';
    it('should search a restaurant', async () => {
      restaurantsRepository.findByPagination.mockResolvedValue({
        name: 'Test Restaurant',
      });

      const result = await service.searchRestaurantByName({
        query: searchQuery,
        page: 1,
      });

      expect(restaurantsRepository.findByPagination).toHaveBeenCalledTimes(1);
      expect(restaurantsRepository.findByPagination).toHaveBeenCalledWith(
        {
          where: { name: ILike(`%${searchQuery}%`) },
        },
        1,
      );

      expect(result).toEqual({ ok: true, name: searchQuery });
    });

    it('should fail if no restaurant is found', async () => {
      restaurantsRepository.findByPagination.mockResolvedValue(null);

      const result = await service.searchRestaurantByName({
        query: searchQuery,
        page: 1,
      });

      expect(result).toEqual({
        ok: false,
        error: '가게를 찾을 수 없습니다.',
      });
    });

    it('should fail on exception', async () => {
      restaurantsRepository.findByPagination.mockRejectedValue(new Error());

      const result = await service.searchRestaurantByName({
        query: searchQuery,
        page: 1,
      });

      expect(result).toEqual({
        ok: false,
        error: '가게를 검색하는데 실패했습니다.',
      });
    });
  });
  describe('editRestaurant', () => {
    const editRestaurantArgs = {
      owner: {
        id: 1,
        email: 'test@test.com',
      },
      editRestaurantInput: {
        restaurantId: 1,
        categoryName: 'testCategory',
      },
    };
    it('should edit a restaurant', async () => {
      const checkRestaurant = jest.spyOn(service, 'checkRestaurant');

      checkRestaurant.mockResolvedValue({
        ok: true,
      });
      categoriesRepository.getOrCreate.mockResolvedValue(true);

      const result = await service.editRestaurant(
        editRestaurantArgs.owner as User,
        editRestaurantArgs.editRestaurantInput,
      );

      expect(checkRestaurant).toHaveBeenCalledTimes(1);
      expect(checkRestaurant).toHaveBeenCalledWith(
        editRestaurantArgs.owner.id,
        editRestaurantArgs.editRestaurantInput.restaurantId,
      );

      expect(categoriesRepository.getOrCreate).toHaveBeenCalledTimes(1);
      expect(categoriesRepository.getOrCreate).toHaveBeenCalledWith(
        editRestaurantArgs.editRestaurantInput.categoryName,
      );

      expect(restaurantsRepository.save).toHaveBeenCalledTimes(1);
      expect(restaurantsRepository.save).toHaveBeenCalledWith({
        id: editRestaurantArgs.editRestaurantInput.restaurantId,
        ...editRestaurantArgs.editRestaurantInput,
        category: true,
      });

      expect(result).toEqual({ ok: true });
    });

    it('should fail if the error is occurred', async () => {
      const error = {
        ok: false,
        error: 'Test Error',
      };
      const checkRestaurant = jest.spyOn(service, 'checkRestaurant');

      checkRestaurant.mockResolvedValue(error);

      const result = await service.editRestaurant(
        editRestaurantArgs.owner as User,
        editRestaurantArgs.editRestaurantInput,
      );

      expect(result).toEqual(error);
    });

    it('should fail on exception', async () => {
      const checkRestaurant = jest.spyOn(service, 'checkRestaurant');

      checkRestaurant.mockRejectedValue(new Error());

      const result = await service.editRestaurant(
        editRestaurantArgs.owner as User,
        editRestaurantArgs.editRestaurantInput,
      );

      expect(result).toEqual({
        ok: false,
        error: '가게를 수정할 수 없습니다.',
      });
    });
  });
  describe('allCategories', () => {
    it('should find all categories', async () => {
      categoriesRepository.find.mockResolvedValue(true);

      const result = await service.allCategories();

      expect(categoriesRepository.find).toHaveBeenCalledTimes(1);
      expect(categoriesRepository.find).toHaveBeenCalledWith();

      expect(result).toEqual({
        ok: true,
        categories: true,
      });
    });
    it('should fail on exception', async () => {
      categoriesRepository.find.mockRejectedValue(new Error());

      const result = await service.allCategories();

      expect(result).toEqual({
        ok: false,
        error: '모든 카테고리를 가져오는데 실패했습니다.',
      });
    });
  });
  describe('findCategoryBySlug', () => {
    const findCategoryBySlugArgs = {
      slug: 'test-slug',
      page: 1,
    };
    it('should find a category info', async () => {
      categoriesRepository.findOne.mockResolvedValue(true);
      restaurantsRepository.findByPagination.mockResolvedValue({
        restaurants: [],
        totalPages: 0,
        totalResults: 0,
      });

      const result = await service.findCategoryBySlug(findCategoryBySlugArgs);

      expect(categoriesRepository.findOne).toHaveBeenCalledTimes(1);
      expect(categoriesRepository.findOne).toHaveBeenCalledWith({
        slug: findCategoryBySlugArgs.slug,
      });
      expect(restaurantsRepository.findByPagination).toHaveBeenCalledTimes(1);
      expect(restaurantsRepository.findByPagination).toHaveBeenCalledWith(
        { where: { category: true } },
        findCategoryBySlugArgs.page,
      );

      expect(result).toEqual({
        ok: true,
        category: true,
        restaurants: [],
        totalPages: 0,
        totalResults: 0,
      });
    });
    it('should fail if the category not found', async () => {
      categoriesRepository.findOne.mockResolvedValue(null);

      const result = await service.findCategoryBySlug(findCategoryBySlugArgs);

      expect(result).toEqual({
        ok: false,
        error: '카테고리를 찾을 수 없습니다.',
      });
    });
    it('should fail on exception', async () => {
      categoriesRepository.findOne.mockRejectedValue(new Error());

      const result = await service.findCategoryBySlug(findCategoryBySlugArgs);

      expect(result).toEqual({
        ok: false,
        error: '카테고리를 찾는데 실패했습니다.',
      });
    });
  });
  describe('countRestaurantByCategory', () => {
    it('should count restaurant', async () => {
      restaurantsRepository.count.mockResolvedValue(1);

      const result = await service.countRestaurantByCategory({
        name: 'Test Category',
      } as Category);

      expect(restaurantsRepository.count).toHaveBeenCalledTimes(1);
      expect(restaurantsRepository.count).toHaveBeenCalledWith({
        category: { name: 'Test Category' },
      });

      expect(result).toBe(1);
    });
  });
  describe('createDish', () => {
    const createDishArgs = {
      user: { id: 1 } as User,
      createDishInput: {
        restaurantId: 1,
      } as CreateDishInput,
    };
    it('should create a dish', async () => {
      const checkRestaurant = jest.spyOn(service, 'checkRestaurant');

      checkRestaurant.mockResolvedValue({
        ok: true,
        restaurant: { name: 'Test Restaurant' } as Restaurant,
      });
      dishesRepository.create.mockReturnValue(true);

      const result = await service.createDish(
        createDishArgs.user,
        createDishArgs.createDishInput,
      );

      expect(checkRestaurant).toHaveBeenCalledTimes(1);
      expect(checkRestaurant).toHaveBeenCalledWith(1, 1);

      expect(dishesRepository.create).toHaveBeenCalledTimes(1);
      expect(dishesRepository.create).toHaveBeenCalledWith({
        ...createDishArgs.createDishInput,
        restaurant: {
          name: 'Test Restaurant',
        },
      });

      expect(dishesRepository.save).toHaveBeenCalledTimes(1);
      expect(dishesRepository.save).toHaveBeenCalledWith(true);

      expect(result).toEqual({
        ok: true,
      });
    });
    it('should fail if the error is occurred', async () => {
      const checkRestaurant = jest.spyOn(service, 'checkRestaurant');

      checkRestaurant.mockResolvedValue({
        ok: false,
        error: 'Test Error',
      });

      const result = await service.createDish(
        createDishArgs.user,
        createDishArgs.createDishInput,
      );

      expect(result).toEqual({ ok: false, error: 'Test Error' });
    });
    it('should fail on exception', async () => {
      const checkRestaurant = jest.spyOn(service, 'checkRestaurant');

      checkRestaurant.mockRejectedValue(new Error());

      const result = await service.createDish(
        createDishArgs.user,
        createDishArgs.createDishInput,
      );

      expect(result).toEqual({
        ok: false,
        error: '메뉴를 추가할 수 없습니다.',
      });
    });
  });
  describe('editDish', () => {
    const editDishArgs = {
      owner: {
        id: 1,
        email: 'test@test.com',
      } as User,
      editDishInput: {
        dishId: 1,
      },
    };
    it('should edit a dish', async () => {
      const checkDish = jest.spyOn(service, 'checkDish');

      checkDish.mockResolvedValue({
        ok: true,
      });

      const result = await service.editDish(
        editDishArgs.owner,
        editDishArgs.editDishInput,
      );

      expect(checkDish).toHaveBeenCalledTimes(1);
      expect(checkDish).toHaveBeenCalledWith(
        editDishArgs.owner.id,
        editDishArgs.editDishInput.dishId,
      );

      expect(dishesRepository.save).toHaveBeenCalledTimes(1);
      expect(dishesRepository.save).toHaveBeenCalledWith({
        id: editDishArgs.editDishInput.dishId,
        dishId: editDishArgs.editDishInput.dishId,
      });

      expect(result).toEqual({
        ok: true,
      });
    });
    it('should fail if the error is occurred', async () => {
      const checkDish = jest.spyOn(service, 'checkDish');

      checkDish.mockResolvedValue({
        ok: false,
        error: 'Test Error',
      });

      const result = await service.editDish(
        editDishArgs.owner,
        editDishArgs.editDishInput,
      );

      expect(result).toEqual({ ok: false, error: 'Test Error' });
    });
    it('should fail on exception', async () => {
      const checkDish = jest.spyOn(service, 'checkDish');

      checkDish.mockRejectedValue(new Error());

      const result = await service.editDish(
        editDishArgs.owner,
        editDishArgs.editDishInput,
      );

      expect(result).toEqual({
        ok: false,
        error: '메뉴를 수정할 수 없습니다.',
      });
    });
  });
  describe('deleteDish', () => {
    const deleteDishArgs = {
      owner: {
        id: 1,
        email: 'test@test.com',
      } as User,
      deleteDishInput: {
        dishId: 1,
      },
    };
    it('should delete a dish', async () => {
      const checkDish = jest.spyOn(service, 'checkDish');

      checkDish.mockResolvedValue({
        ok: true,
      });

      const result = await service.deleteDish(
        deleteDishArgs.owner,
        deleteDishArgs.deleteDishInput,
      );

      expect(dishesRepository.delete).toHaveBeenCalledTimes(1);
      expect(dishesRepository.delete).toHaveBeenCalledWith(
        deleteDishArgs.deleteDishInput.dishId,
      );

      expect(result).toEqual({ ok: true });
    });
    it('should fail if the error is occurred', async () => {
      const checkDish = jest.spyOn(service, 'checkDish');

      checkDish.mockResolvedValue({
        ok: false,
        error: 'Test Error',
      });

      const result = await service.deleteDish(
        deleteDishArgs.owner,
        deleteDishArgs.deleteDishInput,
      );

      expect(result).toEqual({ ok: false, error: 'Test Error' });
    });
    it('should fail on exception', async () => {
      const checkDish = jest.spyOn(service, 'checkDish');

      checkDish.mockRejectedValue(new Error());

      const result = await service.deleteDish(
        deleteDishArgs.owner,
        deleteDishArgs.deleteDishInput,
      );

      expect(result).toEqual({
        ok: false,
        error: '메뉴를 삭제할 수 없습니다.',
      });
    });
  });
  describe('deleteRestaurant', () => {
    const deleteRestaurantArgs = {
      owner: {
        id: 1,
        email: 'test@test.com',
      } as User,
      deleteRestaurantArgs: {
        restaurantId: 1,
      },
    };
    it('shuold delete a restaurant', async () => {
      const checkRestaurant = jest.spyOn(service, 'checkRestaurant');

      checkRestaurant.mockResolvedValue({ ok: true });

      const result = await service.deleteRestaurant(
        deleteRestaurantArgs.owner,
        deleteRestaurantArgs.deleteRestaurantArgs,
      );

      expect(checkRestaurant).toHaveBeenCalledTimes(1);
      expect(checkRestaurant).toHaveBeenCalledWith(
        deleteRestaurantArgs.owner.id,
        deleteRestaurantArgs.deleteRestaurantArgs.restaurantId,
      );

      expect(restaurantsRepository.delete).toHaveBeenCalledTimes(1);
      expect(restaurantsRepository.delete).toHaveBeenCalledWith(
        deleteRestaurantArgs.deleteRestaurantArgs.restaurantId,
      );

      expect(result).toEqual({ ok: true });
    });
    it('should fail if the error is occurred', async () => {
      const checkRestaurant = jest.spyOn(service, 'checkRestaurant');

      checkRestaurant.mockResolvedValue({ ok: false, error: 'Test Error' });

      const result = await service.deleteRestaurant(
        deleteRestaurantArgs.owner,
        deleteRestaurantArgs.deleteRestaurantArgs,
      );

      expect(result).toEqual({ ok: false, error: 'Test Error' });
    });
    it('should fail on exception', async () => {
      const checkRestaurant = jest.spyOn(service, 'checkRestaurant');

      checkRestaurant.mockRejectedValue(new Error());

      const result = await service.deleteRestaurant(
        deleteRestaurantArgs.owner,
        deleteRestaurantArgs.deleteRestaurantArgs,
      );

      expect(result).toEqual({
        ok: false,
        error: '가게를 삭제할 수 없습니다.',
      });
    });
  });
  describe('checkRestaurant', () => {
    it('should check Restaurant', async () => {
      restaurantsRepository.findOne.mockResolvedValue({ ownerId: 1 });

      const result = await service.checkRestaurant(1, 1);

      expect(restaurantsRepository.findOne).toHaveBeenCalledTimes(1);
      expect(restaurantsRepository.findOne).toHaveBeenCalledWith(1);

      expect(result).toEqual({
        ok: true,
        restaurant: {
          ownerId: 1,
        },
      });
    });
    it('should fail if the restaurant not found', async () => {
      restaurantsRepository.findOne.mockResolvedValue(null);

      const result = await service.checkRestaurant(1, 1);

      expect(result).toEqual({ ok: false, error: '가게를 찾을 수 없습니다.' });
    });
    it("should fail if the user is not the restaurant's owner", async () => {
      restaurantsRepository.findOne.mockResolvedValue({ ownerId: 2 });

      const result = await service.checkRestaurant(1, 1);

      expect(result).toEqual({
        ok: false,
        error: '해당 가게에 대한 권한이 없습니다.',
      });
    });
  });
  describe('checkDish', () => {
    const dish = { restaurant: { ownerId: 1 } };
    it('should check Dish', async () => {
      dishesRepository.findOne.mockResolvedValue(dish);

      const result = await service.checkDish(1, 1);

      expect(dishesRepository.findOne).toHaveBeenCalledTimes(1);
      expect(dishesRepository.findOne).toHaveBeenCalledWith(1, {
        relations: ['restaurant'],
      });

      expect(result).toEqual({ ok: true, restaurant: { ownerId: 1 }, dish });
    });
    it('should fail if the dish not found', async () => {
      dishesRepository.findOne.mockResolvedValue(null);

      const result = await service.checkDish(1, 1);

      expect(result).toEqual({ ok: false, error: '메뉴를 찾을 수 없습니다.' });
    });
    it("should fail if the user is not the restaurant's owner", async () => {
      dishesRepository.findOne.mockResolvedValue(dish);

      const result = await service.checkDish(2, 1);

      expect(result).toEqual({
        ok: false,
        error: '해당 가게에 대한 권한이 없습니다.',
      });
    });
  });
});
