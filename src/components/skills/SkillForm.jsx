import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Sparkles } from 'lucide-react';
import { categories } from './CategoryFilter';

export default function SkillForm({ open, onClose, onSubmit, initialData, loading }) {
  const [formData, setFormData] = useState(initialData || {
    title: '',
    description: '',
    category: '',
    type: 'offering',
    availability: '',
    exchange_for: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            {initialData?.id ? 'Edit Skill' : 'Post a New Skill'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Type Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleChange('type', 'offering')}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.type === 'offering'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-2xl mb-2">🤲</div>
              <div className={`font-medium ${formData.type === 'offering' ? 'text-emerald-700' : 'text-slate-600'}`}>
                Offering
              </div>
              <div className="text-xs text-slate-500">I can help with this</div>
            </button>
            <button
              type="button"
              onClick={() => handleChange('type', 'requesting')}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.type === 'requesting'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-2xl mb-2">🙋</div>
              <div className={`font-medium ${formData.type === 'requesting' ? 'text-amber-700' : 'text-slate-600'}`}>
                Requesting
              </div>
              <div className="text-xs text-slate-500">I need help with this</div>
            </button>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Home electrical repairs"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
              className="h-11"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleChange('category', value)}
              required
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.filter(c => c.value !== 'all').map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your skill or what you need help with..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              required
              rows={4}
            />
          </div>

          {/* Availability */}
          <div className="space-y-2">
            <Label htmlFor="availability">Availability</Label>
            <Input
              id="availability"
              placeholder="e.g., Weekends, Evenings after 6pm"
              value={formData.availability}
              onChange={(e) => handleChange('availability', e.target.value)}
              className="h-11"
            />
          </div>

          {/* Exchange For */}
          <div className="space-y-2">
            <Label htmlFor="exchange_for">
              {formData.type === 'offering' ? 'What would you like in exchange?' : 'What can you offer in return?'}
            </Label>
            <Input
              id="exchange_for"
              placeholder="e.g., Cooking lessons, gardening help, or anything!"
              value={formData.exchange_for}
              onChange={(e) => handleChange('exchange_for', e.target.value)}
              className="h-11"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                initialData?.id ? 'Update Skill' : 'Post Skill'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}