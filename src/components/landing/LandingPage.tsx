'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import {
  Store,
  Package,
  CreditCard,
  Smartphone,
  BarChart3,
  Rocket,
  Check,
  ArrowRight,
  Menu,
  X,
  Star,
  ChevronRight,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Quote,
  Mail,
  ArrowUp,
  Shield,
  TrendingUp,
  Users,
  DollarSign,
  ShoppingCart,
  FileText,
  Scale,
  Cookie,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/lib/store'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const features = [
  {
    icon: Store,
    title: 'Easy Store Setup',
    description: 'Create your store in under 5 minutes with our guided setup wizard. No technical skills required.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    overlay: 'feature-overlay-emerald',
    learnMore: '#',
  },
  {
    icon: Package,
    title: 'Product Management',
    description: 'Add unlimited products with inventory tracking, variants, and bulk upload support.',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    overlay: 'feature-overlay-orange',
    learnMore: '#',
  },
  {
    icon: CreditCard,
    title: 'Payment Ready',
    description: 'Accept payments via UPI, Cards, Net Banking and more. Instant settlement to your bank.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    overlay: 'feature-overlay-violet',
    learnMore: '#',
  },
  {
    icon: Smartphone,
    title: 'Mobile First',
    description: 'Beautiful responsive store themes that look great on every device. No app needed.',
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    overlay: 'feature-overlay-sky',
    learnMore: '#',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track sales, orders, and customers with real-time analytics and insightful reports.',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    overlay: 'feature-overlay-rose',
    learnMore: '#',
  },
  {
    icon: Rocket,
    title: 'Marketing Tools',
    description: 'SEO optimization, social media integration, and email marketing to grow your business.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    overlay: 'feature-overlay-amber',
    learnMore: '#',
  },
]

const steps = [
  {
    number: '01',
    title: 'Sign Up',
    description: 'Create your free account in seconds. Just enter your email and get started right away.',
    icon: '✨',
  },
  {
    number: '02',
    title: 'Customize',
    description: 'Choose a theme, add your products, set up payment, and personalize your brand.',
    icon: '🎨',
  },
  {
    number: '03',
    title: 'Sell',
    description: 'Share your store link and start accepting orders. Grow your business with built-in tools.',
    icon: '🚀',
  },
]

