'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Check, ShieldCheck, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Plan {
  id: string
  name: string
  price: number
  currency: string
  interval: string
  features: string
}

export default function BillingSettings() {
  const { currentStore, currentUser } = useAppStore()
  const { toast } = useToast()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  
  // Basic Razorpay script loading
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  useEffect(() => {
    fetch('/api/admin/plans').then(r => r.json()).then(d => setPlans(d.plans || []))
  }, [])

  const handleSubscribe = async (plan: Plan) => {
    if (!currentStore || !currentUser) return
    setLoading(true)
    try {
      // 1. Create order
      const res = await fetch('/api/subscriptions/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, storeId: currentStore.id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to initialize payment')

      // 2. Open Razorpay Checkout
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Online Vepar',
        description: `${plan.name} for ${data.storeName}`,
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            // 3. Verify Payment
            const verifyRes = await fetch('/api/subscriptions/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...response,
                planId: plan.id,
                storeId: currentStore.id
              })
            })
            if (!verifyRes.ok) throw new Error('Verification failed')
            
            toast({ title: 'Success!', description: 'Your subscription is now active.' })
            // Reload page to refresh store state
            window.location.reload()
          } catch (e: any) {
            toast({ title: 'Payment Error', description: e.message, variant: 'destructive' })
          }
        },
        prefill: {
          name: currentUser.name,
          email: currentUser.email,
        },
        theme: {
          color: '#10b981'
        }
      }
      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (response: any) {
        toast({ title: 'Payment Failed', description: response.error.description, variant: 'destructive' })
      })
      rzp.open()
      
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  if (!currentStore) return null

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Plan</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your subscription and payment methods</p>
      </div>

      <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-blue-800 dark:text-blue-300">Current Status</CardTitle>
              <CardDescription>
                {currentStore.isActive ? 'Your store is active and publicly accessible.' : 'Your store is currently inactive.'}
              </CardDescription>
            </div>
            <Badge variant={currentStore.isActive ? 'default' : 'destructive'} className={currentStore.isActive ? 'bg-blue-500' : ''}>
              {currentStore.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Badge>
          </div>
        </CardHeader>
        {!currentStore.isActive && (
          <CardContent>
            <div className="flex items-start gap-3 bg-white dark:bg-card p-4 rounded-lg border">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm">
                <strong>Action Required:</strong> Your store is not accessible to customers. Please subscribe to a plan below to activate your storefront, connect custom domains, and start selling.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map(plan => {
            const features = JSON.parse(plan.features || '[]') as string[]
            return (
              <Card key={plan.id} className="flex flex-col relative overflow-hidden">
                {plan.name.toLowerCase().includes('pro') && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider rounded-bl-lg">
                    Recommended
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="mt-4 flex items-baseline text-4xl font-extrabold">
                    {plan.currency === 'INR' ? '₹' : '$'}{plan.price}
                    <span className="ml-1 text-xl font-medium text-muted-foreground">/{plan.interval}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm">
                    {features.length > 0 ? features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    )) : (
                      <>
                        <li className="flex items-start gap-2"><Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /><span>Unlimited Products</span></li>
                        <li className="flex items-start gap-2"><Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /><span>Custom Domain</span></li>
                        <li className="flex items-start gap-2"><Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /><span>0% Transaction Fee</span></li>
                      </>
                    )}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={plan.name.toLowerCase().includes('pro') ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(plan)}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : `Subscribe to ${plan.name}`}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-8">
        <ShieldCheck className="w-4 h-4" /> Secure payments powered by Razorpay
      </div>
    </div>
  )
}
