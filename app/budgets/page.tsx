'use client'

import { useState } from 'react'
import { useBudgets } from '@/hooks/useBudgets'
import { useExpenses } from '@/hooks/useExpenses'
import { Budget, Category } from '@/lib/types'
import {
  formatCurrency, CATEGORIES, CATEGORY_COLORS, getCurrentMonth, getCurrentYear,
  getMonthName, calculateBudgetHealth
} from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Plus, Edit2, Trash2, Wallet, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import BudgetHealthScore from '@/components/dashboard/BudgetHealthScore'
import CategoryIcon from '@/components/ui/CategoryIcon'

interface BudgetFormData {
  category: Category
  monthly_limit: string
  alert_threshold: string
}

const DEFAULT_FORM: BudgetFormData = {
  category: 'Food & Dining',
  monthly_limit: '',
  alert_threshold: '80',
}

export default function BudgetsPage() {
  const [month, setMonth] = useState(getCurrentMonth())
  const [year, setYear] = useState(getCurrentYear())
  const { budgets, loading, upsert, remove } = useBudgets(month, year)
  const { entries: expenses } = useExpenses(month, year)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Budget | null>(null)
  const [form, setForm] = useState<BudgetFormData>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const openAdd = () => {
    setEditing(null)
    setForm(DEFAULT_FORM)
    setModalOpen(true)
  }

  const openEdit = (b: Budget) => {
    setEditing(b)
    setForm({
      category: b.category as Category,
      monthly_limit: String(b.monthly_limit),
      alert_threshold: String(b.alert_threshold),
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.monthly_limit) return
    setSaving(true)
    try {
      await upsert({
        category: form.category,
        monthly_limit: parseFloat(form.monthly_limit),
        alert_threshold: parseInt(form.alert_threshold),
        month,
        year,
      })
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const getSpent = (category: string) =>
    expenses.filter(e => e.category === category).reduce((sum, e) => sum + Number(e.amount), 0)

  const healthScore = calculateBudgetHealth(
    budgets.map(b => ({ limit: Number(b.monthly_limit), spent: getSpent(b.category) }))
  )

  const unbudgeted = CATEGORIES.filter(c => !budgets.find(b => b.category === c))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors" style={{ color: 'var(--text-muted)' }}>
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-semibold text-base min-w-[120px] text-center" style={{ color: 'var(--text-primary)' }}>
            {getMonthName(month)} {year}
          </h2>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors" style={{ color: 'var(--text-muted)' }}>
            <ChevronRight size={18} />
          </button>
        </div>
        <Button icon={<Plus size={16} />} onClick={openAdd}>Set Budget</Button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center justify-center">
          <BudgetHealthScore score={healthScore} />
        </div>
        <div className="card p-5 sm:col-span-2">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Budget Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Budgeted', value: formatCurrency(budgets.reduce((s, b) => s + Number(b.monthly_limit), 0)) },
              { label: 'Total Spent', value: formatCurrency(budgets.reduce((s, b) => s + getSpent(b.category), 0)) },
              { label: 'Remaining', value: formatCurrency(budgets.reduce((s, b) => s + Math.max(0, Number(b.monthly_limit) - getSpent(b.category)), 0)) },
            ].map(item => (
              <div key={item.label}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                <p className="text-lg font-semibold font-mono mt-0.5" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 h-32 skeleton" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
            <Wallet size={24} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No budgets set</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Create category budgets to track your spending</p>
          <Button className="mt-4" icon={<Plus size={14} />} onClick={openAdd} size="sm">Create Budget</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {budgets.map((budget, i) => {
            const spent = getSpent(budget.category)
            const limit = Number(budget.monthly_limit)
            const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
            const remaining = Math.max(0, limit - spent)
            const isOver = spent > limit
            const isWarning = pct >= budget.alert_threshold && !isOver
            const color = CATEGORY_COLORS[budget.category as Category] || '#94a3b8'
            const barColor = isOver ? 'var(--danger)' : isWarning ? 'var(--warning)' : color

            return (
              <div key={budget.id} className="card p-5 stagger-item" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, color }}>
                      <CategoryIcon category={budget.category} size={17} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{budget.category}</p>
                      {(isOver || isWarning) && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <AlertTriangle size={11} style={{ color: isOver ? 'var(--danger)' : 'var(--warning)' }} />
                          <span className="text-xs" style={{ color: isOver ? 'var(--danger)' : 'var(--warning)' }}>
                            {isOver ? 'Over budget' : `${budget.alert_threshold}% alert`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(budget)} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors" style={{ color: 'var(--text-muted)' }}>
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setDeleteId(budget.id)} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors" style={{ color: 'var(--text-muted)' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: barColor }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Spent </span>
                    <span className="font-semibold font-mono" style={{ color: isOver ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {formatCurrency(spent)}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}> of {formatCurrency(limit)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span style={{ color: 'var(--text-muted)' }}>
                      {isOver ? 'Over by ' : 'Left: '}
                    </span>
                    <span className="font-semibold font-mono" style={{ color: isOver ? 'var(--danger)' : 'var(--success)' }}>
                      {formatCurrency(isOver ? spent - limit : remaining)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Unbudgeted categories suggestion */}
      {unbudgeted.length > 0 && budgets.length > 0 && (
        <div className="card p-5">
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Categories without a budget</p>
          <div className="flex flex-wrap gap-2">
            {unbudgeted.map(cat => (
              <button
                key={cat}
                onClick={() => { setEditing(null); setForm({ ...DEFAULT_FORM, category: cat }); setModalOpen(true) }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all border hover:border-transparent"
                style={{
                  background: `${CATEGORY_COLORS[cat]}12`,
                  color: CATEGORY_COLORS[cat],
                  border: `1px solid ${CATEGORY_COLORS[cat]}30`,
                }}
              >
                <Plus size={11} />
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Budget' : 'Set Budget'}>
        <div className="space-y-4">
          <Select
            label="Category"
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
            options={CATEGORIES.map(c => ({ value: c, label: c }))}
          />
          <Input
            label="Monthly Limit"
            type="number"
            placeholder="0.00"
            value={form.monthly_limit}
            onChange={e => setForm(f => ({ ...f, monthly_limit: e.target.value }))}
            min="0"
            step="0.01"
          />
          <Input
            label="Alert Threshold (%)"
            type="number"
            placeholder="80"
            value={form.alert_threshold}
            onChange={e => setForm(f => ({ ...f, alert_threshold: e.target.value }))}
            min="1"
            max="100"
            hint="Get alerted when spending reaches this % of the budget"
          />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} loading={saving} disabled={!form.monthly_limit}>
              {editing ? 'Save Changes' : 'Set Budget'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Budget" size="sm">
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Remove this budget? Your expense history will be preserved.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={() => deleteId && remove(deleteId).then(() => setDeleteId(null))}>Remove</Button>
        </div>
      </Modal>
    </div>
  )
}