const pricingPlans = [
  {
    name: 'Starter',
    monthlyPrice: 'Free',
    yearlyPrice: 'Free',
    monthlyDetail: 'Forever free',
    yearlyDetail: 'Forever free',
    description: 'Perfect for getting started',
    features: [
      '1 Online Store',
      'Up to 25 Products',
      'Basic Themes',
      'UPI Payment',
      'Email Support',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Growth',
    monthlyPrice: '₹999',
    yearlyPrice: '₹9,590',
    monthlyDetail: '/month',
    yearlyDetail: '/year (Save ₹2,398)',
    description: 'For growing businesses',
    features: [
      '1 Online Store',
      'Unlimited Products',
      'Premium Themes',
      'All Payment Methods',
      'Analytics Dashboard',
      'Custom Domain',
      'Priority Support',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    monthlyPrice: '₹4,999',
    yearlyPrice: '₹47,990',
    monthlyDetail: '/month',
    yearlyDetail: '/year (Save ₹11,998)',
    description: 'For large scale operations',
    features: [
      '5 Online Stores',
      'Unlimited Products',
      'Custom Themes',
      'All Payment Methods',
      'Advanced Analytics',
      'Custom Domain',
      'API Access',
      'Dedicated Manager',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
]

const testimonials = [
  {
    name: 'Priya Sharma',
    store: "Priya's Boutique",
    quote: 'Online Vepar helped me take my boutique online in just 10 minutes. Sales have grown 3x since I started!',
    rating: 5,
    avatar: 'PS',
    verified: true,
  },
  {
    name: 'Rajesh Kumar',
    store: 'Krishna Electronics',
    quote: 'The payment integration is seamless. My customers love the easy checkout, and I get instant settlements.',
    rating: 5,
    avatar: 'RK',
    verified: true,
  },
  {
    name: 'Anita Patel',
    store: "Anita's Kitchen",
    quote: 'From homemade pickles to a thriving online business — Online Vepar made it all possible. Highly recommend!',
    rating: 5,
    avatar: 'AP',
    verified: true,
  },
  {
    name: 'Vikram Singh',
    store: 'Singh Textiles',
    quote: 'I switched from another platform and my conversion rate doubled. The mobile experience is outstanding.',
    rating: 5,
    avatar: 'VS',
    verified: true,
  },
  {
    name: 'Meera Joshi',
    store: 'Meera Crafts',
    quote: 'The analytics dashboard gives me insights I never had before. I can now make data-driven decisions.',
    rating: 5,
    avatar: 'MJ',
    verified: true,
  },
  {
    name: 'Arjun Reddy',
    store: 'Reddy Organics',
    quote: 'Setting up was a breeze. Within a day, my organic farm products were online and getting orders!',
    rating: 4,
    avatar: 'AR',
    verified: true,
  },
]

const trustBrands = [
  { name: 'FabIndia', initials: 'FI' },
  { name: 'Nykaa', initials: 'NK' },
  { name: 'Zoho', initials: 'ZH' },
  { name: 'Razorpay', initials: 'RP' },
  { name: 'Shiprocket', initials: 'SR' },
  { name: 'Khatabook', initials: 'KB' },
]

// Mini chart bars for dashboard mockup
const miniChartData = [40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88]

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const hasStarted = useRef(false)

  useEffect(() => {
    if (!startOnView || (isInView && !hasStarted.current)) {
      hasStarted.current = true
      const startTime = Date.now()
      const step = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        setCount(Math.floor(eased * target))
        if (progress < 1) {
          requestAnimationFrame(step)
        }
      }
      requestAnimationFrame(step)
    }
  }, [isInView, target, duration, startOnView])

  return { count, ref }
}

// Counter stat component
function CounterStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { count, ref } = useAnimatedCounter(value, 2500)
  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-emerald-700 dark:text-emerald-400 dark:text-emerald-400">
        {count.toLocaleString('en-IN')}{suffix}
      </div>
      <div className="text-sm md:text-base text-emerald-600/70 dark:text-emerald-400/70 mt-1 font-medium">
        {label}
      </div>
    </div>
  )
}

