import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { Restaurant } from '@app/restaurants/entities/restaurant.entity';
import { User, UserRole } from '@app/users/entities/user.entity';
import { OrderItem } from './entities/order-item.entity';
import { Dish } from '@app/restaurants/entities/dish.entity';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { NEW_PENDING_ORDER, PUB_SUB } from '@app/common/common.constants';
import { PubSub } from 'graphql-subscriptions';

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
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  canAccessOrder(user: User, order: Order): boolean {
    switch (user.role) {
      case UserRole.Client:
        if (order.customerId !== user.id) return false;
      case UserRole.Delivery:
        if (order.driverId !== user.id) return false;
      case UserRole.Owner:
        if (order.restaurant.ownerId !== user.id) return false;
      default:
        return true;
    }
  }

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
        if (options) {
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
        }
        orderFinalPrice += dishFinalPrice;
        const orderItem = await this.orderItems.save(
          this.orderItems.create({ dish, options }),
        );
        orderItems.push(orderItem);
      }
      const order = await this.orders.save(
        this.orders.create({
          restaurant,
          customer,
          total: orderFinalPrice,
          items: orderItems,
        }),
      );
      this.pubSub.publish(NEW_PENDING_ORDER, {
        pendingOrders: { order, ownerId: restaurant.ownerId },
      });
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
        orders = await this.orders.find({
          where: { customer: user, ...(status && { status }) },
        });
      } else if (user.role === UserRole.Delivery) {
        orders = await this.orders.find({
          where: { driver: user, ...(status && { status }) },
        });
      } else if (user.role === UserRole.Owner) {
        orders = await this.orders.find({
          where: { restaurant: { owner: user }, ...(status && { status }) },
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

  async getOrder(
    user: User,
    { id: orderId }: GetOrderInput,
  ): Promise<GetOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId, {
        relations: ['restaurant', 'items'],
      });
      if (!order) {
        return {
          ok: false,
          error: '주문이 존재하지 않습니다.',
        };
      }

      if (!this.canAccessOrder(user, order)) {
        return {
          ok: false,
          error: '해당 주문을 불러올 권한이 없습니다.',
        };
      }
      return {
        ok: true,
        order,
      };
    } catch {
      return {
        ok: false,
        error: '주문을 불러올 수 없습니다.',
      };
    }
  }
  async editOrder(
    user: User,
    { id: orderId, status }: EditOrderInput,
  ): Promise<EditOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId, {
        relations: ['restaurant'],
      });
      if (!order) {
        return {
          ok: false,
          error: '주문이 존재하지 않습니다.',
        };
      }

      if (!this.canAccessOrder(user, order)) {
        return {
          ok: false,
          error: '해당 주문을 불러올 권한이 없습니다.',
        };
      }

      let canEdit = true;

      switch (user.role) {
        case UserRole.Owner:
          if (![OrderStatus.Cooking, OrderStatus.Cooked].includes(status))
            canEdit = false;
          break;
        case UserRole.Delivery:
          if (![OrderStatus.PickedUp, OrderStatus.Delivered].includes(status))
            canEdit = false;
          break;
      }

      if (!canEdit) {
        return {
          ok: false,
          error: '해당 상태로 변경할 권한이 없습니다.',
        };
      }

      await this.orders.save([{ id: orderId, status }]);

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: '주문을 수정하는데 실패했습니다.',
      };
    }
  }
}
