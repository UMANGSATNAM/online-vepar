'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useInView } from 'framer-motion'
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
    learnMore: '#',
  },
  {
    icon: Package,
    title: 'Product Management',
    description: 'Add unlimited products with inventory tracking, variants, and bulk upload support.',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    learnMore: '#',
  },
  {
    icon: CreditCard,
    title: 'Payment Ready',
    description: 'Accept payments via UPI, Cards, Net Banking and more. Instant settlement to your bank.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    learnMore: '#',
  },
  {
    icon: Smartphone,
    title: 'Mobile First',
    description: 'Beautiful responsive store themes that look great on every device. No app needed.',
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    learnMore: '#',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track sales, orders, and customers with real-time analytics and insightful reports.',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    learnMore: '#',
  },
  {
    icon: Rocket,
    title: 'Marketing Tools',
    description: 'SEO optimization, social media integration, and email marketing to grow your business.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
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
    price: 'Free',
    priceDetail: 'Forever free',
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
    price: '₹999',
    priceDetail: '/month',
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
    price: '₹4,999',
    priceDetail: '/month',
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
  },
  {
    name: 'Rajesh Kumar',
    store: 'Krishna Electronics',
    quote: 'The payment integration is seamless. My customers love the easy checkout, and I get instant settlements.',
    rating: 5,
    avatar: 'RK',
  },
  {
    name: 'Anita Patel',
    store: "Anita's Kitchen",
    quote: 'From homemade pickles to a thriving online business — Online Vepar made it all possible. Highly recommend!',
    rating: 5,
    avatar: 'AP',
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
  const { count, ref } = useAnimatedCounter(value, 2000)
  return (
    <div ref={ref} className="text-center">
      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-emerald-700">
        {count.toLocaleString('en-IN')}{suffix}
      </div>
      <div className="text-sm md:text-base text-emerald-600/70 mt-1">
        {label}
      </div>
    </div>
  )
}

