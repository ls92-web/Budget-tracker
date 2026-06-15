import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Category } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function getMonthName(month: number): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
    new Date(2000, month - 1, 1)
  )
}

export function getCurrentMonth(): number {
  return new Date().getMonth() + 1
}

export function getCurrentYear(): number {
  return new Date().getFullYear()
}

export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

export const CATEGORY_COLORS: Record<Category, string> = {
  'Food & Dining': '#e11d48',
  'Transportation': '#fb7185',
  'Shopping': '#ec4899',
  'Household': '#db2777',
  'Bills & Subscriptions': '#d946ef',
  'Health': '#be185d',
  'Travel': '#c026d3',
  'Family & Kids': '#f472b6',
  'Gifts & Charity': '#e879f9',
  'Savings & Investments': '#db2777',
  'Miscellaneous': '#c98aa8',
}

export const CATEGORY_ICONS: Record<Category, string> = {
  'Household': 'Home',
  'Transportation': 'Car',
  'Food & Dining': 'UtensilsCrossed',
  'Family & Kids': 'Baby',
  'Health': 'Heart',
  'Shopping': 'ShoppingBag',
  'Travel': 'Plane',
  'Savings & Investments': 'TrendingUp',
  'Bills & Subscriptions': 'Receipt',
  'Gifts & Charity': 'Gift',
  'Miscellaneous': 'MoreHorizontal',
}

export const CATEGORIES: Category[] = [
  'Household',
  'Transportation',
  'Food & Dining',
  'Family & Kids',
  'Health',
  'Shopping',
  'Travel',
  'Savings & Investments',
  'Bills & Subscriptions',
  'Gifts & Charity',
  'Miscellaneous',
]

export const INCOME_TYPES = [
  { value: 'salary', label: 'Salary' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'investment', label: 'Investment' },
  { value: 'business', label: 'Business' },
  { value: 'rental', label: 'Rental' },
  { value: 'gift', label: 'Gift' },
  { value: 'other', label: 'Other' },
]

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'digital_wallet', label: 'Digital Wallet' },
  { value: 'other', label: 'Other' },
]

export const RECURRING_INTERVALS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

export function autoCategorize(text: string): Category {
  const lower = text.toLowerCase()

  const rules: Array<{ keywords: string[]; category: Category }> = [
    { keywords: ['rent', 'mortgage', 'electricity', 'water', 'gas', 'internet', 'wifi', 'home', 'repair', 'maintenance', 'cleaning', 'furniture', 'appliance'], category: 'Household' },
    { keywords: ['uber', 'lyft', 'taxi', 'bus', 'train', 'subway', 'metro', 'fuel', 'gas station', 'parking', 'toll', 'car', 'auto', 'mechanic', 'oil change', 'tire'], category: 'Transportation' },
    { keywords: ['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonalds', 'pizza', 'sushi', 'burger', 'grocery', 'supermarket', 'food', 'dining', 'lunch', 'dinner', 'breakfast', 'takeout', 'delivery', 'doordash', 'uber eats', 'grubhub'], category: 'Food & Dining' },
    { keywords: ['school', 'tuition', 'daycare', 'toys', 'children', 'kids', 'baby', 'family', 'pediatric', 'diapers', 'formula'], category: 'Family & Kids' },
    { keywords: ['doctor', 'hospital', 'pharmacy', 'medicine', 'dental', 'vision', 'health', 'medical', 'gym', 'fitness', 'therapy', 'insurance health', 'clinic', 'prescription'], category: 'Health' },
    { keywords: ['amazon', 'walmart', 'target', 'ebay', 'etsy', 'clothing', 'shoes', 'fashion', 'mall', 'store', 'shop', 'retail', 'electronics', 'apple', 'best buy'], category: 'Shopping' },
    { keywords: ['hotel', 'airbnb', 'flight', 'airline', 'vacation', 'travel', 'booking', 'expedia', 'trip', 'resort', 'cruise'], category: 'Travel' },
    { keywords: ['invest', 'stock', 'crypto', 'bitcoin', 'etf', 'mutual fund', 'retirement', '401k', 'ira', 'savings', 'brokerage', 'dividend'], category: 'Savings & Investments' },
    { keywords: ['netflix', 'spotify', 'hulu', 'disney', 'subscription', 'bill', 'phone', 'mobile', 'cable', 'streaming', 'software', 'saas', 'membership'], category: 'Bills & Subscriptions' },
    { keywords: ['gift', 'charity', 'donation', 'church', 'nonprofit', 'birthday', 'wedding', 'present'], category: 'Gifts & Charity' },
  ]

  for (const rule of rules) {
    if (rule.keywords.some(k => lower.includes(k))) {
      return rule.category
    }
  }

  return 'Miscellaneous'
}

export function parseNaturalLanguageTransaction(text: string): Partial<{
  amount: number
  merchant: string
  category: Category
  date: string
  notes: string
}> {
  const result: Partial<{ amount: number; merchant: string; category: Category; date: string; notes: string }> = {}

  // Extract amount
  const amountMatch = text.match(/\$?(\d+(?:\.\d{2})?)/i)
  if (amountMatch) {
    result.amount = parseFloat(amountMatch[1])
  }

  // Extract date hints
  const today = new Date()
  if (/yesterday/i.test(text)) {
    const d = new Date(today)
    d.setDate(d.getDate() - 1)
    result.date = d.toISOString().split('T')[0]
  } else if (/today/i.test(text)) {
    result.date = today.toISOString().split('T')[0]
  } else {
    result.date = today.toISOString().split('T')[0]
  }

  // Extract merchant (text after "at" or "from")
  const merchantMatch = text.match(/(?:at|from|@)\s+([A-Za-z\s&']+?)(?:\s+for|\s+\$|\s+yesterday|\s+today|$)/i)
  if (merchantMatch) {
    result.merchant = merchantMatch[1].trim()
    result.category = autoCategorize(result.merchant)
  } else {
    result.category = autoCategorize(text)
  }

  return result
}

export function calculateBudgetHealth(budgets: Array<{ limit: number; spent: number }>): number {
  if (budgets.length === 0) return 100

  const scores = budgets.map(b => {
    const pct = b.limit > 0 ? (b.spent / b.limit) * 100 : 0
    if (pct <= 50) return 100
    if (pct <= 75) return 80
    if (pct <= 90) return 60
    if (pct <= 100) return 40
    return 10
  })

  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}
