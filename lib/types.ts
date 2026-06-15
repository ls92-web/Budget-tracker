export type IncomeType = 'salary' | 'freelance' | 'investment' | 'business' | 'rental' | 'gift' | 'other'
export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'digital_wallet' | 'other'
export type RecurringInterval = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'

export type Category =
  | 'Household'
  | 'Transportation'
  | 'Food & Dining'
  | 'Family & Kids'
  | 'Health'
  | 'Shopping'
  | 'Travel'
  | 'Savings & Investments'
  | 'Bills & Subscriptions'
  | 'Gifts'
  | 'Charity'
  | 'Coffee'
  | 'Miscellaneous'

export interface IncomeEntry {
  id: string
  amount: number
  source: string
  date: string
  notes?: string
  income_type: IncomeType
  created_at: string
  updated_at: string
}

export interface ExpenseEntry {
  id: string
  amount: number
  category: Category
  merchant?: string
  payment_method: PaymentMethod
  date: string
  notes?: string
  receipt_image_url?: string
  is_recurring: boolean
  recurring_interval?: RecurringInterval
  created_at: string
  updated_at: string
}

export interface Budget {
  id: string
  category: Category
  monthly_limit: number
  month: number
  year: number
  alert_threshold: number
  created_at: string
  updated_at: string
}

export interface SavingsGoal {
  id: string
  name: string
  target_amount: number
  current_amount: number
  target_date?: string
  description?: string
  color: string
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  totalIncome: number
  totalExpenses: number
  balance: number
  savingsRate: number
}

export interface CategorySpending {
  category: Category
  amount: number
  percentage: number
  count: number
}