// Dashboard mockup component
function DashboardMockup() {
  return (
    <div className="bg-white rounded-xl overflow-hidden">
      {/* Top bar with dots and URL */}
      <div className="flex items-center gap-2 p-3 md:p-4 border-b border-emerald-100/60">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <div className="flex-1 bg-emerald-50 rounded-lg h-7 ml-3 flex items-center px-3">
          <span className="text-[10px] md:text-xs text-emerald-600 truncate">yourstore.onlinevepar.com/dashboard</span>
        </div>
      </div>
      <div className="flex min-h-[200px] md:min-h-[280px]">
        {/* Mini sidebar */}
        <div className="hidden md:flex flex-col w-14 lg:w-16 bg-emerald-50/60 border-r border-emerald-100/40 p-2 gap-1.5">
          {[
            { icon: BarChart3, active: true },
            { icon: Package, active: false },
            { icon: ShoppingCart, active: false },
            { icon: Users, active: false },
            { icon: CreditCard, active: false },
          ].map((item, i) => (
            <div
              key={i}
              className={`w-8 lg:w-10 h-8 lg:h-10 rounded-lg flex items-center justify-center transition-colors ${
                item.active
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-400 hover:text-emerald-600'
              }`}
            >
              <item.icon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            </div>
          ))}
        </div>
        {/* Main content area */}
        <div className="flex-1 p-3 md:p-4 space-y-3 md:space-y-4">
          {/* Stats cards row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {[
              { label: 'Revenue', value: '₹2.4L', change: '+12%', icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
              { label: 'Orders', value: '156', change: '+8%', icon: ShoppingCart, color: 'bg-orange-50 text-orange-600' },
              { label: 'Customers', value: '1.2K', change: '+15%', icon: Users, color: 'bg-violet-50 text-violet-600' },
              { label: 'Products', value: '48', change: '+3', icon: Package, color: 'bg-sky-50 text-sky-600' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border border-emerald-100/60 rounded-lg p-2 md:p-2.5">
                <div className="flex items-center gap-1 mb-1">
                  <div className={`w-5 h-5 rounded ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-3 h-3" />
                  </div>
                  <span className="text-[8px] md:text-[10px] text-emerald-500">{stat.label}</span>
                </div>
                <div className="text-sm md:text-base font-bold text-emerald-900">{stat.value}</div>
                <div className="text-[8px] md:text-[10px] text-emerald-500 font-medium">{stat.change}</div>
              </div>
            ))}
          </div>
          {/* Chart area */}
          <div className="bg-white border border-emerald-100/60 rounded-lg p-2 md:p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] md:text-xs font-semibold text-emerald-800">Revenue Overview</span>
              <span className="text-[8px] md:text-[10px] text-emerald-400">Last 12 months</span>
            </div>
            <div className="flex items-end gap-[3px] md:gap-1 h-14 md:h-20">
              {miniChartData.map((value, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm animate-chart-bar"
                  style={{
                    height: `${value}%`,
                    background: `linear-gradient(to top, #059669, #34d399)`,
                    animationDelay: `${i * 0.06}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const { setView } = useAppStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [isYearly, setIsYearly] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null)

  // Scroll spy
  useEffect(() => {
    const sections = ['features', 'how-it-works', 'pricing', 'testimonials']
    const handleScroll = () => {
      const scrollY = window.scrollY + 100
      setShowBackToTop(window.scrollY > 500)

      for (const section of sections) {
        const el = document.getElementById(section)
        if (el) {
          const top = el.offsetTop
          const bottom = top + el.offsetHeight
          if (scrollY >= top && scrollY < bottom) {
            setActiveSection(section)
            break
          }
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSubscribe = useCallback(() => {
    if (email.includes('@')) {
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 3000)
    }
  }, [email])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-950/80 border-b border-emerald-100 dark:border-emerald-900/50 animate-stagger-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-emerald-900 dark:text-emerald-100 dark:text-emerald-100">
                Online Vepar
              </span>
            </div>

            {/* Desktop Nav with scroll spy */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'features'
                    ? 'nav-link-active text-emerald-600'
                    : 'text-emerald-800 dark:text-emerald-200 hover:text-emerald-600'
                }`}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'how-it-works'
                    ? 'nav-link-active text-emerald-600'
                    : 'text-emerald-800 dark:text-emerald-200 hover:text-emerald-600'
                }`}
              >
                How It Works
              </a>
              <a
                href="#pricing"
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'pricing'
                    ? 'nav-link-active text-emerald-600'
                    : 'text-emerald-800 dark:text-emerald-200 hover:text-emerald-600'
                }`}
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'testimonials'
                    ? 'nav-link-active text-emerald-600'
                    : 'text-emerald-800 dark:text-emerald-200 hover:text-emerald-600'
                }`}
              >
                Testimonials
              </a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                onClick={() => setView('login')}
              >
                Login
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-[1.02] transition-all duration-200 button-press"
                onClick={() => setView('register')}
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t border-emerald-100 dark:border-emerald-900/50 bg-white dark:bg-gray-950"
          >
            <div className="px-4 py-3 space-y-2">
              <a href="#features" className="block py-2 text-sm font-medium text-emerald-800 dark:text-emerald-200" onClick={() => setMobileMenuOpen(false)}>
                Features
              </a>
              <a href="#how-it-works" className="block py-2 text-sm font-medium text-emerald-800 dark:text-emerald-200" onClick={() => setMobileMenuOpen(false)}>
                How It Works
              </a>
              <a href="#pricing" className="block py-2 text-sm font-medium text-emerald-800 dark:text-emerald-200" onClick={() => setMobileMenuOpen(false)}>
                Pricing
              </a>
              <a href="#testimonials" className="block py-2 text-sm font-medium text-emerald-800 dark:text-emerald-200" onClick={() => setMobileMenuOpen(false)}>
                Testimonials
              </a>
              <div className="pt-2 flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                  onClick={() => { setView('login'); setMobileMenuOpen(false) }}
                >
                  Login
                </Button>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white button-press"
                  onClick={() => { setView('register'); setMobileMenuOpen(false) }}
                >
                  Start Free Trial
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden animate-hero-gradient">
        {/* Floating orbs / particles */}
        <div className="absolute top-16 left-[5%] w-40 h-40 md:w-72 md:h-72 bg-emerald-300/20 rounded-full blur-3xl animate-orb-1" />
        <div className="absolute bottom-10 right-[8%] w-56 h-56 md:w-96 md:h-96 bg-teal-300/15 rounded-full blur-3xl animate-orb-2" />
        <div className="absolute top-1/3 right-[15%] w-32 h-32 md:w-48 md:h-48 bg-cyan-300/10 rounded-full blur-3xl animate-orb-3" />
        <div className="absolute bottom-1/3 left-[20%] w-24 h-24 md:w-40 md:h-40 bg-emerald-400/10 rounded-full blur-2xl animate-orb-2" />

        {/* Dot pattern background */}
        <div className="absolute inset-0 dot-pattern" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <Badge className="mb-6 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 px-4 py-1.5 text-sm">
              🎉 Now available across India
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-emerald-950 dark:text-emerald-50 dark:text-emerald-50 leading-[1.1]">
              Build Your Online Store{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-400 to-cyan-500 bg-clip-text text-transparent animate-shimmer">
                in Minutes
              </span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-emerald-700/80 dark:text-emerald-300/80 max-w-2xl mx-auto leading-relaxed">
              Online Vepar makes it easy for anyone to create a beautiful online store, 
              sell products, and grow their business — no coding required.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/50 hover:shadow-emerald-300/50 dark:hover:shadow-emerald-800/50 hover:scale-[1.02] transition-all duration-200 button-press"
                onClick={() => setView('register')}
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-8 py-6 text-lg rounded-xl hover:scale-[1.02] transition-all duration-200"
                onClick={() => {
                  const el = document.getElementById('features')
                  el?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                View Demo
              </Button>
            </div>
          </motion.div>

          {/* Stats bar with animated counters - larger and more prominent */}
          <motion.div
            className="mt-16 md:mt-20 grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto p-6 md:p-8 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-emerald-100/50 dark:border-emerald-800/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <CounterStat value={10000} suffix="+" label="Stores" />
            <CounterStat value={50000} suffix="+" label="Products" />
            <CounterStat value={5} suffix="Cr+" label="₹ Sales" />
          </motion.div>

          {/* Hero mockup - Dashboard style */}
          <motion.div
            className="mt-16 md:mt-20 max-w-5xl mx-auto animate-float"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-emerald-200/50 border border-emerald-100">
              <DashboardMockup />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Badges Bar */}
      <section className="py-10 bg-white/80 dark:bg-gray-900/80 border-y border-emerald-100/50 dark:border-emerald-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-emerald-600/60 mb-6">
            Trusted by merchants across India
          </p>
          <div className="flex items-center justify-center gap-6 md:gap-10 flex-wrap">
            {trustBrands.map((brand) => (
              <div key={brand.name} className="flex items-center gap-2 opacity-50 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-emerald-700">{brand.initials}</span>
                </div>
                <span className="text-sm font-medium text-emerald-800/60 hidden sm:inline">{brand.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28 bg-white dark:bg-gray-950 relative overflow-hidden">
        {/* Grid pattern background */}
        <div className="absolute inset-0 grid-pattern" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            {...fadeInUp}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
          >
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
              Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-950 dark:text-emerald-50">
              Everything you need to sell online
            </h2>
            <p className="mt-4 text-lg text-emerald-700/70 dark:text-emerald-300/70">
              Powerful tools to help you create, manage, and grow your online store.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div key={feature.title} variants={fadeInUp}>
                <Card className="h-full border-emerald-100 dark:border-emerald-900/50 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg hover:shadow-emerald-50 dark:hover:shadow-emerald-950/50 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden card-hover">
                  {/* Feature number indicator */}
                  <div className="absolute top-4 left-4 text-xs font-mono font-bold text-emerald-300/60 select-none">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  {/* Gradient overlay on hover matching feature color */}
                  <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${feature.overlay} pointer-events-none`} />
                  {/* Emerald ring glow on hover */}
                  <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ring-1 ring-inset ring-emerald-200 pointer-events-none" />
                  <CardHeader className="pt-6">
                    <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 group-hover:icon-bounce transition-transform duration-300`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-emerald-950">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-emerald-700/70">{feature.description}</p>
                  </CardContent>
                  <CardFooter>
                    <a
                      href={feature.learnMore}
                      className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:text-emerald-700"
                    >
                      Learn more <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-28 relative overflow-hidden dark:bg-gray-950">
        {/* Flowing gradient background */}
        <div className="absolute inset-0 animate-flow-gradient" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            {...fadeInUp}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
          >
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
              How It Works
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-950 dark:text-emerald-50">
              Start selling in 3 simple steps
            </h2>
            <p className="mt-4 text-lg text-emerald-700/70 dark:text-emerald-300/70">
              Get your store up and running in no time.
            </p>
          </motion.div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-4xl mx-auto">
            {/* Connecting lines (desktop only) */}
            <div className="hidden md:block absolute top-16 left-[calc(16.67%+40px)] right-[calc(16.67%+40px)] h-0.5">
              <div className="w-full h-full bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-300 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                  <ChevronRight className="w-5 h-5 text-emerald-400 -ml-2" />
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-y-1/2">
                  <ChevronRight className="w-5 h-5 text-emerald-400 -ml-2" />
                </div>
              </div>
            </div>

            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
              >
                {/* Progress-style step number */}
                <div className="relative inline-block mb-4">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto relative bg-white border-2 border-emerald-200 shadow-lg shadow-emerald-100">
                    <span className="text-3xl">{step.icon}</span>
                    {/* Progress indicator */}
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-xs font-bold text-white">{step.number}</span>
                    </div>
                    {/* Progress ring */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
                      <circle
                        cx="40"
                        cy="40"
                        r="38"
                        fill="none"
                        stroke="#d1fae5"
                        strokeWidth="2"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="38"
                        fill="none"
                        stroke="#059669"
                        strokeWidth="2"
                        strokeDasharray={`${(238 * (index + 1)) / 3} 238`}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-emerald-950 dark:text-emerald-50 mb-2">{step.title}</h3>
                <p className="text-emerald-700/70">{step.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Get Started Now CTA */}
          <motion.div
            className="text-center mt-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-6 text-lg rounded-xl shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/50 hover:shadow-emerald-300/50 dark:hover:shadow-emerald-800/50 hover:scale-[1.02] transition-all duration-200 button-press"
              onClick={() => setView('register')}
            >
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-28 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-10"
            {...fadeInUp}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
          >
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
              Pricing
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-950 dark:text-emerald-50">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-emerald-700/70 dark:text-emerald-300/70">
              Start free and upgrade as you grow. No hidden fees.
            </p>
          </motion.div>

          {/* Monthly/Yearly Toggle */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <span className={`text-sm font-medium ${!isYearly ? 'text-emerald-700' : 'text-emerald-400'}`}>Monthly</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                isYearly ? 'bg-emerald-600' : 'bg-emerald-200'
              }`}
              aria-label="Toggle yearly pricing"
            >
              <div
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                  isYearly ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-emerald-700' : 'text-emerald-400'}`}>
              Yearly
            </span>
            {isYearly && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs px-2 py-0.5">
                Save 20%
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                onMouseEnter={() => setHoveredPlan(plan.name)}
                onMouseLeave={() => setHoveredPlan(null)}
                className={plan.popular ? 'order-first md:order-none' : ''}
              >
                <Card className={`h-full relative transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                  plan.popular
                    ? 'border-emerald-300 dark:border-emerald-700 shadow-xl animate-glow-pulse md:scale-105'
                    : 'border-emerald-100 dark:border-emerald-900/50'
                }`}>
                  {/* Ribbon for Most Popular */}
                  {plan.popular && (
                    <div className="pricing-ribbon">
                      <span>Popular</span>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-emerald-950 text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-emerald-950">
                        {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-emerald-600/70 ml-1">
                        {isYearly ? plan.yearlyDetail : plan.monthlyDetail}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2"
                        >
                          <Check
                            className="w-4 h-4 text-emerald-500 flex-shrink-0 transition-all duration-300"
                            style={{
                              opacity: hoveredPlan === plan.name ? 1 : 0.7,
                              transform: hoveredPlan === plan.name
                                ? 'scale(1.1)'
                                : 'scale(1)',
                              transitionDelay: hoveredPlan === plan.name
                                ? `${featureIndex * 50}ms`
                                : '0ms',
                            }}
                          />
                          <span className="text-sm text-emerald-800">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                      onClick={() => setView('register')}
                    >
                      {plan.cta}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 md:py-28 bg-gradient-to-b from-emerald-50 to-white dark:from-gray-950 dark:to-gray-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            {...fadeInUp}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
          >
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
              Testimonials
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-950 dark:text-emerald-50">
              Loved by merchants across India
            </h2>
            <p className="mt-4 text-lg text-emerald-700/70 dark:text-emerald-300/70">
              Hear from real store owners who are growing with Online Vepar.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className={`testimonial-card h-full border-emerald-100 relative overflow-hidden ${
                  index % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'
                }`}>
                  {/* Large quote icon behind text */}
                  <div className="absolute top-4 right-4 text-emerald-100 select-none pointer-events-none">
                    <Quote className="w-16 h-16" />
                  </div>
                  <CardHeader className="relative">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-emerald-700">{testimonial.avatar}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-emerald-950">{testimonial.name}</div>
                        <div className="text-sm text-emerald-600/70">{testimonial.store}</div>
                        {testimonial.verified && (
                          <span className="verified-badge mt-1">
                            <Shield className="w-3 h-3" />
                            Verified Merchant
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-0.5 mt-2">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-emerald-700/80 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-emerald-600 dark:bg-emerald-800 relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Ready to start your online store?
            </h2>
            <p className="mt-4 text-lg text-emerald-100 max-w-2xl mx-auto">
              Join thousands of merchants who trust Online Vepar to power their business. Start your free trial today.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-emerald-700 hover:bg-emerald-50 px-8 py-6 text-lg rounded-xl shadow-lg hover:scale-[1.02] transition-all duration-200"
                onClick={() => setView('register')}
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-emerald-300 text-white hover:bg-emerald-700 px-8 py-6 text-lg rounded-xl transition-all duration-200"
                onClick={() => setView('login')}
              >
                Login to Dashboard
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-emerald-950 text-emerald-200 py-12 mt-auto footer-gradient-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Online Vepar</span>
              </div>
              <p className="text-emerald-400 max-w-md mb-6">
                The easiest way to create and manage your online store. Built for Indian merchants, by Indian developers.
              </p>
              {/* Newsletter signup */}
              <div className="max-w-sm">
                <p className="text-sm font-medium text-emerald-300 mb-2">Stay updated</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                    className="bg-emerald-900/50 border-emerald-800 text-emerald-200 placeholder:text-emerald-600 h-9"
                  />
                  <Button
                    onClick={handleSubscribe}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-4 shrink-0"
                  >
                    <Mail className="w-4 h-4 mr-1.5" />
                    Subscribe
                  </Button>
                </div>
                {subscribed && (
                  <p className="text-xs text-emerald-400 mt-1.5">✓ Thanks for subscribing!</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Themes</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" />API</a></li>
                <li><a href="#" className="hover:text-white transition-colors flex items-center gap-1.5"><Rocket className="w-3.5 h-3.5" />Guides</a></li>
                <li><a href="#" className="hover:text-white transition-colors flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors flex items-center gap-1.5"><Scale className="w-3.5 h-3.5" />Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" />Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors flex items-center gap-1.5"><Cookie className="w-3.5 h-3.5" />Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-emerald-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-emerald-500">
              © {new Date().getFullYear()} Online Vepar. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              {/* Animated social media icons */}
              <a href="#" className="text-emerald-500 hover:text-emerald-300 social-icon-hover" aria-label="Twitter">
                <Twitter className="w-4.5 h-4.5" />
              </a>
              <a href="#" className="text-emerald-500 hover:text-emerald-300 social-icon-hover" aria-label="Instagram">
                <Instagram className="w-4.5 h-4.5" />
              </a>
              <a href="#" className="text-emerald-500 hover:text-emerald-300 social-icon-hover" aria-label="LinkedIn">
                <Linkedin className="w-4.5 h-4.5" />
              </a>
              <a href="#" className="text-emerald-500 hover:text-emerald-300 social-icon-hover" aria-label="YouTube">
                <Youtube className="w-4.5 h-4.5" />
              </a>
            </div>
            <div className="text-sm text-emerald-500">
              Made with ❤️ in India
            </div>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center transition-all duration-200 hover:scale-110 animate-back-to-top"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
