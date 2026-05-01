'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Store, Loader2, Eye, EyeOff, Mail, Lock, User, CheckCircle2, ArrowRight, Shield, Zap, Users } from 'lucide-react'
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
    transition: { staggerChildren: 0.07, delayChildren: 0.2 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: '', color: '' }
  let score = 0
  if (pwd.length >= 6) score++
  if (pwd.length >= 10) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' }
  if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-orange-500' }
  if (score <= 3) return { score: 3, label: 'Medium', color: 'bg-amber-500' }
  if (score <= 4) return { score: 4, label: 'Strong', color: 'bg-emerald-400' }
  return { score: 5, label: 'Very Strong', color: 'bg-emerald-600' }
}

export default function RegisterPage() {
  const { setView, setUser, setStore, setStores } = useAppStore()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same.',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setUser(data.user)
      if (data.stores && data.stores.length > 0) {
        setStores(data.stores)
        setStore(data.stores[0])
      }
      setView('dashboard')
      toast({
        title: 'Welcome to Online Vepar!',
        description: 'Your account and store have been created.',
      })
    } catch (error) {
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* ===== Left Decorative Panel ===== */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 dark:from-emerald-900 dark:via-emerald-950 dark:to-teal-950">
        {/* Floating orbs */}
        <div className="absolute top-16 right-16 w-72 h-72 bg-teal-400/15 rounded-full blur-3xl animate-orb-2" />
        <div className="absolute bottom-24 left-10 w-56 h-56 bg-emerald-300/10 rounded-full blur-3xl animate-orb-1" />
        <div className="absolute top-1/3 right-1/3 w-40 h-40 bg-cyan-400/10 rounded-full blur-2xl animate-orb-3" />

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
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                <Store className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-white tracking-tight">Online Vepar</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Start Your<br />
              <span className="bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200 bg-clip-text text-transparent">Free Trial</span>
            </h1>
            <p className="text-emerald-100/80 text-lg mb-10 max-w-md">
              Get started with a 14-day free trial. No credit card required. Launch your store today.
            </p>

            {/* Pricing highlight */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8 max-w-md">
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold text-white">₹0</span>
                <span className="text-emerald-200/70 text-sm">/month for 14 days</span>
              </div>
              <p className="text-emerald-100/60 text-sm">Then starting at ₹999/month. Cancel anytime.</p>
            </div>

            {/* Trust indicators */}
            <div className="space-y-3">
              {[
                { icon: Shield, label: 'Secure & encrypted', desc: 'Your data is always protected' },
                { icon: Zap, label: 'Lightning fast', desc: '99.9% uptime guaranteed' },
                { icon: Users, label: '10,000+ merchants', desc: 'Trust Online Vepar for their stores' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.12 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10 flex-shrink-0">
                    <item.icon className="w-4 h-4 text-emerald-200" />
                  </div>
                  <span className="text-white font-semibold text-sm">{item.label}</span>
                  <span className="text-emerald-200/60 text-sm">— {item.desc}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ===== Right Register Form Panel ===== */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
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
                <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-100">Create your account</h2>
                <p className="text-muted-foreground text-sm mt-1">Start your free online store today</p>
              </motion.div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="name" className="text-emerald-800 dark:text-emerald-300 text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 dark:text-emerald-500" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="pl-10 border-emerald-200 dark:border-emerald-800/50 focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-900/50 transition-all duration-200"
                    />
                  </div>
                </motion.div>

                {/* Store Name */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="storeName" className="text-emerald-800 dark:text-emerald-300 text-sm font-medium">Store Name</Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 dark:text-emerald-500" />
                    <Input
                      id="storeName"
                      type="text"
                      placeholder="My Awesome Store"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="pl-10 border-emerald-200 dark:border-emerald-800/50 focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-900/50 transition-all duration-200"
                    />
                  </div>
                </motion.div>

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

                {/* Password with strength indicator */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="password" className="text-emerald-800 dark:text-emerald-300 text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 dark:text-emerald-500" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
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
                  {/* Password strength bar */}
                  {password && (
                    <div className="space-y-1.5 mt-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              level <= passwordStrength.score
                                ? passwordStrength.color
                                : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${
                        passwordStrength.score <= 1 ? 'text-red-500' :
                        passwordStrength.score <= 2 ? 'text-orange-500' :
                        passwordStrength.score <= 3 ? 'text-amber-500' :
                        'text-emerald-500'
                      }`}>
                        {passwordStrength.label}
                      </p>
                    </div>
                  )}
                </motion.div>

                {/* Confirm Password */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-emerald-800 dark:text-emerald-300 text-sm font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 dark:text-emerald-500" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pl-10 border-emerald-200 dark:border-emerald-800/50 focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-900/50 transition-all duration-200"
                    />
                    {confirmPassword && password === confirmPassword && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                </motion.div>

                {/* Terms & Conditions */}
                <motion.div variants={itemVariants} className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 mt-0.5"
                  />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-snug">
                    I agree to the{' '}
                    <Button variant="link" className="text-emerald-600 dark:text-emerald-400 p-0 h-auto font-medium text-sm">
                      Terms of Service
                    </Button>{' '}and{' '}
                    <Button variant="link" className="text-emerald-600 dark:text-emerald-400 p-0 h-auto font-medium text-sm">
                      Privacy Policy
                    </Button>
                  </Label>
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
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>

              {/* Login link */}
              <motion.div variants={itemVariants} className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Button
                    variant="link"
                    className="text-emerald-600 dark:text-emerald-400 font-semibold p-0 h-auto hover:text-emerald-700"
                    onClick={() => setView('login')}
                  >
                    Sign In
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
