import { OrderStatus } from '@prisma/client'
import type { CreateOrderInput, OrderDetail, OrderListItem } from './types'
import * as orderRepository from './repository'

export async function createOrder(input: CreateOrderInput): Promise<OrderDetail> {
  return orderRepository.createOrder(input)
}

export async function getOrderById(id: string): Promise<OrderDetail | null> {
  return orderRepository.getOrderById(id)
}

export async function getOrdersByUser(userId: string): Promise<OrderListItem[]> {
  return orderRepository.getOrdersByUser(userId)
}

export async function updateOrderStatus(
  id: string,
  newStatus: OrderStatus,
): Promise<OrderDetail> {
  return orderRepository.updateOrderStatus(id, newStatus)
}

export const ordersService = {
  createOrder,
  getOrderById,
  getOrdersByUser,
  updateOrderStatus,
}
