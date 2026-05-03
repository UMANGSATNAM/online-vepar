'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Lock, Mail, ArrowRight, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const body = isLogin ? { email, password } : { email, password, name, role: 'superadmin' }
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Authentication failed')
      
      toast({
        title: isLogin ? 'Welcome back, Commander' : 'Admin Access Created',
        description: 'Verifying credentials and establishing secure connection...',
      })
      
      // Give it a second to show the toast
      setTimeout(() => {
        window.location.href = '/admin'
      }, 1000)
      
    } catch (error: any) {
      toast({
        title: 'Access Denied',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col justify-center relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="container mx-auto px-4 z-10">
        <div className="max-w-[1000px] mx-auto flex flex-col lg:flex-row items-center gap-16">
          
          {/* Admin Landing Text Area */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6">
                <Shield className="w-4 h-4" />
                <span>Restricted Access</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
                Platform Command Center
              </h1>
              <p className="text-lg text-zinc-400 max-w-lg mx-auto lg:mx-0 leading-relaxed mb-8">
                Welcome to the Online Vepar Super Admin portal. This secure gateway provides full access to global analytics, merchant management, and billing configurations.
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-left max-w-lg mx-auto lg:mx-0">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <div className="text-2xl mb-2">📊</div>
                  <h3 className="font-semibold text-white mb-1">Global Metrics</h3>
                  <p className="text-xs text-zinc-400">Monitor platform health in real-time</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <div className="text-2xl mb-2">⚙️</div>
                  <h3 className="font-semibold text-white mb-1">System Config</h3>
                  <p className="text-xs text-zinc-400">Manage subscriptions & paywalls</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Login/Signup Form */}
          <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative overflow-hidden"
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white">
                  {isLogin ? 'Admin Login' : 'Create Admin'}
                </h2>
                <div className="flex gap-2 text-sm bg-black/40 p-1 rounded-lg border border-white/5">
                  <button 
                    onClick={() => setIsLogin(true)}
                    className={`px-3 py-1.5 rounded-md transition-all ${isLogin ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => setIsLogin(false)}
                    className={`px-3 py-1.5 rounded-md transition-all ${!isLogin ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Register
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider">Full Name</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                      <Input 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500" 
                        placeholder="Super Admin" 
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs uppercase tracking-wider">Admin Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500" 
                      placeholder="admin@onlinevepar.com" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider">Master Password</Label>
                    {isLogin && <span className="text-xs text-emerald-400 hover:text-emerald-300 cursor-pointer">Forgot?</span>}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500" 
                      placeholder="••••••••" 
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all mt-4"
                >
                  {isLoading ? 'Authenticating...' : (isLogin ? 'Establish Connection' : 'Initialize Account')}
                  {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </form>

            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
