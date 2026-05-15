'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Plus, Search, Pencil, Trash2, Eye,
  Loader2, ArrowLeft, BookOpen, File as FileIcon
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

interface PageItem {
  id: string
  title: string
  slug: string
  content: string | null
  type: string
  published: boolean
  storeId: string
  createdAt: string
  updatedAt: string
}

type FilterType = 'all' | 'page' | 'blog'

export default function PagesPage() {
  const { currentStore } = useAppStore()
  const { toast } = useToast()

  const [pages, setPages] = useState<PageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Editor state
  const [editing, setEditing] = useState(false)
  const [editPage, setEditPage] = useState<PageItem | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formType, setFormType] = useState('page')
  const [formPublished, setFormPublished] = useState(false)

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Preview dialog
  const [previewPage, setPreviewPage] = useState<PageItem | null>(null)

  const fetchPages = useCallback(async () => {
    if (!currentStore?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/pages?storeId=${currentStore.id}`)
      if (res.ok) {
        const data = await res.json()
        setPages(data.pages || [])
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load pages', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [currentStore?.id, toast])

  useEffect(() => {
    fetchPages()
  }, [fetchPages])

  const handleTitleChange = (title: string) => {
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80)
    setFormTitle(title)
    setFormSlug(slug)
  }

  const openCreateEditor = () => {
    setEditPage(null)
    setFormTitle('')
    setFormSlug('')
    setFormContent('')
    setFormType('page')
    setFormPublished(false)
    setEditing(true)
  }

  const openEditEditor = (page: PageItem) => {
    setEditPage(page)
    setFormTitle(page.title)
    setFormSlug(page.slug)
    setFormContent(page.content || '')
    setFormType(page.type)
    setFormPublished(page.published)
    setEditing(true)
  }

  const closeEditor = () => {
    setEditing(false)
    setEditPage(null)
  }

  const savePage = async () => {
    if (!currentStore?.id || !formTitle.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      if (editPage) {
        // Update
        const res = await fetch(`/api/pages/${editPage.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle,
            content: formContent,
            type: formType,
            published: formPublished,
          }),
        })
        if (res.ok) {
          toast({ title: 'Page updated', description: `"${formTitle}" has been updated.` })
          fetchPages()
          closeEditor()
        } else {
          const error = await res.json()
          toast({ title: 'Error', description: error.error || 'Failed to update page', variant: 'destructive' })
        }
      } else {
        // Create
        const res = await fetch('/api/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle,
            slug: formSlug,
            content: formContent,
            type: formType,
            published: formPublished,
            storeId: currentStore.id,
          }),
        })
        if (res.ok) {
          toast({ title: 'Page created', description: `"${formTitle}" has been created.` })
          fetchPages()
          closeEditor()
        } else {
          const error = await res.json()
          toast({ title: 'Error', description: error.error || 'Failed to create page', variant: 'destructive' })
        }
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const deletePage = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/pages/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Page deleted', description: 'The page has been deleted.' })
        setPages(prev => prev.filter(p => p.id !== deleteId))
      } else {
        toast({ title: 'Error', description: 'Failed to delete page', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete page', variant: 'destructive' })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const filteredPages = pages.filter((page) => {
    const matchesFilter = filter === 'all' || page.type === filter
    const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Page Editor View
  if (editing) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={closeEditor}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-2xl font-bold text-foreground">
              {editPage ? 'Edit Page' : 'New Page'}
            </h1>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="page-title">Title</Label>
                  <Input
                    id="page-title"
                    value={formTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Enter page title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="page-slug">Slug</Label>
                  <Input
                    id="page-slug"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="page-slug"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Page Type</Label>
                <RadioGroup
                  value={formType}
                  onValueChange={setFormType}
                  className="flex items-center gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="page" id="type-page" />
                    <Label htmlFor="type-page" className="cursor-pointer flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      Page
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="blog" id="type-blog" />
                    <Label htmlFor="type-blog" className="cursor-pointer flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      Blog Post
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="page-content">Content</Label>
                <Textarea
                  id="page-content"
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Write your page content here... Supports plain text. Use line breaks for paragraphs."
                  rows={12}
                  className="min-h-[200px] resize-y"
                />
                <p className="text-xs text-muted-foreground">
                  Write your content above. Line breaks will be preserved.
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    id="page-published"
                    checked={formPublished}
                    onCheckedChange={setFormPublished}
                  />
                  <Label htmlFor="page-published" className="cursor-pointer">
                    {formPublished ? 'Published' : 'Draft'}
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={closeEditor}>
                    Cancel
                  </Button>
                  <Button
                    onClick={savePage}
                    disabled={saving || !formTitle.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {editPage ? 'Update Page' : 'Create Page'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Pages List View
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pages</h1>
            <p className="text-muted-foreground mt-1">Manage your store pages and blog posts</p>
          </div>
          <Button
            onClick={openCreateEditor}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Page
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center border rounded-md overflow-hidden">
          {(['all', 'page', 'blog'] as FilterType[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-3 rounded-none text-xs capitalize"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'page' ? 'Pages' : 'Blog Posts'}
            </Button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : filteredPages.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="text-center py-12">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileIcon className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">
                {pages.length === 0 ? 'Create your first page' : 'No pages found'}
              </CardTitle>
              <CardDescription>
                {pages.length === 0
                  ? 'Pages like About, Contact, and FAQ help customers learn more about your store.'
                  : 'Try adjusting your search or filter criteria.'}
              </CardDescription>
              {pages.length === 0 && (
                <Button
                  onClick={openCreateEditor}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-fit mx-auto mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Page
                </Button>
              )}
            </CardHeader>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredPages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{page.title}</p>
                          <p className="text-xs text-muted-foreground">/{page.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={page.type === 'blog' ? 'default' : 'secondary'} className="text-xs">
                          {page.type === 'blog' ? (
                            <><BookOpen className="w-3 h-3 mr-1" />Blog</>
                          ) : (
                            <><FileText className="w-3 h-3 mr-1" />Page</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={page.published ? 'default' : 'outline'}
                          className={`text-xs ${page.published ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : ''}`}
                        >
                          {page.published ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatDate(page.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setPreviewPage(page)}
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditEditor(page)}
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(page.id)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this page? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deletePage}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewPage} onOpenChange={(open) => !open && setPreviewPage(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewPage?.title}
              <Badge variant={previewPage?.type === 'blog' ? 'default' : 'secondary'} className="text-xs">
                {previewPage?.type === 'blog' ? 'Blog' : 'Page'}
              </Badge>
              <Badge
                variant={previewPage?.published ? 'default' : 'outline'}
                className={`text-xs ${previewPage?.published ? 'bg-blue-100 text-blue-700' : ''}`}
              >
                {previewPage?.published ? 'Published' : 'Draft'}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              /{previewPage?.slug} · Last updated {previewPage ? formatDate(previewPage.updatedAt) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm max-w-none mt-4">
            {previewPage?.content ? (
              previewPage.content.split('\n').map((paragraph, i) => (
                <p key={i} className="text-sm leading-relaxed text-foreground">
                  {paragraph || '\u00A0'}
                </p>
              ))
            ) : (
              <p className="text-muted-foreground italic">No content yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
