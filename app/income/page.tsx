'use client'

import { useState } from 'react'
import { useIncome } from '@/hooks/useIncome'
import { IncomeEntry, IncomeType } from '@/lib/types'
import { formatCurrency, formatDate, INCOME_TYPES, getCurrentMonth, getCurrentYear, getMonthName } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import { Plus, Edit2, Trash2, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'

const INCOME_COLORS: Record<string, string> = {
  salary: '#10b981',
  freelance: '#6366f1',
  investment: '#f59e0b',
  business: '#8b5cf6',
  rental: '#14b8a6',
  gift: '#ec4899',
  other: '#94a3b8',
}

interface IncomeFormData {
  amount: string
  date: string
  notes: string
  income_type: IncomeType
}

const DEFAULT_FORM: IncomeFormData = {
  amount: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
  income_type: 'salary',
}

export default function IncomePage() {
  const [month, setMonth] = useState(getCurrentMonth())
  const [year, setYear] = useState(getCurrentYear())
  const { entries, loading, total, add, update, remove } = useIncome(month, year)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<IncomeEntry | null>(null)
  const [form, setForm] = useState<IncomeFormData>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const openAdd = () => {
    setEditing(null)
    setForm(DEFAULT_FORM)
    setModalOpen(true)
  }

  const openEdit = (entry: IncomeEntry) => {
    setEditing(entry)
    setForm({
      amount: String(entry.amount),
      date: entry.date,
      notes: entry.notes || '',
      income_type: entry.income_type,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.amount) return
    setSaving(true)
    try {
      const payload = {
        amount: parseFloat(form.amount),
        date: form.date,
        notes: form.notes || undefined,
        income_type: form.income_type,
      }
      if (editing) {
        await update(editing.id, payload)
      } else {
        await add(payload)
      }
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await remove(id)
    setDeleteId(null)
  }

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const byType = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.income_type] = (acc[e.income_type] || 0) + Number(e.amount)
    return acc
  }, {})

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
        <Button icon={<Plus size={16} />} onClick={openAdd}>Add Income</Button>
      </div>

      {/* Summary card */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Total Income</p>
            <p className="text-3xl font-semibold font-mono" style={{ color: 'var(--success)' }}>
              {formatCurrency(total)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{entries.length} source{entries.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byType).map(([type, amount]) => (
              <div key={type} className="flex flex-col items-center px-3 py-2 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                <span className="text-xs font-medium capitalize mb-1" style={{ color: INCOME_COLORS[type] || '#94a3b8' }}>
                  {INCOME_TYPES.find(t => t.value === type)?.label || type}
                </span>
                <span className="text-sm font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Entries list */}
      <div className="card divide-y" style={{ borderColor: 'var(--border-light)' }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 flex gap-3">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/3" />
                <div className="skeleton h-3 w-1/4" />
              </div>
              <div className="skeleton h-5 w-20" />
            </div>
          ))
        ) : entries.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
              <TrendingUp size={24} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No income entries</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Add your first income source for {getMonthName(month)}</p>
            <Button className="mt-4" icon={<Plus size={14} />} onClick={openAdd} size="sm">Add Income</Button>
          </div>
        ) : (
          entries.map((entry, i) => (
            <div key={entry.id} className="flex items-center gap-3 p-4 stagger-item" style={{ animationDelay: `${i * 40}ms` }}>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${INCOME_COLORS[entry.income_type] || '#94a3b8'}18` }}
              >
                <TrendingUp size={16} style={{ color: INCOME_COLORS[entry.income_type] || '#94a3b8' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {INCOME_TYPES.find(t => t.value === entry.income_type)?.label ?? entry.income_type}
                  </p>
                  <Badge color={INCOME_COLORS[entry.income_type]}>
                    {INCOME_TYPES.find(t => t.value === entry.income_type)?.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(entry.date)}</p>
                  {entry.notes && (
                    <p className="text-xs truncate max-w-[200px]" style={{ color: 'var(--text-muted)' }}>· {entry.notes}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold font-mono" style={{ color: 'var(--success)' }}>
                  +{formatCurrency(Number(entry.amount))}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(entry)}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteId(entry.id)}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Income' : 'Add Income'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount"
              type="number"
              placeholder="0.00"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              min="0"
              step="0.01"
            />
            <Select
              label="Type"
              value={form.income_type}
              onChange={e => setForm(f => ({ ...f, income_type: e.target.value as IncomeType }))}
              options={INCOME_TYPES}
            />
          </div>
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          />
          <Input
            label="Notes (optional)"
            placeholder="Additional details..."
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              loading={saving}
              disabled={!form.amount}
            >
              {editing ? 'Save Changes' : 'Add Income'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Entry" size="sm">
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Are you sure you want to delete this income entry? This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={() => deleteId && handleDelete(deleteId)}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
