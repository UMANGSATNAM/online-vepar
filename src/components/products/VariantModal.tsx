import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Layers, Tag, Minus, Plus } from 'lucide-react'
import { VariantFormData, VariantData } from './types'

interface VariantModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingVariantId: string | null
  variantFormData: VariantFormData
  setVariantFormData: React.Dispatch<React.SetStateAction<VariantFormData>>
  variants: VariantData[]
  handleSaveVariant: () => void
  isSavingVariant: boolean
}

export function VariantModal({
  open,
  onOpenChange,
  editingVariantId,
  variantFormData,
  setVariantFormData,
  variants,
  handleSaveVariant,
  isSavingVariant
}: VariantModalProps) {

  const handleUpdateOptionField = (index: number, field: 'key' | 'value', value: string) => {
    setVariantFormData(prev => {
      const newOptions = [...prev.options]
      newOptions[index] = { ...newOptions[index], [field]: value }
      return { ...prev, options: newOptions }
    })
  }

  const handleRemoveOptionField = (index: number) => {
    if (variantFormData.options.length <= 1) return
    setVariantFormData(prev => {
      const newOptions = [...prev.options]
      newOptions.splice(index, 1)
      return { ...prev, options: newOptions }
    })
  }

  const handleAddOptionField = () => {
    setVariantFormData(prev => ({
      ...prev,
      options: [...prev.options, { key: '', value: '' }]
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            {editingVariantId ? 'Edit Variant' : 'Add Variant'}
          </DialogTitle>
          <DialogDescription>
            {editingVariantId ? 'Update variant details for this product' : 'Create a new variant like a size, color, or material option'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2 max-h-[70vh] overflow-y-auto">
          {/* Variant Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Variant Name <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="e.g., Red / Large, Size M"
              value={variantFormData.name}
              onChange={(e) => setVariantFormData(prev => ({ ...prev, name: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">A descriptive name for this variant</p>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Tag className="w-3 h-3 text-emerald-600" /> Options
            </Label>
            <div className="space-y-2">
              {variantFormData.options.map((opt, idx) => (
                <div key={idx} className="option-field-card flex items-center gap-2">
                  <Input
                    placeholder="Option name (e.g., Color)"
                    value={opt.key}
                    onChange={(e) => handleUpdateOptionField(idx, 'key', e.target.value)}
                    className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                  />
                  <Input
                    placeholder="Value (e.g., Red)"
                    value={opt.value}
                    onChange={(e) => handleUpdateOptionField(idx, 'value', e.target.value)}
                    className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                    onClick={() => handleRemoveOptionField(idx)}
                    disabled={variantFormData.options.length <= 1}
                    title="Remove option"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddOptionField}
              className="w-full border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
              title="Add another option"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Option
            </Button>
          </div>

          {/* SKU */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">SKU</Label>
            <Input
              placeholder="e.g., SAR-001-RED-L"
              value={variantFormData.sku}
              onChange={(e) => setVariantFormData(prev => ({ ...prev, sku: e.target.value }))}
            />
          </div>

          {/* Price fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Price Override</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Same as product"
                  className="pl-7"
                  value={variantFormData.price}
                  onChange={(e) => setVariantFormData(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">Leave empty to use product price</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Compare-at Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Optional"
                  className="pl-7"
                  value={variantFormData.comparePrice}
                  onChange={(e) => setVariantFormData(prev => ({ ...prev, comparePrice: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Stock with real-time total preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Stock Quantity</Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={variantFormData.stock}
                onChange={(e) => setVariantFormData(prev => ({ ...prev, stock: e.target.value }))}
                className="w-32"
              />
              <div className="text-xs text-muted-foreground">
                Total across all variants: <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {variants.reduce((sum, v) => sum + v.stock, 0) + (parseInt(variantFormData.stock) || 0) - (editingVariantId ? (variants.find(v => v.id === editingVariantId)?.stock || 0) : 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-2 pt-1">
            <Switch
              id="variant-active"
              checked={variantFormData.isActive}
              onCheckedChange={(checked) => setVariantFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="variant-active" className="text-sm cursor-pointer">Active</Label>
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
            onClick={handleSaveVariant}
            disabled={isSavingVariant}
            className="btn-gradient text-white"
          >
            {isSavingVariant ? 'Saving...' : (editingVariantId ? 'Update Variant' : 'Create Variant')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
