'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Store, Loader2, Eye, EyeOff, Mail, Lock, ArrowRight, ShieldCheck, TrendingUp, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}

const highlights = [
  { icon: TrendingUp, text: 'Grow revenue with powerful analytics' },
  { icon: Users, text: 'Manage customers & orders in one place' },
  { icon: ShieldCheck, text: 'Enterprise-grade security & uptime' },
]

export default function LoginPage() {
  const { setView, setUser, setStore, setStores } = useAppStore()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      setUser(data.user)
      if (data.stores?.length > 0) { setStores(data.stores); setStore(data.stores[0]) }
      if (data.user.role === 'superadmin') { window.location.href = '/admin'; return }
      setView('dashboard')
      toast({ title: 'Welcome back!', description: `Signed in as ${data.user.name}` })
    } catch (error) {
      toast({ title: 'Login Failed', description: error instanceof Error ? error.message : 'Something went wrong', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col relative overflow-hidden bg-blue-600 dark:bg-blue-950">
        <div className="absolute inset-0 dot-pattern opacity-10" />
        <div className="absolute top-10 left-10 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-orb-1" />
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-teal-400/10 rounded-full blur-3xl animate-orb-2" />

        <div className="relative z-10 flex flex-col h-full p-12">
          <button onClick={() => setView('landing')} className="flex items-center gap-2.5 group w-fit">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Online Vepar</span>
          </button>

          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Welcome back to your store
            </h1>
            <p className="text-blue-100/80 text-lg mb-10">
              Sign in to manage your business, track orders, and grow your revenue.
            </p>

            <div className="space-y-4">
              {highlights.map((h, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/15 shrink-0">
                    <h.icon className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">{h.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
            <div className="flex mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-yellow-300 text-sm">★</span>
              ))}
            </div>
            <p className="text-white/90 text-sm leading-relaxed mb-4">
              &ldquo;Online Vepar doubled my revenue in 3 months. The dashboard is incredible!&rdquo;
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">PS</div>
              <div>
                <div className="text-white text-sm font-medium">Priya Sharma</div>
                <div className="text-blue-200/70 text-xs">Founder, Sharma Sarees</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <motion.div className="w-full max-w-sm" variants={containerVariants} initial="hidden" animate="visible">
          {/* Mobile logo */}
          <motion.button variants={itemVariants} onClick={() => setView('landing')} className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">Online Vepar</span>
          </motion.button>

          <motion.div variants={itemVariants} className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight mb-1">Sign in to your account</h2>
            <p className="text-muted-foreground text-sm">Enter your credentials to continue</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div variants={itemVariants} className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required
                  className="pl-9 h-11 rounded-xl border-border/60 bg-background focus:border-blue-500 transition-all" />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <button type="button" className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">Forgot password?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required
                  className="pl-9 pr-10 h-11 rounded-xl border-border/60 bg-background focus:border-blue-500 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button type="submit" className="w-full h-11 btn-premium btn-glow rounded-xl font-semibold text-base" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : <>Sign in <ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>
            </motion.div>
          </form>

          <motion.div variants={itemVariants} className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50">
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">Demo Account</p>
            <p className="text-xs text-blue-700 dark:text-blue-400">demo@onlinevepar.com / demo123</p>
            <button type="button" onClick={() => { setEmail('demo@onlinevepar.com'); setPassword('demo123') }}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 mt-1 transition-colors">
              Fill credentials →
            </button>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <button onClick={() => setView('register')} className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">Sign up free</button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
