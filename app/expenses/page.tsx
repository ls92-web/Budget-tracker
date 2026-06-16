'use client'

import { useState } from 'react'
import { useExpenses } from '@/hooks/useExpenses'
import { ExpenseEntry, Category, PaymentMethod, RecurringInterval } from '@/lib/types'
import {
  formatCurrency, formatDate, CATEGORIES, PAYMENT_METHODS, RECURRING_INTERVALS,
  CATEGORY_COLORS, getCurrentMonth, getCurrentYear, getMonthName, autoCategorize
} from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import CategoryIcon from '@/components/ui/CategoryIcon'
import { Plus, Edit2, Trash2, CreditCard, ChevronLeft, ChevronRight, RefreshCw, Search, Paperclip, X, ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ExpenseFormData {
  amount: string
  category: Category
  merchant: string
  payment_method: PaymentMethod
  date: string
  notes: string
  is_recurring: boolean
  recurring_interval: RecurringInterval
  receipt_image_url: string
}

const DEFAULT_FORM: ExpenseFormData = {
  amount: '',
  category: 'Miscellaneous',
  merchant: '',
  payment_method: 'credit_card',
  date: new Date().toISOString().split('T')[0],
  notes: '',
  is_recurring: false,
  recurring_interval: 'monthly',
  receipt_image_url: '',
}

export default function ExpensesPage() {
  const [month, setMonth] = useState(getCurrentMonth())
  const [year, setYear] = useState(getCurrentYear())
  const { entries, loading, total, add, update, remove, categoryData } = useExpenses(month, year)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ExpenseEntry | null>(null)
  const [form, setForm] = useState<ExpenseFormData>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const openAdd = () => {
    setEditing(null)
    setForm(DEFAULT_FORM)
    setReceiptFile(null)
    setReceiptPreview(null)
    setModalOpen(true)
  }

  const openEdit = (entry: ExpenseEntry) => {
    setEditing(entry)
    setForm({
      amount: String(entry.amount),
      category: entry.category,
      merchant: entry.merchant || '',
      payment_method: entry.payment_method,
      date: entry.date,
      notes: entry.notes || '',
      is_recurring: entry.is_recurring,
      recurring_interval: entry.recurring_interval || 'monthly',
      receipt_image_url: entry.receipt_image_url || '',
    })
    setReceiptFile(null)
    setReceiptPreview(entry.receipt_image_url || null)
    setModalOpen(true)
  }

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setReceiptFile(file)
    if (file.type.startsWith('image/')) {
      setReceiptPreview(URL.createObjectURL(file))
    } else {
      setReceiptPreview(null)
    }
  }

  const clearReceipt = () => {
    setReceiptFile(null)
    setReceiptPreview(null)
    setForm(f => ({ ...f, receipt_image_url: '' }))
  }

  const handleMerchantChange = (val: string) => {
    setForm(f => ({
      ...f,
      merchant: val,
      category: autoCategorize(val) as Category,
    }))
  }

  const handleSave = async () => {
    if (!form.amount) return
    setSaving(true)
    try {
      let receiptUrl = form.receipt_image_url || undefined

      // Upload new receipt file if selected
      if (receiptFile) {
        const ext = receiptFile.name.split('.').pop()
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('receipt-attach')
          .upload(path, receiptFile, { upsert: false })
        if (!uploadError) {
          const { data } = supabase.storage.from('receipt-attach').getPublicUrl(path)
          receiptUrl = data.publicUrl
        }
      }

      const payload = {
        amount: parseFloat(form.amount),
        category: form.category,
        merchant: form.merchant || undefined,
        payment_method: form.payment_method,
        date: form.date,
        notes: form.notes || undefined,
        is_recurring: form.is_recurring,
        recurring_interval: form.is_recurring ? form.recurring_interval : undefined,
        receipt_image_url: receiptUrl,
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

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const filtered = entries.filter(e => {
    const matchSearch = !search ||
      e.merchant?.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      e.notes?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = filterCategory === 'all' || e.category === filterCategory
    return matchSearch && matchCategory
  })

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
        <Button icon={<Plus size={16} />} onClick={openAdd}>Add Expense</Button>
      </div>

      {/* Summary */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex-shrink-0">
            <p className="text-xs uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Total Spent</p>
            <p className="text-3xl font-semibold font-mono" style={{ color: 'var(--danger)' }}>
              {formatCurrency(total)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{entries.length} transaction{entries.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex-1 flex flex-wrap gap-2">
            {categoryData.slice(0, 4).map(cat => (
              <button
                key={cat.category}
                onClick={() => setFilterCategory(f => f === cat.category ? 'all' : cat.category)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all"
                style={{
                  background: filterCategory === cat.category ? `${cat.color}20` : 'var(--bg-tertiary)',
                  color: filterCategory === cat.category ? cat.color : 'var(--text-secondary)',
                  border: `1px solid ${filterCategory === cat.category ? cat.color + '40' : 'transparent'}`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />
                {cat.category}
                <span className="font-semibold">{formatCurrency(cat.amount)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="card divide-y" style={{ borderColor: 'var(--border-light)' }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 flex gap-3">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/3" />
                <div className="skeleton h-3 w-1/4" />
              </div>
              <div className="skeleton h-5 w-20" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
              <CreditCard size={24} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {search || filterCategory !== 'all' ? 'No matching transactions' : 'No expenses yet'}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {search || filterCategory !== 'all' ? 'Try adjusting your filters' : `Start tracking expenses for ${getMonthName(month)}`}
            </p>
            {!search && filterCategory === 'all' && (
              <Button className="mt-4" icon={<Plus size={14} />} onClick={openAdd} size="sm">Add Expense</Button>
            )}
          </div>
        ) : (
          filtered.map((entry, i) => {
            const color = CATEGORY_COLORS[entry.category as Category] || '#94a3b8'
            return (
              <div key={entry.id} className="flex items-center gap-3 p-4 stagger-item" style={{ animationDelay: `${i * 30}ms` }}>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}18`, color }}
                >
                  <CategoryIcon category={entry.category} size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {entry.merchant || entry.category}
                    </p>
                    {entry.is_recurring && (
                      <RefreshCw size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={color}>{entry.category}</Badge>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(entry.date)}</span>
                    <span className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                      {PAYMENT_METHODS.find(p => p.value === entry.payment_method)?.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {entry.receipt_image_url && (
                    <a
                      href={entry.receipt_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View receipt"
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                      style={{ color: 'var(--accent)' }}
                    >
                      <Paperclip size={13} />
                    </a>
                  )}
                  <span className="text-base font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
                    -{formatCurrency(Number(entry.amount))}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(entry)} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors" style={{ color: 'var(--text-muted)' }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteId(entry.id)} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors" style={{ color: 'var(--text-muted)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Expense' : 'Add Expense'} size="lg">
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
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>
          <Input
            label="Merchant / Description"
            placeholder="e.g. Starbucks, Amazon, Netflix"
            value={form.merchant}
            onChange={e => handleMerchantChange(e.target.value)}
            hint="Category will be suggested automatically"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
              options={CATEGORIES.map(c => ({ value: c, label: c }))}
            />
            <Select
              label="Payment Method"
              value={form.payment_method}
              onChange={e => setForm(f => ({ ...f, payment_method: e.target.value as PaymentMethod }))}
              options={PAYMENT_METHODS}
            />
          </div>
          <Input
            label="Notes (optional)"
            placeholder="Additional details..."
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />

          {/* Receipt upload */}
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Receipt (optional)</p>
            {receiptPreview ? (
              <div className="relative inline-flex items-center gap-3 p-3 rounded-xl border" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)' }}>
                {receiptPreview.startsWith('blob:') || receiptPreview.match(/\.(jpg|jpeg|png|webp|heic)/i) ? (
                  <img src={receiptPreview} alt="Receipt" className="w-16 h-16 object-cover rounded-lg" />
                ) : (
                  <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
                    <ImageIcon size={24} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {receiptFile ? receiptFile.name : 'Existing receipt'}
                  </p>
                  {receiptFile && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {(receiptFile.size / 1024).toFixed(0)} KB
                    </p>
                  )}
                </div>
                <button onClick={clearReceipt} className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:border-pink-300"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                <Paperclip size={15} />
                <span className="text-sm">Attach receipt image or PDF</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                  className="hidden"
                  onChange={handleReceiptChange}
                />
              </label>
            )}
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_recurring}
                onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))}
                className="w-4 h-4 rounded"
                style={{ accentColor: 'var(--accent)' }}
              />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Recurring transaction</span>
            </label>
            {form.is_recurring && (
              <div className="mt-2">
                <Select
                  value={form.recurring_interval}
                  onChange={e => setForm(f => ({ ...f, recurring_interval: e.target.value as RecurringInterval }))}
                  options={RECURRING_INTERVALS}
                />
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} loading={saving} disabled={!form.amount}>
              {editing ? 'Save Changes' : 'Add Expense'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Expense" size="sm">
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Are you sure you want to delete this expense? This cannot be undone.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={() => deleteId && remove(deleteId).then(() => setDeleteId(null))}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
