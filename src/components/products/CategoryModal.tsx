import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

export function CategoryModal({
  open,
  onOpenChange,
  storeId,
  onSuccess
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeId: string
  onSuccess: () => void
}) {
  const { toast } = useToast()
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryImage, setNewCategoryImage] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !storeId) return
    setIsCreatingCategory(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          image: newCategoryImage.trim() || null,
          storeId: storeId,
        }),
      })
      if (!res.ok) throw new Error('Failed to create category')
      toast({ title: 'Success', description: 'Category created' })
      setNewCategoryName('')
      setNewCategoryImage('')
      onOpenChange(false)
      onSuccess()
    } catch {
      toast({ title: 'Error', description: 'Failed to create category', variant: 'destructive' })
    } finally {
      setIsCreatingCategory(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>Create a new product category</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Category Name</Label>
            <Input
              id="cat-name"
              placeholder="e.g., Electronics"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-image">Image URL (optional)</Label>
            <Input
              id="cat-image"
              placeholder="https://..."
              value={newCategoryImage}
              onChange={(e) => setNewCategoryImage(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateCategory}
            disabled={isCreatingCategory || !newCategoryName.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white button-press"
          >
            {isCreatingCategory ? 'Creating...' : 'Create Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