export default function LandingPage() {
  const { setView } = useAppStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = useCallback(() => {
    if (email.includes('@')) {
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 3000)
    }
  }, [email])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-emerald-900">
                Online Vepar
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-emerald-800 hover:text-emerald-600 transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-sm font-medium text-emerald-800 hover:text-emerald-600 transition-colors">
                Pricing
              </a>
              <a href="#testimonials" className="text-sm font-medium text-emerald-800 hover:text-emerald-600 transition-colors">
                Testimonials
              </a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50"
                onClick={() => setView('login')}
              >
                Login
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
            className="md:hidden border-t border-emerald-100 bg-white"
          >
            <div className="px-4 py-3 space-y-2">
              <a href="#features" className="block py-2 text-sm font-medium text-emerald-800" onClick={() => setMobileMenuOpen(false)}>
                Features
              </a>
              <a href="#pricing" className="block py-2 text-sm font-medium text-emerald-800" onClick={() => setMobileMenuOpen(false)}>
                Pricing
              </a>
              <a href="#testimonials" className="block py-2 text-sm font-medium text-emerald-800" onClick={() => setMobileMenuOpen(false)}>
                Testimonials
              </a>
              <div className="pt-2 flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full border-emerald-200 text-emerald-700"
                  onClick={() => { setView('login'); setMobileMenuOpen(false) }}
                >
                  Login
                </Button>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
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
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-emerald-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/40 via-transparent to-transparent" />
        
        {/* Dot pattern background */}
        <div className="absolute inset-0 dot-pattern" />
        
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-300/15 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Badge className="mb-6 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 px-4 py-1.5 text-sm">
              🎉 Now available across India
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-emerald-950 leading-[1.1]">
              Build Your Online Store{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-500 bg-clip-text text-transparent animate-shimmer">
                in Minutes
              </span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-emerald-700/80 max-w-2xl mx-auto leading-relaxed">
              Online Vepar makes it easy for anyone to create a beautiful online store, 
              sell products, and grow their business — no coding required.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all"
                onClick={() => setView('register')}
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-8 py-6 text-lg rounded-xl"
                onClick={() => {
                  const el = document.getElementById('features')
                  el?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                View Demo
              </Button>
            </div>
          </motion.div>

          {/* Stats bar with animated counters */}
          <motion.div
            className="mt-16 md:mt-20 grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <CounterStat value={10000} suffix="+" label="Stores" />
            <CounterStat value={50000} suffix="+" label="Products" />
            <CounterStat value={5} suffix="Cr+" label="₹ Sales" />
          </motion.div>

          {/* Hero mockup with floating animation */}
          <motion.div
            className="mt-16 md:mt-20 max-w-5xl mx-auto animate-float"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-emerald-200/50 border border-emerald-100">
              <div className="bg-white p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <div className="flex-1 bg-emerald-50 rounded-lg h-8 ml-4 flex items-center px-3">
                    <span className="text-xs text-emerald-600">yourstore.onlinevepar.com</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { name: 'Ethnic Wear', price: '₹1,299', color: 'bg-emerald-100' },
                    { name: 'Handbag', price: '₹899', color: 'bg-amber-50' },
                    { name: 'Jewelry Set', price: '₹2,499', color: 'bg-rose-50' },
                    { name: 'Silk Saree', price: '₹3,999', color: 'bg-violet-50' },
                  ].map((product) => (
                    <div key={product.name} className={`${product.color} rounded-xl p-3 md:p-4 text-center`}>
                      <div className="w-full aspect-square rounded-lg bg-white/60 mb-2 flex items-center justify-center">
                        <Package className="w-8 h-8 text-emerald-400" />
                      </div>
                      <div className="text-xs md:text-sm font-medium text-emerald-900">{product.name}</div>
                      <div className="text-xs md:text-sm font-bold text-emerald-600">{product.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Badges Bar */}
      <section className="py-10 bg-white/80 border-y border-emerald-100/50">
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
      <section id="features" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-950">
              Everything you need to sell online
            </h2>
            <p className="mt-4 text-lg text-emerald-700/70">
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
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeInUp}>
                <Card className="h-full border-emerald-100 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-50 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                  {/* Subtle emerald glow on hover */}
                  <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ring-1 ring-inset ring-emerald-200 pointer-events-none" />
                  <CardHeader>
                    <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
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
      <section className="py-20 md:py-28 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-950">
              Start selling in 3 simple steps
            </h2>
            <p className="mt-4 text-lg text-emerald-700/70">
              Get your store up and running in no time.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
              >
                <div className="relative inline-block">
                  <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                    <span className="text-3xl">{step.icon}</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-emerald-700">{step.number}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-emerald-950 mb-2">{step.title}</h3>
                <p className="text-emerald-700/70">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 right-0 translate-x-1/2">
                    <ChevronRight className="w-6 h-6 text-emerald-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            {...fadeInUp}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
          >
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
              Pricing
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-950">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-emerald-700/70">
              Start free and upgrade as you grow. No hidden fees.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <Card className={`h-full relative ${plan.popular ? 'border-emerald-300 shadow-xl shadow-emerald-100 scale-105' : 'border-emerald-100'} transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-emerald-600 text-white px-4 py-1 shadow-lg">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-emerald-950 text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-emerald-950">{plan.price}</span>
                      <span className="text-emerald-600/70 ml-1">{plan.priceDetail}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
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
      <section id="testimonials" className="py-20 md:py-28 bg-gradient-to-b from-emerald-50 to-white">
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
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-950">
              Loved by merchants across India
            </h2>
            <p className="mt-4 text-lg text-emerald-700/70">
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
                transition={{ delay: index * 0.15, duration: 0.5 }}
              >
                <Card className={`h-full border-emerald-100 hover:shadow-lg hover:shadow-emerald-50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden ${index % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'}`}>
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
      <section className="py-20 md:py-28 bg-emerald-600 relative overflow-hidden">
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
                className="bg-white text-emerald-700 hover:bg-emerald-50 px-8 py-6 text-lg rounded-xl shadow-lg"
                onClick={() => setView('register')}
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-emerald-300 text-white hover:bg-emerald-700 px-8 py-6 text-lg rounded-xl"
                onClick={() => setView('login')}
              >
                Login to Dashboard
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-emerald-950 text-emerald-200 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
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
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-emerald-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-emerald-500">
              © {new Date().getFullYear()} Online Vepar. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              {/* Social media icons */}
              <a href="#" className="text-emerald-500 hover:text-emerald-300 transition-colors" aria-label="Twitter">
                <Twitter className="w-4.5 h-4.5" />
              </a>
              <a href="#" className="text-emerald-500 hover:text-emerald-300 transition-colors" aria-label="Instagram">
                <Instagram className="w-4.5 h-4.5" />
              </a>
              <a href="#" className="text-emerald-500 hover:text-emerald-300 transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-4.5 h-4.5" />
              </a>
              <a href="#" className="text-emerald-500 hover:text-emerald-300 transition-colors" aria-label="YouTube">
                <Youtube className="w-4.5 h-4.5" />
              </a>
            </div>
            <div className="text-sm text-emerald-500">
              Made with ❤️ in India
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
