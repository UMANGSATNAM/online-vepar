'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe, Plus, Trash2, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Domain {
  id: string
  domain: string
  isCustom: boolean
  isVerified: boolean
  sslStatus: string
  createdAt: string
}

export default function DomainSettings() {
  const { currentStore } = useAppStore()
  const { toast } = useToast()
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(false)
  const [newDomain, setNewDomain] = useState('')

  const fetchDomains = useCallback(async () => {
    if (!currentStore) return
    setLoading(true)
    try {
      const res = await fetch(`/api/domains?storeId=${currentStore.id}`)
      const data = await res.json()
      setDomains(data.domains || [])
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to fetch domains', variant: 'destructive' })
    }
    setLoading(false)
  }, [currentStore, toast])

  useEffect(() => {
    fetchDomains()
  }, [fetchDomains])

  const handleAddDomain = async () => {
    if (!newDomain || !currentStore) return
    
    // Basic domain validation
    if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(newDomain)) {
      toast({ title: 'Invalid Domain', description: 'Please enter a valid domain (e.g. www.mystore.com)', variant: 'destructive' })
      return
    }

    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: currentStore.id, domain: newDomain })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      toast({ title: 'Domain Added', description: 'Domain successfully added.' })
      setNewDomain('')
      fetchDomains()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to add domain', variant: 'destructive' })
    }
  }

  const handleDeleteDomain = async (id: string) => {
    if (!confirm('Are you sure you want to remove this domain?')) return
    try {
      const res = await fetch('/api/domains', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId: id })
      })
      if (!res.ok) throw new Error('Failed to delete')
      toast({ title: 'Domain Removed', description: 'Domain successfully removed.' })
      fetchDomains()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  if (!currentStore) return null

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Domains</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage how customers access your store</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Subdomain</CardTitle>
          <CardDescription>Your free subdomain provided by Online Vepar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/30 border rounded-lg">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">
                  {typeof window !== 'undefined' && window.location.hostname.includes('up.railway.app')
                    ? `${window.location.hostname}/store/${currentStore.slug}`
                    : `${currentStore.slug}.${process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'onlinevepar.com'}`}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-blue-500" /> Connected
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              const currentHostname = window.location.hostname;
              const isDev = currentHostname.includes('localhost') || currentHostname.includes('127.0.0.1');
              if (isDev) {
                window.open(`http://${currentStore.slug}.localhost:3000`, '_blank');
              } else if (currentHostname.includes('up.railway.app')) {
                window.open(`https://${currentHostname}/store/${currentStore.slug}`, '_blank');
              } else {
                window.open(`https://${currentStore.slug}.${currentHostname}`, '_blank');
              }
            }}>
              Visit <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Domains</CardTitle>
          <CardDescription>Connect a domain you already own (e.g. mystore.com)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Add existing domain</label>
              <Input
                placeholder="www.yourbrand.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value.toLowerCase())}
              />
            </div>
            <Button onClick={handleAddDomain}>
              <Plus className="w-4 h-4 mr-2" /> Connect
            </Button>
          </div>

          <div className="space-y-3">
            {domains.map(domain => (
              <div key={domain.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-lg">{domain.domain}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${domain.isVerified ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'}`}>
                        {domain.isVerified ? 'Verified' : 'Pending Verification'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${domain.sslStatus === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-muted text-muted-foreground'}`}>
                        SSL: {domain.sslStatus}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteDomain(domain.id)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {!domain.isVerified && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3">
                    <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4" /> Action Required: Configure DNS
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-500 mb-3">
                      To complete connection, log in to your domain provider (GoDaddy, Namecheap, etc.) and add the following CNAME record:
                    </p>
                    <div className="bg-white dark:bg-black/40 border border-amber-200 dark:border-amber-800/50 rounded overflow-hidden text-sm">
                      <table className="w-full text-left">
                        <thead className="bg-muted/50">
                          <tr><th className="px-3 py-2 font-medium">Type</th><th className="px-3 py-2 font-medium">Name / Host</th><th className="px-3 py-2 font-medium">Value / Target</th></tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-3 py-2 font-mono text-xs">CNAME</td>
                            <td className="px-3 py-2 font-mono text-xs">{domain.domain.startsWith('www') ? 'www' : '@'}</td>
                            <td className="px-3 py-2 font-mono text-xs text-blue-600 dark:text-blue-400">{currentStore.slug}.onlinevepar.com</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-amber-700/70 dark:text-amber-500/70 mt-3">
                      Note: DNS changes can take up to 48 hours to propagate globally.
                    </p>
                  </div>
                )}
              </div>
            ))}
            
            {!loading && domains.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                <Globe className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>No custom domains connected yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
