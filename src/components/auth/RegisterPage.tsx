'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Store, Loader2, Eye, EyeOff, Mail, Lock, User, CheckCircle2, ArrowRight, Shield, Zap, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

const iv = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }

function getStrength(pwd: string) {
  if (!pwd) return { score: 0, label: '', color: '' }
  let s = 0
  if (pwd.length >= 6) s++
  if (pwd.length >= 10) s++
  if (/[A-Z]/.test(pwd)) s++
  if (/[0-9]/.test(pwd)) s++
  if (/[^A-Za-z0-9]/.test(pwd)) s++
  if (s <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' }
  if (s <= 2) return { score: 2, label: 'Fair', color: 'bg-orange-500' }
  if (s <= 3) return { score: 3, label: 'Medium', color: 'bg-amber-500' }
  if (s <= 4) return { score: 4, label: 'Strong', color: 'bg-emerald-400' }
  return { score: 5, label: 'Very Strong', color: 'bg-emerald-600' }
}

export default function RegisterPage() {
  const { setView, setUser, setStore, setStores } = useAppStore()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const strength = useMemo(() => getStrength(password), [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return toast({ title: 'Passwords do not match', variant: 'destructive' })
    if (password.length < 6) return toast({ title: 'Password too short', variant: 'destructive' })
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      setUser(data.user)
      if (data.stores?.length > 0) { setStores(data.stores); setStore(data.stores[0]) }
      setView('dashboard')
      toast({ title: 'Welcome to Online Vepar!', description: 'Your account has been created.' })
    } catch (err) {
      toast({ title: 'Registration Failed', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' })
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col relative overflow-hidden bg-emerald-700 dark:bg-emerald-950">
        <div className="absolute inset-0 dot-pattern opacity-10" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl animate-orb-2" />
        <div className="absolute bottom-10 left-10 w-56 h-56 bg-emerald-300/10 rounded-full blur-3xl animate-orb-1" />
        <div className="relative z-10 flex flex-col h-full p-12">
          <button onClick={() => setView('landing')} className="flex items-center gap-2.5 group w-fit">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Online Vepar</span>
          </button>
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Start your free<br /><span className="text-emerald-200">14-day trial</span>
            </h1>
            <p className="text-emerald-100/80 text-lg mb-10">No credit card required. Launch your store in minutes.</p>
            <div className="bg-white/10 rounded-2xl p-5 border border-white/10 mb-8">
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-white">₹0</span>
                <span className="text-emerald-200/70 text-sm">/month for 14 days</span>
              </div>
              <p className="text-emerald-100/60 text-sm">Then from ₹999/mo. Cancel anytime.</p>
            </div>
            <div className="space-y-3">
              {[
                { icon: Shield, text: 'Secure & encrypted data' },
                { icon: Zap, text: '99.9% uptime guaranteed' },
                { icon: Users, text: 'Join 50,000+ merchants' },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center border border-white/10 shrink-0">
                    <item.icon className="w-4 h-4 text-emerald-200" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 overflow-y-auto">
        <motion.div className="w-full max-w-sm py-4" variants={cv} initial="hidden" animate="visible">
          <motion.button variants={iv} onClick={() => setView('landing')} className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">Online Vepar</span>
          </motion.button>

          <motion.div variants={iv} className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight mb-1">Create your account</h2>
            <p className="text-muted-foreground text-sm">Start selling online in minutes</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div variants={iv} className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="name" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} required
                  className="pl-9 h-11 rounded-xl border-border/60 focus:border-emerald-500" />
              </div>
            </motion.div>

            <motion.div variants={iv} className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required
                  className="pl-9 h-11 rounded-xl border-border/60 focus:border-emerald-500" />
              </div>
            </motion.div>

            <motion.div variants={iv} className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type={show ? 'text' : 'password'} placeholder="Min. 6 characters" value={password}
                  onChange={e => setPassword(e.target.value)} required minLength={6}
                  className="pl-9 pr-10 h-11 rounded-xl border-border/60 focus:border-emerald-500" />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="space-y-1 pt-0.5">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(l => (
                      <div key={l} className={`h-1 flex-1 rounded-full transition-all ${l <= strength.score ? strength.color : 'bg-muted'}`} />
                    ))}
                  </div>
                  <p className={`text-[11px] font-medium ${strength.score <= 2 ? 'text-red-500' : strength.score <= 3 ? 'text-amber-500' : 'text-emerald-600'}`}>
                    {strength.label}
                  </p>
                </div>
              )}
            </motion.div>

            <motion.div variants={iv} className="space-y-1.5">
              <Label htmlFor="confirm" className="text-sm font-medium">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="confirm" type="password" placeholder="Repeat your password" value={confirm}
                  onChange={e => setConfirm(e.target.value)} required
                  className="pl-9 pr-10 h-11 rounded-xl border-border/60 focus:border-emerald-500" />
                {confirm && password === confirm && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />}
              </div>
            </motion.div>

            <motion.div variants={iv} className="flex items-start gap-2">
              <Checkbox id="terms" checked={agreed} onCheckedChange={c => setAgreed(!!c)}
                className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 mt-0.5" />
              <Label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                I agree to the <span className="text-emerald-600 font-medium">Terms of Service</span> and <span className="text-emerald-600 font-medium">Privacy Policy</span>
              </Label>
            </motion.div>

            <motion.div variants={iv}>
              <Button type="submit" className="w-full h-11 btn-premium btn-glow rounded-xl font-semibold text-base" disabled={loading || !agreed}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</> : <>Create account <ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>
            </motion.div>
          </form>

          <motion.div variants={iv} className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <button onClick={() => setView('login')} className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">Sign in</button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
