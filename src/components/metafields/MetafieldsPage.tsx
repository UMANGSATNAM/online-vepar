'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Database, Plus, Trash2, Edit2, Save, X, ChevronDown, ChevronRight,
  Tag, Hash, FileText, ToggleLeft, Calendar, Link2, Code2, List, Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

type MetafieldType = 'single_line_text_field' | 'multi_line_text_field' | 'number_integer' | 'number_decimal' | 'boolean' | 'date' | 'url' | 'json' | 'list.single_line_text_field'

interface Metafield {
  id: string
  namespace: string
  key: string
  value: string
  type: MetafieldType
  description?: string
  ownerResource: string
  ownerId: string
  createdAt: string
}

const TYPE_OPTIONS: { value: MetafieldType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'single_line_text_field', label: 'Single-line text', icon: Tag },
  { value: 'multi_line_text_field', label: 'Multi-line text', icon: FileText },
  { value: 'number_integer', label: 'Integer number', icon: Hash },
  { value: 'number_decimal', label: 'Decimal number', icon: Hash },
  { value: 'boolean', label: 'True/False', icon: ToggleLeft },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'url', label: 'URL', icon: Link2 },
  { value: 'json', label: 'JSON', icon: Code2 },
  { value: 'list.single_line_text_field', label: 'List of text', icon: List },
]

const OWNER_RESOURCES = ['store', 'product', 'customer', 'order']

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  single_line_text_field: Tag,
  multi_line_text_field: FileText,
  number_integer: Hash,
  number_decimal: Hash,
  boolean: ToggleLeft,
  date: Calendar,
  url: Link2,
  json: Code2,
  'list.single_line_text_field': List,
}

