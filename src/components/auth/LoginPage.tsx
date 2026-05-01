'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Store, Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/40 via-transparent to-transparent" />
      
      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-emerald-900">Online Vepar</span>
          </div>
        </div>

        <Card className="border-emerald-100 shadow-xl shadow-emerald-100/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-emerald-950">Welcome back</CardTitle>
            <CardDescription>Sign in to your Online Vepar account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-emerald-800">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-emerald-800">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-emerald-400" />
                    )}
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Demo account info */}
            <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <p className="text-xs text-emerald-700 font-medium mb-1">Demo Account</p>
              <p className="text-xs text-emerald-600">
                Email: demo@onlinevepar.com | Password: demo123
              </p>
              <Button
                variant="link"
                size="sm"
                className="text-xs text-emerald-600 p-0 h-auto mt-1"
                onClick={handleDemoLogin}
              >
                Fill demo credentials
              </Button>
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-emerald-600">
              Don&apos;t have an account?{' '}
              <Button
                variant="link"
                className="text-emerald-700 font-semibold p-0 h-auto"
                onClick={() => setView('register')}
              >
                Sign Up
              </Button>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
