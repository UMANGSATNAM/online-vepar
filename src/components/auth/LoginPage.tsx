'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Store, Loader2, Eye, EyeOff, Mail, Lock, CheckCircle2, ArrowRight, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

// Staggered animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function LoginPage() {
  const { setView, setUser, setStore, setStores } = useAppStore()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
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

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      setUser(data.user)
      if (data.stores && data.stores.length > 0) {
        setStores(data.stores)
        setStore(data.stores[0])
      }
      setView('dashboard')
      toast({
        title: 'Welcome back!',
        description: `Signed in as ${data.user.name}`,
      })
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = () => {
    setEmail('demo@onlinevepar.com')
    setPassword('demo123')
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* ===== Left Decorative Panel ===== */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 dark:from-emerald-800 dark:via-emerald-900 dark:to-emerald-950">
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl animate-orb-1" />
        <div className="absolute bottom-32 right-10 w-56 h-56 bg-teal-300/15 rounded-full blur-3xl animate-orb-2" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-cyan-300/10 rounded-full blur-2xl animate-orb-3" />

        {/* Dot pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 py-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Brand */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                <Store className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-white tracking-tight">Online Vepar</span>
            </div>

            {/* Tagline */}
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Build your online<br />
              store in <span className="bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200 bg-clip-text text-transparent">minutes</span>
            </h1>
            <p className="text-emerald-100/80 text-lg mb-12 max-w-md">
              The all-in-one platform to create, manage, and grow your e-commerce business. No coding required.
            </p>

            {/* Feature highlights */}
            <div className="space-y-4 mb-14">
              {[
                { label: 'Products', desc: 'Add & manage unlimited products' },
                { label: 'Orders', desc: 'Track orders & shipments in real-time' },
                { label: 'Analytics', desc: 'Insights to grow your revenue' },
              ].map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.12 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10 flex-shrink-0">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-200" />
                  </div>
                  <div>
                    <span className="text-white font-semibold text-sm">{feature.label}</span>
                    <span className="text-emerald-200/70 text-sm ml-2">{feature.desc}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 max-w-md">
              <Quote className="w-8 h-8 text-emerald-300/40 absolute top-4 left-4" />
              <p className="text-white/90 text-sm leading-relaxed pl-8 mb-4">
                &ldquo;Online Vepar helped me launch my store in under 30 minutes. The dashboard is intuitive and the analytics are incredibly useful.&rdquo;
              </p>
              <div className="flex items-center gap-3 pl-8">
                <div className="w-8 h-8 rounded-full bg-emerald-400/30 flex items-center justify-center text-xs font-bold text-white">
                  RS
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Rahul Sharma</p>
                  <p className="text-emerald-200/60 text-xs">Founder, Sharma Textiles</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ===== Right Login Form Panel ===== */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <motion.div
          className="w-full max-w-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo (mobile/tablet) */}
          <motion.div variants={itemVariants} className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-emerald-900 dark:text-emerald-300">Online Vepar</span>
          </motion.div>

          <Card className="border-emerald-100 dark:border-emerald-900/50 shadow-xl shadow-emerald-100/30 dark:shadow-emerald-950/30 rounded-2xl">
            <CardContent className="p-6 sm:p-8">
              {/* Header */}
              <motion.div variants={itemVariants} className="text-center mb-6">
                <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-100">Welcome back</h2>
                <p className="text-muted-foreground text-sm mt-1">Sign in to your Online Vepar account</p>
              </motion.div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="email" className="text-emerald-800 dark:text-emerald-300 text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 dark:text-emerald-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 border-emerald-200 dark:border-emerald-800/50 focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-900/50 transition-all duration-200"
                    />
                  </div>
                </motion.div>

                {/* Password */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="password" className="text-emerald-800 dark:text-emerald-300 text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 dark:text-emerald-500" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 pr-10 border-emerald-200 dark:border-emerald-800/50 focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-900/50 transition-all duration-200"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-emerald-400 dark:text-emerald-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-emerald-400 dark:text-emerald-500" />
                      )}
                    </Button>
                  </div>
                </motion.div>

                {/* Remember me & Forgot password */}
                <motion.div variants={itemVariants} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(!!checked)}
                      className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">Remember me</Label>
                  </div>
                  <Button variant="link" className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 p-0 h-auto font-medium">
                    Forgot password?
                  </Button>
                </motion.div>

                {/* Submit */}
                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-600/25 hover:shadow-emerald-700/30 hover:scale-[1.02] transition-all duration-200 h-10"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>

              {/* Demo account info */}
              <motion.div
                variants={itemVariants}
                className="mt-5 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/40"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 rounded-md bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center">
                    <Store className="w-3 h-3 text-emerald-700 dark:text-emerald-300" />
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">Demo Account</p>
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 ml-7">
                  demo@onlinevepar.com / demo123
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs text-emerald-600 dark:text-emerald-400 p-0 h-auto mt-1 ml-7 font-semibold hover:text-emerald-700"
                  onClick={handleDemoLogin}
                >
                  Fill demo credentials →
                </Button>
              </motion.div>

              {/* Register link */}
              <motion.div variants={itemVariants} className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Button
                    variant="link"
                    className="text-emerald-600 dark:text-emerald-400 font-semibold p-0 h-auto hover:text-emerald-700"
                    onClick={() => setView('register')}
                  >
                    Sign Up
                  </Button>
                </p>
              </motion.div>

              {/* Back to landing */}
              <motion.div variants={itemVariants} className="mt-3 text-center">
                <Button
                  variant="link"
                  className="text-xs text-muted-foreground hover:text-emerald-600 p-0 h-auto"
                  onClick={() => setView('landing')}
                >
                  ← Back to home
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