export default function MetafieldsPage() {
  const { currentStore } = useAppStore()
  const { toast } = useToast()

  const [metafields, setMetafields] = useState<Metafield[]>([])
  const [loading, setLoading] = useState(true)
  const [filterResource, setFilterResource] = useState('store')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    namespace: 'custom',
    key: '',
    value: '',
    type: 'single_line_text_field' as MetafieldType,
    description: '',
    ownerResource: 'store',
  })

  const fetchMetafields = async () => {
    if (!currentStore?.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/metafields?storeId=${currentStore.id}&ownerResource=${filterResource}&ownerId=${currentStore.id}`)
      const json = await res.json()
      setMetafields(json.metafields || [])
    } catch {
      toast({ title: 'Failed to load metafields', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMetafields() }, [currentStore?.id, filterResource])

  const handleSave = async () => {
    if (!form.key || !form.namespace) {
      toast({ title: 'Namespace and key are required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `/api/metafields/${editingId}` : '/api/metafields'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          storeId: currentStore?.id,
          ownerId: currentStore?.id,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast({ title: editingId ? 'Metafield updated' : 'Metafield created' })
      setShowCreateDialog(false)
      setEditingId(null)
      resetForm()
      fetchMetafields()
    } catch {
      toast({ title: 'Failed to save metafield', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this metafield?')) return
    try {
      await fetch(`/api/metafields/${id}`, { method: 'DELETE' })
      toast({ title: 'Metafield deleted' })
      fetchMetafields()
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' })
    }
  }

  const handleEdit = (mf: Metafield) => {
    setForm({
      namespace: mf.namespace,
      key: mf.key,
      value: mf.value,
      type: mf.type,
      description: mf.description || '',
      ownerResource: mf.ownerResource,
    })
    setEditingId(mf.id)
    setShowCreateDialog(true)
  }

  const resetForm = () => {
    setForm({ namespace: 'custom', key: '', value: '', type: 'single_line_text_field', description: '', ownerResource: filterResource })
  }

  const groupedByNamespace = metafields.reduce<Record<string, Metafield[]>>((acc, mf) => {
    if (!acc[mf.namespace]) acc[mf.namespace] = []
    acc[mf.namespace].push(mf)
    return acc
  }, {})

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-violet-600" />
            Metafields
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Custom data fields — attach any structured data to products, customers, orders, or your store.
          </p>
        </div>
        <Button
          onClick={() => { resetForm(); setEditingId(null); setShowCreateDialog(true) }}
          className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Metafield
        </Button>
      </div>

      {/* Resource filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {OWNER_RESOURCES.map(r => (
          <button
            key={r}
            onClick={() => setFilterResource(r)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all border ${
              filterResource === r
                ? 'bg-violet-600 text-white border-violet-600'
                : 'border-border hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20'
            }`}
          >
            {r === 'store' ? 'Store' : r.charAt(0).toUpperCase() + r.slice(1) + 's'}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      ) : metafields.length === 0 ? (
        <Card className="border-dashed border-2 border-violet-200 dark:border-violet-800">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-violet-50 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mb-4">
              <Database className="w-8 h-8 text-violet-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No metafields yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Add custom data fields to your {filterResource}. Use them to store care instructions, author bios, recipe cards, or any structured data you need.
            </p>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true) }} className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
              <Plus className="w-4 h-4" />
              Create your first metafield
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByNamespace).map(([namespace, fields]) => (
            <Card key={namespace}>
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-mono text-violet-600 dark:text-violet-400 flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  {namespace}
                  <Badge variant="outline" className="ml-1 text-[10px]">{fields.length} field{fields.length !== 1 ? 's' : ''}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  {fields.map(mf => {
                    const TypeIcon = typeIcons[mf.type] || Tag
                    return (
                      <motion.div
                        key={mf.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:border-violet-200 dark:hover:border-violet-800 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-violet-50 dark:bg-violet-900/30 rounded-lg flex items-center justify-center shrink-0">
                            <TypeIcon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-medium">{mf.key}</span>
                              <Badge variant="outline" className="text-[10px] capitalize">
                                {mf.type.replace(/_/g, ' ').replace('list.', 'list: ')}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                              {mf.value || <span className="italic">empty</span>}
                            </p>
                            {mf.description && (
                              <p className="text-[11px] text-muted-foreground/70 mt-0.5">{mf.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(mf)}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => handleDelete(mf.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={v => { setShowCreateDialog(v); if (!v) { setEditingId(null); resetForm() } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Metafield' : 'Add Metafield'}</DialogTitle>
            <DialogDescription>
              Metafields let you store custom data. Use a namespace to group related fields.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Namespace <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="custom"
                  value={form.namespace}
                  onChange={e => setForm(f => ({ ...f, namespace: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
                  className="font-mono text-sm"
                />
                <p className="text-[10px] text-muted-foreground">e.g. custom, product_info, seo</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Key <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="care_instructions"
                  value={form.key}
                  onChange={e => setForm(f => ({ ...f, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
                  className="font-mono text-sm"
                />
                <p className="text-[10px] text-muted-foreground">e.g. author_bio, recipe_card</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as MetafieldType }))}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-sm">
                      <div className="flex items-center gap-2">
                        <opt.icon className="w-3.5 h-3.5 text-violet-500" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Value</Label>
              {form.type === 'multi_line_text_field' || form.type === 'json' ? (
                <Textarea
                  placeholder={form.type === 'json' ? '{"key": "value"}' : 'Enter value...'}
                  value={form.value}
                  onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  rows={4}
                  className={`text-sm ${form.type === 'json' ? 'font-mono' : ''}`}
                />
              ) : (
                <Input
                  type={form.type === 'number_integer' || form.type === 'number_decimal' ? 'number' : form.type === 'date' ? 'date' : 'text'}
                  placeholder="Enter value..."
                  value={form.value}
                  onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  className="text-sm"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                placeholder="Describe what this field is for..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Applies to</Label>
              <Select value={form.ownerResource} onValueChange={v => setForm(f => ({ ...f, ownerResource: v }))}>
                <SelectTrigger className="text-sm capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OWNER_RESOURCES.map(r => (
                    <SelectItem key={r} value={r} className="capitalize text-sm">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white gap-2"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingId ? 'Update' : 'Create'} Metafield
              </Button>
              <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingId(null); resetForm() }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
