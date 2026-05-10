'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Store, Building2, CreditCard, Paintbrush, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

const steps = [
  { id: 'business', title: 'Business Profile', icon: Building2 },
  { id: 'kyc', title: 'KYC & Verification', icon: CreditCard },
  { id: 'store', title: 'Store Setup', icon: Paintbrush },
]

export default function OnboardingWizard() {
  const { currentStore, setStore } = useAppStore()
  const { toast } = useToast()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState({
    businessType: '',
    businessCategory: '',
    annualTurnoverBand: '',
    skusBand: '',
    panNumber: '',
    gstin: '',
    bankAccountNumber: '',
    bankIfsc: '',
    theme: 'modern',
    currency: 'INR'
  })

  const updateForm = (key: string, value: string) => setFormData(prev => ({ ...prev, [key]: value }))

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(s => s + 1)
  }

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1)
  }

  const handleSubmit = async () => {
    if (!currentStore) return
    setLoading(true)
    try {
      // In a real app, you'd have an endpoint to process onboarding. We'll use a hypothetical one.
      const res = await fetch(`/api/stores/${currentStore.id}/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error('Failed to save onboarding data')
      
      const updatedStore = await res.json()
      setStore(updatedStore.store)
      toast({ title: 'Welcome aboard!', description: 'Your store is ready to go live.' })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card w-full max-w-3xl rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col md:flex-row h-[600px]"
      >
        {/* Left Sidebar - Progress */}
        <div className="w-full md:w-64 bg-muted/30 border-r border-border p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Online Vepar</span>
          </div>

          <div className="space-y-6 flex-1">
            {steps.map((step, i) => {
              const active = i === currentStep
              const completed = i < currentStep
              return (
                <div key={step.id} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                    active ? 'border-emerald-600 text-emerald-600 bg-emerald-50' : 
                    completed ? 'border-emerald-600 bg-emerald-600 text-white' : 
                    'border-muted-foreground/30 text-muted-foreground'
                  }`}>
                    {completed ? <CheckCircle2 className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                  </div>
                  <div className={`pt-1.5 font-medium text-sm ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.title}
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="text-xs text-muted-foreground">
            Complete setup to launch your store
          </div>
        </div>

        {/* Right Area - Form Content */}
        <div className="flex-1 flex flex-col bg-card relative">
          <div className="flex-1 overflow-y-auto p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Step 1: Business Profile */}
                {currentStep === 0 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold">Business Profile</h2>
                      <p className="text-muted-foreground">Tell us about your business entity and scale.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label>Business Type</Label>
                        <Select value={formData.businessType} onValueChange={(v) => updateForm('businessType', v)}>
                          <SelectTrigger><SelectValue placeholder="Select Business Type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                            <SelectItem value="partnership">Partnership</SelectItem>
                            <SelectItem value="llp">LLP</SelectItem>
                            <SelectItem value="pvt_ltd">Private Limited</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Business Category</Label>
                        <Select value={formData.businessCategory} onValueChange={(v) => updateForm('businessCategory', v)}>
                          <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fashion">Fashion & Apparel</SelectItem>
                            <SelectItem value="electronics">Electronics</SelectItem>
                            <SelectItem value="fnb">Food & Beverages</SelectItem>
                            <SelectItem value="beauty">Beauty & Cosmetics</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Annual Turnover</Label>
                          <Select value={formData.annualTurnoverBand} onValueChange={(v) => updateForm('annualTurnoverBand', v)}>
                            <SelectTrigger><SelectValue placeholder="Select Band" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="under_40l">Under ₹40 Lakhs</SelectItem>
                              <SelectItem value="40l_1.5cr">₹40L - ₹1.5 Cr</SelectItem>
                              <SelectItem value="above_1.5cr">Above ₹1.5 Cr</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Catalog Size</Label>
                          <Select value={formData.skusBand} onValueChange={(v) => updateForm('skusBand', v)}>
                            <SelectTrigger><SelectValue placeholder="Select SKUs" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1_50">1 - 50 SKUs</SelectItem>
                              <SelectItem value="51_500">51 - 500 SKUs</SelectItem>
                              <SelectItem value="500_plus">500+ SKUs</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: KYC */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold">KYC & Verification</h2>
                      <p className="text-muted-foreground">Required for receiving payouts securely.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>PAN Number</Label>
                          <Input placeholder="ABCDE1234F" value={formData.panNumber} onChange={(e) => updateForm('panNumber', e.target.value.toUpperCase())} maxLength={10} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>GSTIN (Optional if under ₹40L)</Label>
                          <Input placeholder="22AAAAA0000A1Z5" value={formData.gstin} onChange={(e) => updateForm('gstin', e.target.value.toUpperCase())} maxLength={15} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Bank Account Number</Label>
                        <Input type="password" placeholder="Account Number" value={formData.bankAccountNumber} onChange={(e) => updateForm('bankAccountNumber', e.target.value)} />
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label>IFSC Code</Label>
                        <Input placeholder="SBIN0001234" value={formData.bankIfsc} onChange={(e) => updateForm('bankIfsc', e.target.value.toUpperCase())} maxLength={11} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Store Setup */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold">Store Setup</h2>
                      <p className="text-muted-foreground">Personalize how your store looks to customers.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label>Starter Theme</Label>
                        <Select value={formData.theme} onValueChange={(v) => updateForm('theme', v)}>
                          <SelectTrigger><SelectValue placeholder="Select Theme" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="modern">Modern (Default)</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                            <SelectItem value="bold">Bold & Dark</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Currency</Label>
                        <Input value="INR - Indian Rupee" disabled className="bg-muted" />
                        <p className="text-xs text-muted-foreground mt-1">Multi-currency available in paid plans.</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Controls */}
          <div className="p-6 border-t border-border bg-muted/10 flex items-center justify-between">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</> : <>Complete Setup <CheckCircle2 className="w-4 h-4 ml-2" /></>}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
