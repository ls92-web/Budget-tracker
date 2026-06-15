import {
  UtensilsCrossed, Car, Home, Baby, Heart, ShoppingBag,
  Plane, TrendingUp, Receipt, Gift, HandHeart, Coffee, MoreHorizontal, type LucideIcon
} from 'lucide-react'
import { Category } from '@/lib/types'

const ICONS: Record<Category, LucideIcon> = {
  'Food & Dining': UtensilsCrossed,
  'Transportation': Car,
  'Household': Home,
  'Family & Kids': Baby,
  'Health': Heart,
  'Shopping': ShoppingBag,
  'Travel': Plane,
  'Savings & Investments': TrendingUp,
  'Bills & Subscriptions': Receipt,
  'Coffee': Coffee,
  'Gifts': Gift,
  'Charity': HandHeart,
  'Miscellaneous': MoreHorizontal,
}

export default function CategoryIcon({ category, size = 16 }: { category: string; size?: number }) {
  const Icon = ICONS[category as Category] ?? MoreHorizontal
  return <Icon size={size} />
}
