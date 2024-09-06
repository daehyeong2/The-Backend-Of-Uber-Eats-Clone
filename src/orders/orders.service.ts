import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { Restaurant } from '@app/restaurants/entities/restaurant.entity';
import { User, UserRole } from '@app/users/entities/user.entity';
import { OrderItem } from './entities/order-item.entity';
import { Dish } from '@app/restaurants/entities/dish.entity';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';

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
      let orderFinalPrice = 0;
      const orderItems: OrderItem[] = [];
      for (const { dishId, options } of items) {
        const dish = await this.dishes.findOne(dishId);
        if (!dish || dish.restaurantId !== restaurantId) {
          return {
            ok: false,
            error: '음식을 찾을 수 없습니다.',
          };
        }
        let dishFinalPrice = dish.price;
        for (const option of options) {
          const dishOption = dish.options.find(
            dishOption => dishOption.name === option.name,
          );
          if (dishOption) {
            if (dishOption.extra) {
              dishFinalPrice += dishOption.extra;
            } else {
              const dishOptionChoice = dishOption.choices.find(
                optionChoice => optionChoice.name === option.choice,
              );
              if (dishOptionChoice?.extra) {
                dishFinalPrice += dishOptionChoice.extra;
              }
            }
          }
        }
        orderFinalPrice += dishFinalPrice;
        const orderItem = await this.orderItems.save(
          this.orderItems.create({ dish, options }),
        );
        orderItems.push(orderItem);
      }
      await this.orders.save(
        this.orders.create({
          restaurant,
          customer,
          total: orderFinalPrice,
          items: orderItems,
        }),
      );
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

  async getOrders(
    user: User,
    { status }: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    try {
      let orders: Order[];
      if (user.role === UserRole.Client) {
        orders = await this.orders.find({ where: { customer: user } });
      } else if (user.role === UserRole.Delivery) {
        orders = await this.orders.find({ where: { driver: user } });
      } else if (user.role === UserRole.Owner) {
        orders = await this.orders.find({
          where: { restaurant: { owner: user } },
          relations: ['restaurant', 'items', 'customer'],
        });
      }
      return {
        ok: true,
        orders,
      };
    } catch {
      return {
        ok: false,
        error: '주문을 가져올 수 없습니다.',
      };
    }
  }
}
