'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, DollarSign, Package,
  ShoppingCart, Truck, Megaphone, Plus, MoreHorizontal,
  Trash2, CreditCard, Receipt, Wallet, BarChart3,
  Calendar, FileText, FileSpreadsheet
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

interface HisabOverview {
  totalRevenue: number
  totalShippingCollected: number
  totalTaxCollected: number
  totalCOGS: number
  expenses: {
    marketing: number
    shippingPaid: number
    misc: number
    total: number
  }
  profitability: {
    grossProfit: number
    netProfit: number
    margin: number
    roi: number
  }
}

interface Expense {
  id: string
  category: string
  name: string
  amount: number
  date: string
  notes?: string
}

function formatPrice(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export default function FinancePage() {
  const { currentStore } = useAppStore()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<HisabOverview | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  
  const [dateRange, setDateRange] = useState('30d')
  const [expenseFilter, setExpenseFilter] = useState('all')

  const [showAddExpense, setShowAddExpense] = useState(false)
  const [addingExpense, setAddingExpense] = useState(false)
  const [newExpense, setNewExpense] = useState({
    category: 'marketing',
    name: '',
    amount: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  })

  const fetchFinanceData = useCallback(async () => {
    if (!currentStore?.id) return
    setLoading(true)
    try {
      // Fetch overview
      const resOverview = await fetch(`/api/finance/overview?storeId=${currentStore.id}&dateRange=${dateRange}`)
      if (resOverview.ok) {
        const data = await resOverview.json()
        setOverview(data.overview)
      }

      // Fetch expenses
      const resExpenses = await fetch(`/api/finance/expenses?storeId=${currentStore.id}&category=${expenseFilter}`)
      if (resExpenses.ok) {
        const data = await resExpenses.json()
        setExpenses(data.expenses)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch financial data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [currentStore?.id, dateRange, expenseFilter, toast])

  useEffect(() => {
    fetchFinanceData()
  }, [fetchFinanceData])

  const handleAddExpense = async () => {
    if (!currentStore?.id) return
    if (!newExpense.name || !newExpense.amount) {
      toast({ title: 'Error', description: 'Name and amount are required', variant: 'destructive' })
      return
    }

    setAddingExpense(true)
    try {
      const res = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: currentStore.id,
          ...newExpense,
          amount: parseFloat(newExpense.amount)
        })
      })

      if (!res.ok) throw new Error('Failed to add expense')
      
      toast({ title: 'Success', description: 'Expense recorded successfully' })
      setShowAddExpense(false)
      setNewExpense({
        category: 'marketing',
        name: '',
        amount: '',
        notes: '',
        date: new Date().toISOString().split('T')[0]
      })
      fetchFinanceData()
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to add expense', variant: 'destructive' })
    } finally {
      setAddingExpense(false)
    }
  }

  if (loading && !overview) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hisab & Finances</h1>
          <p className="text-muted-foreground mt-1">Master Profit & Loss tracking for your business</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowAddExpense(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-t-4 border-t-blue-500">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <Badge variant={overview.profitability.netProfit >= 0 ? "default" : "destructive"} className="font-semibold">
                  {overview.profitability.margin}% Margin
                </Badge>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
              <h3 className={`text-2xl sm:text-3xl font-bold mt-1 ${overview.profitability.netProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatPrice(overview.profitability.netProfit)}
              </h3>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <h3 className="text-2xl sm:text-3xl font-bold mt-1 text-foreground">
                {formatPrice(overview.totalRevenue)}
              </h3>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
              <h3 className="text-2xl sm:text-3xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                {formatPrice(overview.expenses.total)}
              </h3>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Cost of Goods (COGS)</p>
              <h3 className="text-2xl sm:text-3xl font-bold mt-1 text-purple-600 dark:text-purple-400">
                {formatPrice(overview.totalCOGS)}
              </h3>
            </CardContent>
          </Card>
        </div>
      )}

      {/* P&L Statement */}
      {overview && (
        <Card className="card-premium">
          <CardHeader className="p-4 sm:p-6 pb-2 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              Income Statement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenue Breakdown */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground/80 border-b pb-2">Revenue</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Product Sales (Paid Orders)</span>
                    <span className="font-medium">{formatPrice(overview.totalRevenue - overview.totalShippingCollected - overview.totalTaxCollected)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Shipping Collected</span>
                    <span className="font-medium">{formatPrice(overview.totalShippingCollected)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tax Collected</span>
                    <span className="font-medium">{formatPrice(overview.totalTaxCollected)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t font-semibold">
                    <span>Total Gross Revenue</span>
                    <span className="text-blue-600">{formatPrice(overview.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-4 text-muted-foreground">
                    <span>Less: Cost of Goods (COGS)</span>
                    <span className="text-red-500">-{formatPrice(overview.totalCOGS)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t font-semibold">
                    <span>Gross Profit</span>
                    <span>{formatPrice(overview.profitability.grossProfit)}</span>
                  </div>
                </div>
              </div>

              {/* Expenses Breakdown */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground/80 border-b pb-2">Expenses</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2"><Megaphone className="w-3 h-3"/> Marketing (Ads, etc.)</span>
                    <span className="font-medium">{formatPrice(overview.expenses.marketing)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2"><Truck className="w-3 h-3"/> Shipping / Freight Paid</span>
                    <span className="font-medium">{formatPrice(overview.expenses.shippingPaid)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2"><Receipt className="w-3 h-3"/> Misc Expenses</span>
                    <span className="font-medium">{formatPrice(overview.expenses.misc)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t font-semibold">
                    <span>Total Expenses</span>
                    <span className="text-amber-600">{formatPrice(overview.expenses.total)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`p-4 rounded-xl border ${overview.profitability.netProfit >= 0 ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50' : 'bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50'} flex justify-between items-center mt-6`}>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Operating Income</p>
                <div className="flex items-center gap-3 mt-1">
                  <h2 className={`text-2xl font-bold ${overview.profitability.netProfit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'}`}>
                    {formatPrice(overview.profitability.netProfit)}
                  </h2>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Return on Ad Spend (ROAS/ROI)</p>
                <Badge variant={overview.profitability.roi >= 100 ? "default" : "secondary"}>
                  {overview.profitability.roi}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses Ledger */}
      <Card className="card-premium">
        <CardHeader className="p-4 sm:p-6 pb-2 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg">Expense Ledger</CardTitle>
          <Tabs value={expenseFilter} onValueChange={setExpenseFilter}>
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="marketing" className="text-xs">Marketing</TabsTrigger>
              <TabsTrigger value="shipping" className="text-xs">Shipping</TabsTrigger>
              <TabsTrigger value="misc" className="text-xs">Misc</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No expenses recorded for this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map(exp => (
                    <TableRow key={exp.id}>
                      <TableCell className="text-muted-foreground">{new Date(exp.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {exp.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{exp.name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">{exp.notes || '-'}</TableCell>
                      <TableCell className="text-right font-medium text-amber-600 dark:text-amber-400">
                        {formatPrice(exp.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Record a new business expense manually.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={newExpense.date} onChange={(e) => setNewExpense({...newExpense, date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={newExpense.category} onValueChange={(v) => setNewExpense({...newExpense, category: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketing">Marketing (Meta, Google Ads)</SelectItem>
                  <SelectItem value="shipping">Shipping (Couriers, Freight)</SelectItem>
                  <SelectItem value="software">Software & Subscriptions</SelectItem>
                  <SelectItem value="misc">Miscellaneous</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description / Name</Label>
              <Input placeholder="e.g. Meta Ads June 2025" value={newExpense.name} onChange={(e) => setNewExpense({...newExpense, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" placeholder="0.00" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input placeholder="Additional details..." value={newExpense.notes} onChange={(e) => setNewExpense({...newExpense, notes: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setShowAddExpense(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" disabled={addingExpense} onClick={handleAddExpense}>
              {addingExpense ? 'Saving...' : 'Save Expense'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
