'use client'

import { useEffect } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Orders placed in this browser. There is no payment provider or server behind the store yet,
 * so an order is a record saved on this device, not a charge.
 */
export type OrderLine = { itemId: string; name: string; size: string; qty: number; price: number; image?: string }
export type Order = {
  id: string
  placedAt: string
  lines: OrderLine[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  delivery: 'standard' | 'express'
  contact: { email: string; name: string; address: string; city: string; postcode: string; country: string }
}

export const SHIPPING = {
  standard: { label: 'Standard', eta: '3–5 working days', price: 8, freeOver: 150 },
  express: { label: 'Express', eta: '1–2 working days', price: 18, freeOver: Infinity },
} as const

export const shippingCost = (delivery: keyof typeof SHIPPING, goods: number) =>
  goods >= SHIPPING[delivery].freeOver ? 0 : SHIPPING[delivery].price

type Orders = { orders: Order[]; place: (order: Order) => void }

export const useOrders = create<Orders>()(
  persist((set) => ({ orders: [], place: (order) => set((s) => ({ orders: [order, ...s.orders].slice(0, 50) })) }), {
    name: 'nowhere-orders-v1',
    skipHydration: true,
  }),
)

export function useOrdersHydration() {
  useEffect(() => {
    void useOrders.persist.rehydrate()
  }, [])
}

export const newOrderId = () => `NW-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`
