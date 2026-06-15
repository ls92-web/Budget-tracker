'use client'

import { useState } from 'react'
import { useSavings } from '@/hooks/useSavings'
import { SavingsGoal } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Plus, Edit2, Trash2, Target, Minus } from 'lucide-react'

const GOAL_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#14b8a6', '#ec4899', '#f97316', '#22c55e', '#06b6d4',
]

interface GoalFormData {
  name: string
  target_amount: string
  current_amount: string
  target_date: string
  description: string
  color: string
}

const DEFAULT_FORM: GoalFormData = {
  name: '',
  target_amount: '',
  current_amount: '0',
  target_date: '',
  description: '',
  color: '#6366f1',
}

export default function SavingsPage() {
  const { goals, loading, add, update, remove } = useSavings()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SavingsGoal | null>(null)
  const [form, setForm] = useState<GoalFormData>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositMode, setDepositMode] = useState<'add' | 'subtract'>('add')

  const openAdd = () => {
    setEditing(null)
    setForm(DEFAULT_FORM)
    setModalOpen(true)
  }

  const openEdit = (g: SavingsGoal) => {
    setEditing(g)
    setForm({
      name: g.name,
      target_amount: String(g.target_amount),
      current_amount: String(g.current_amount),
      target_date: g.target_date || '',
      description: g.description || '',
      color: g.color,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.target_amount) return
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        target_amount: parseFloat(form.target_amount),
        current_amount: parseFloat(form.current_amount) || 0,
        target_date: form.target_date || undefined,
        description: form.description || undefined,
        color: form.color,
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

  const handleDeposit = async () => {
    if (!depositGoal || !depositAmount) return
    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount <= 0) return
    const delta = depositMode === 'add' ? amount : -amount
    const newAmount = Math.max(0, Number(depositGoal.current_amount) + delta)
    await update(depositGoal.id, { current_amount: newAmount })
    setDepositGoal(null)
    setDepositAmount('')
  }

  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0)
  const totalSaved = goals.reduce((s, g) => s + Number(g.current_amount), 0)
  const completed = goals.filter(g => Number(g.current_amount) >= Number(g.target_amount))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {goals.length} goal{goals.length !== 1 ? 's' : ''} · {completed.length} completed
          </p>
        </div>
        <Button icon={<Plus size={16} />} onClick={openAdd}>New Goal</Button>
      </div>

      {/* Summary */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Target', value: formatCurrency(totalTarget), color: 'var(--accent)' },
            { label: 'Total Saved', value: formatCurrency(totalSaved), color: 'var(--success)' },
            { label: 'Remaining', value: formatCurrency(Math.max(0, totalTarget - totalSaved)), color: 'var(--warning)' },
          ].map(item => (
            <div key={item.label} className="card p-4">
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
              <p className="text-xl font-semibold font-mono" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Goals grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card p-5 h-48 skeleton" />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="card py-20 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
            <Target size={28} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>No savings goals yet</p>
          <p className="text-sm mt-2 max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
            Create a savings goal to track your progress toward financial milestones
          </p>
          <Button className="mt-5" icon={<Plus size={14} />} onClick={openAdd}>Create Your First Goal</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {goals.map((goal, i) => {
            const pct = Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100)
            const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount))
            const isComplete = pct >= 100

            // Days remaining
            let daysLeft: number | null = null
            if (goal.target_date) {
              const diff = new Date(goal.target_date).getTime() - Date.now()
              daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))
            }

            return (
              <div key={goal.id} className="card p-5 stagger-item" style={{ animationDelay: `${i * 70}ms` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${goal.color}18` }}>
                      <Target size={18} style={{ color: goal.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{goal.name}</p>
                      {goal.description && (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{goal.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setDepositGoal(goal); setDepositAmount(''); setDepositMode('add') }}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                      style={{ color: goal.color }}>
                      <Plus size={14} />
                    </button>
                    <button onClick={() => openEdit(goal)} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors" style={{ color: 'var(--text-muted)' }}>
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setDeleteId(goal.id)} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors" style={{ color: 'var(--text-muted)' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Amount display */}
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="text-2xl font-semibold font-mono" style={{ color: goal.color }}>
                      {formatCurrency(Number(goal.current_amount))}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      of {formatCurrency(Number(goal.target_amount))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold font-mono" style={{ color: isComplete ? 'var(--success)' : 'var(--text-primary)' }}>
                      {pct.toFixed(0)}%
                    </p>
                    {isComplete && (
                      <p className="text-xs font-medium" style={{ color: 'var(--success)' }}>Complete</p>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-3 rounded-full overflow-hidden mb-3" style={{ background: 'var(--bg-tertiary)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: isComplete ? 'var(--success)' : goal.color }}
                  />
                </div>

                {/* Footer info */}
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>{isComplete ? 'Goal achieved!' : `${formatCurrency(remaining)} to go`}</span>
                  {daysLeft !== null && (
                    <span style={{ color: daysLeft < 30 ? 'var(--warning)' : 'var(--text-muted)' }}>
                      {daysLeft > 0 ? `${daysLeft}d left` : 'Past due'}
                    </span>
                  )}
                  {goal.target_date && <span>{formatDate(goal.target_date)}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Goal form modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Goal' : 'New Savings Goal'}>
        <div className="space-y-4">
          <Input
            label="Goal Name"
            placeholder="e.g. Emergency Fund, Vacation, New Car"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Target Amount"
              type="number"
              placeholder="0.00"
              value={form.target_amount}
              onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))}
              min="0"
              step="0.01"
            />
            <Input
              label="Current Saved"
              type="number"
              placeholder="0.00"
              value={form.current_amount}
              onChange={e => setForm(f => ({ ...f, current_amount: e.target.value }))}
              min="0"
              step="0.01"
            />
          </div>
          <Input
            label="Target Date (optional)"
            type="date"
            value={form.target_date}
            onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))}
          />
          <Input
            label="Description (optional)"
            placeholder="What are you saving for?"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>Color</label>
            <div className="flex gap-2 flex-wrap">
              {GOAL_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: c,
                    outline: form.color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} loading={saving} disabled={!form.name || !form.target_amount}>
              {editing ? 'Save Changes' : 'Create Goal'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Deposit modal */}
      <Modal open={!!depositGoal} onClose={() => setDepositGoal(null)} title="Update Progress" size="sm">
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['add', 'subtract'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setDepositMode(mode)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: depositMode === mode ? (mode === 'add' ? 'var(--success)' : 'var(--danger)') + '20' : 'var(--bg-tertiary)',
                  color: depositMode === mode ? (mode === 'add' ? 'var(--success)' : 'var(--danger)') : 'var(--text-secondary)',
                  border: `1px solid ${depositMode === mode ? (mode === 'add' ? 'var(--success)' : 'var(--danger)') + '40' : 'transparent'}`,
                }}
              >
                {mode === 'add' ? <Plus size={14} /> : <Minus size={14} />}
                {mode === 'add' ? 'Add Funds' : 'Withdraw'}
              </button>
            ))}
          </div>
          <Input
            label="Amount"
            type="number"
            placeholder="0.00"
            value={depositAmount}
            onChange={e => setDepositAmount(e.target.value)}
            min="0"
            step="0.01"
          />
          {depositGoal && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Current: {formatCurrency(Number(depositGoal.current_amount))} of {formatCurrency(Number(depositGoal.target_amount))}
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setDepositGoal(null)}>Cancel</Button>
            <Button className="flex-1" onClick={handleDeposit} disabled={!depositAmount}>Update</Button>
          </div>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Goal" size="sm">
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Are you sure you want to delete this savings goal?
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={() => deleteId && remove(deleteId).then(() => setDeleteId(null))}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
