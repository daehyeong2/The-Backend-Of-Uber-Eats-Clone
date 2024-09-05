import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { Restaurant } from '@app/restaurants/entities/restaurant.entity';
import { User } from '@app/users/entities/user.entity';
import { OrderItem } from './entities/order-item.entity';
import { Dish } from '@app/restaurants/entities/dish.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
  ) {}

  async createOrder(
    customer: User,
    { restaurantId, items }: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) {
        return {
          ok: false,
          error: '가게를 찾을 수 없습니다.',
        };
      }
      items.forEach(async ({ dishId, options }) => {
        const dish = await this.dishes.findOne(dishId);
        if (!dish) {
        }
        await this.orderItems.save(this.orderItems.create({ dish, options }));
      });
      // const order = await this.orders.save(
      //   this.orders.create({ restaurant, customer }),
      // );
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: '주문을 생성하는데 실패했습니다.',
      };
    }
  }
}
