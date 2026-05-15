'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Store, Package, CreditCard, BarChart3, Rocket, Check, ArrowRight,
  Menu, X, Star, Shield, TrendingUp, Users, Zap, Globe, ChevronRight,
  Play, Sparkles, ShoppingCart, Clock, Award, HeartHandshake,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
}

const features = [
  { icon: Store, title: 'Instant Store Setup', desc: 'Launch your store in under 5 minutes. No coding, no hassle.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: Package, title: 'Product Management', desc: 'Add unlimited products with variants, inventory, and bulk tools.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: CreditCard, title: 'UPI & Card Payments', desc: 'Accept all Indian payment methods. Instant bank settlement.', color: 'text-violet-500', bg: 'bg-violet-500/10' },
  { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Track revenue, orders, and customers with beautiful dashboards.', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { icon: Globe, title: 'Custom Domains', desc: 'Connect your own domain and build a professional brand.', color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { icon: Shield, title: 'Enterprise Security', desc: 'SSL, data encryption, PCI-DSS compliance out of the box.', color: 'text-teal-500', bg: 'bg-teal-500/10' },
]

const plans = [
  {
    name: 'Starter', price: '₹999', period: '/mo', popular: false,
    desc: 'Perfect for new businesses',
    features: ['1 Store', 'Up to 100 products', 'Basic analytics', 'Email support', 'Free SSL'],
  },
  {
    name: 'Growth', price: '₹2,499', period: '/mo', popular: true,
    desc: 'For growing businesses',
    features: ['3 Stores', 'Unlimited products', 'Advanced analytics', 'Priority support', 'Custom domain', 'Abandoned cart recovery'],
  },
  {
    name: 'Enterprise', price: '₹7,999', period: '/mo', popular: false,
    desc: 'For large-scale operations',
    features: ['Unlimited stores', 'White-label solution', 'Dedicated manager', 'API access', 'Custom integrations', 'SLA guarantee'],
  },
]

const stats = [
  { value: '50,000+', label: 'Active Stores' },
  { value: '₹500Cr+', label: 'GMV Processed' },
  { value: '99.99%', label: 'Uptime' },
  { value: '4.9★', label: 'Merchant Rating' },
]

const testimonials = [
  { name: 'Priya Sharma', role: 'Founder, Sharma Sarees', text: 'Online Vepar transformed my business. I went from 0 to ₹5 lakh monthly revenue in just 3 months.', avatar: 'PS', rating: 5 },
  { name: 'Rahul Mehta', role: 'CEO, TechGadgets', text: 'The analytics dashboard is incredible. I can see exactly what is selling and where my customers come from.', avatar: 'RM', rating: 5 },
  { name: 'Anita Patel', role: 'Owner, Spice Garden', text: 'Setting up was so easy. My whole store was live in under an hour. The support team is always there.', avatar: 'AP', rating: 5 },
]

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
]

export default function LandingPage() {
  const { setView } = useAppStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Navbar ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={() => setView('landing')} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:shadow-blue-600/50 transition-shadow">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Online Vepar</span>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(l => (
              <a key={l.label} href={l.href} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setView('login')}>Sign In</Button>
            <Button size="sm" className="btn-premium btn-glow rounded-lg" onClick={() => setView('register')}>
              Start Free <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>

          <button className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 pb-4 space-y-1">
            {navLinks.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
                className="flex items-center h-10 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
                {l.label}
              </a>
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setView('login')}>Sign In</Button>
              <Button size="sm" className="flex-1 btn-premium" onClick={() => setView('register')}>Start Free</Button>
            </div>
          </motion.div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center pt-16 hero-gradient-animate overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-orb-1" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-orb-2" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 text-center">
          <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
            <motion.div variants={fadeUp}>
              <Badge className="badge-emerald px-4 py-1.5 text-xs font-semibold rounded-full inline-flex items-center gap-2 mb-4">
                <Sparkles className="w-3 h-3" />
                India's #1 E-Commerce Platform for SMBs
              </Badge>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-[1.05]">
              Build your store,{' '}
              <span className="gradient-text">scale your</span>{' '}
              <br className="hidden sm:block" />
              <span className="gradient-text">business</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The all-in-one platform to launch, manage, and grow your online store. From products to payments — everything you need, nothing you don&apos;t.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button size="lg" className="btn-premium btn-glow h-12 px-8 text-base rounded-xl font-semibold w-full sm:w-auto" onClick={() => setView('register')}>
                Start for free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="h-12 px-8 text-base rounded-xl w-full sm:w-auto border-border/60 hover:bg-accent" onClick={() => setView('login')}>
                <Play className="w-4 h-4 mr-2 text-blue-600" />
                Watch demo
              </Button>
            </motion.div>

            <motion.p variants={fadeUp} className="text-xs text-muted-foreground pt-1">
              No credit card required · Free 14-day trial · Cancel anytime
            </motion.p>

            {/* Stats Row */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-8">
              {stats.map(s => (
                <div key={s.label} className="glass-card rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold gradient-text">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <Badge className="badge-emerald px-3 py-1 text-xs rounded-full mb-4">Features</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Everything you need to sell online</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Built for Indian entrepreneurs. Powerful enough for enterprises.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <div className="card-premium feature-card bg-card p-6 h-full">
                  <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <f.icon className={`w-6 h-6 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof / Stats Banner ── */}
      <section className="py-16 bg-blue-600 dark:bg-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
            {[
              { icon: ShoppingCart, value: '2M+', label: 'Orders Delivered' },
              { icon: Users, value: '50K+', label: 'Happy Merchants' },
              { icon: TrendingUp, value: '₹500Cr+', label: 'Revenue Generated' },
              { icon: Clock, value: '< 5 min', label: 'Average Setup Time' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="space-y-1">
                <s.icon className="w-7 h-7 mx-auto mb-2 opacity-80" />
                <div className="text-3xl font-bold">{s.value}</div>
                <div className="text-blue-100 text-sm">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <Badge className="badge-emerald px-3 py-1 text-xs rounded-full mb-4">Pricing</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground text-lg">No hidden fees. No surprises. Cancel anytime.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className={`rounded-2xl p-7 h-full flex flex-col border transition-all duration-300 hover:shadow-xl ${
                  plan.popular
                    ? 'bg-blue-600 text-white border-transparent shadow-xl shadow-blue-600/20'
                    : 'bg-card border-border hover:border-blue-200 dark:hover:border-blue-800'
                }`}>
                  {plan.popular && (
                    <Badge className="bg-white/20 text-white border-0 text-xs px-2.5 py-1 rounded-full w-fit mb-4">Most Popular</Badge>
                  )}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    <p className={`text-sm mb-4 ${plan.popular ? 'text-blue-100' : 'text-muted-foreground'}`}>{plan.desc}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className={`text-sm ${plan.popular ? 'text-blue-100' : 'text-muted-foreground'}`}>{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-3 flex-1 mb-7">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.popular ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/40'}`}>
                          <Check className={`w-3 h-3 ${plan.popular ? 'text-white' : 'text-blue-600'}`} />
                        </div>
                        <span className={plan.popular ? 'text-blue-50' : ''}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full h-10 rounded-xl font-medium ${
                      plan.popular
                        ? 'bg-white text-blue-700 hover:bg-blue-50'
                        : 'btn-premium btn-glow'
                    }`}
                    onClick={() => setView('register')}
                  >
                    Get started
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <Badge className="badge-emerald px-3 py-1 text-xs rounded-full mb-4">Testimonials</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Loved by 50,000+ merchants</h2>
            <p className="text-muted-foreground text-lg">Real stories from real businesses across India.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="card-premium testimonial-card bg-card p-6 h-full flex flex-col">
                  <div className="flex mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 star-filled" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-6">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-sm font-bold text-blue-700 dark:text-blue-300 shrink-0">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative bg-blue-600 rounded-3xl p-12 sm:p-16 overflow-hidden">
            <div className="absolute inset-0 dot-pattern opacity-10" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="relative">
              <Rocket className="w-12 h-12 text-white/80 mx-auto mb-6" />
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 tracking-tight">Ready to start selling?</h2>
              <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">Join 50,000+ merchants. Free 14-day trial. No credit card required.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 h-12 px-8 rounded-xl font-semibold text-base" onClick={() => setView('register')}>
                  Start for free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-12 px-8 rounded-xl font-semibold text-base" onClick={() => setView('login')}>
                  Sign in
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Store className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">Online Vepar</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              {['Privacy Policy', 'Terms of Service', 'Refund Policy', 'Contact Us'].map(l => (
                <a key={l} href="#" className="hover:text-foreground transition-colors">{l}</a>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">© 2025 Online Vepar. Made in 🇮🇳 India</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
