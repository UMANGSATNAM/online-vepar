'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { LayoutTemplate, MonitorPlay, Smartphone, Save, Eye, Plus, GripVertical, Trash2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const AVAILABLE_SECTIONS = [
  { type: 'hero', name: 'Hero Banner' },
  { type: 'featured_collection', name: 'Featured Collection' },
  { type: 'rich_text', name: 'Rich Text' },
  { type: 'image_with_text', name: 'Image with Text' },
  { type: 'newsletter', name: 'Newsletter Signup' },
];

export default function StoreBuilderPage() {
  const { data: storeData } = useSWR('/api/stores/mine', fetcher);
  const storeId = storeData?.store?.id;

  const [activePage, setActivePage] = useState('home');
  const { data, mutate } = useSWR(storeId ? `/api/builder/page?storeId=${storeId}&slug=${activePage}` : null, fetcher);

  const [sections, setSections] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    if (data?.pageVersion?.sectionsJson) {
      try {
        setSections(JSON.parse(data.pageVersion.sectionsJson));
      } catch (e) {
        setSections([]);
      }
    } else {
      setSections([]); // Reset on new page load if empty
    }
  }, [data]);

  const handleAddSection = (type: string) => {
    setSections([...sections, { id: crypto.randomUUID(), type, settings: {} }]);
  };

  const handleRemoveSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sections.length - 1)) return;
    
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setSections(newSections);
  };

  const handleSave = async () => {
    if (!storeId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/builder/page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          pageSlug: activePage,
          sectionsJson: JSON.stringify(sections),
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Page saved successfully');
      mutate();
    } catch (err) {
      toast.error('Error saving page');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] -m-6 flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="h-14 border-b bg-white flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md">
            <LayoutTemplate className="w-4 h-4 text-gray-500" />
            <select 
              value={activePage} 
              onChange={e => setActivePage(e.target.value)}
              className="bg-transparent text-sm font-medium outline-none text-gray-700"
            >
              <option value="home">Home Page</option>
              <option value="product">Product Page</option>
              <option value="collection">Collection Page</option>
              <option value="cart">Cart Page</option>
            </select>
          </div>
          
          <Badge variant={data?.pageVersion?.isPublished ? 'default' : 'secondary'} className="font-normal">
            {data?.pageVersion?.isPublished ? 'Published (Live)' : 'Draft'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-gray-100 rounded-md mr-4">
            <button onClick={() => setDevice('desktop')} className={`p-1.5 rounded ${device === 'desktop' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
              <MonitorPlay className="w-4 h-4" />
            </button>
            <button onClick={() => setDevice('mobile')} className={`p-1.5 rounded ${device === 'mobile' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <a href={`http://${storeData?.store?.slug}.localhost:3000`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="w-4 h-4" /> Preview
            </Button>
          </a>
          <Button size="sm" className="gap-2" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main Builder Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Sections */}
        <div className="w-72 bg-white border-r overflow-y-auto flex flex-col">
          <div className="p-4 border-b bg-gray-50/50">
            <h3 className="font-semibold text-sm text-gray-900 mb-1">Page Sections</h3>
            <p className="text-xs text-gray-500">Drag or reorder sections below</p>
          </div>
          
          <div className="flex-1 p-3 space-y-2 overflow-y-auto">
            {sections.map((section, idx) => (
              <div key={section.id} className="flex items-center gap-2 p-2 bg-white border rounded-md shadow-sm group hover:border-indigo-200 transition-colors">
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveSection(idx, 'up')} disabled={idx === 0} className="text-gray-300 hover:text-indigo-600 disabled:opacity-30">
                    <GripVertical className="w-3 h-3" />
                  </button>
                  <button onClick={() => moveSection(idx, 'down')} disabled={idx === sections.length - 1} className="text-gray-300 hover:text-indigo-600 disabled:opacity-30">
                    <GripVertical className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 text-sm font-medium text-gray-700 capitalize">
                  {section.type.replace('_', ' ')}
                </div>
                <button onClick={() => handleRemoveSection(section.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {sections.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-500 border border-dashed rounded-md bg-gray-50">
                No sections added yet
              </div>
            )}
          </div>

          {/* Add Section Library */}
          <div className="p-4 border-t bg-gray-50 mt-auto">
            <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-3">Add Section</h4>
            <div className="grid grid-cols-1 gap-2">
              {AVAILABLE_SECTIONS.map(s => (
                <button
                  key={s.type}
                  onClick={() => handleAddSection(s.type)}
                  className="flex items-center justify-between p-2 text-sm text-gray-600 bg-white border border-gray-200 rounded hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                >
                  {s.name}
                  <Plus className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Canvas */}
        <div className="flex-1 bg-gray-100 p-8 overflow-y-auto flex justify-center items-start">
          <div className={`bg-white shadow-xl rounded-b-md border transition-all duration-300 overflow-hidden ${device === 'mobile' ? 'w-[375px] min-h-[812px]' : 'w-full max-w-[1200px] min-h-[800px]'}`}>
            {/* Fake Browser Header */}
            <div className="h-8 bg-gray-200 border-b flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <div className="mx-auto px-4 py-1 bg-white/50 rounded text-[10px] text-gray-500 font-mono w-1/2 text-center truncate">
                {storeData?.store?.slug}.onlinevepar.com
              </div>
            </div>

            {/* Simulated Storefront Content */}
            <div className="w-full h-full pb-20">
              {/* Header placeholder */}
              <div className="h-16 border-b flex items-center justify-between px-6 bg-white">
                <div className="font-bold text-lg">{storeData?.store?.name || 'My Store'}</div>
                <div className="flex gap-4 text-sm font-medium">
                  <div className="w-8 h-2 bg-gray-200 rounded" />
                  <div className="w-8 h-2 bg-gray-200 rounded" />
                  <div className="w-8 h-2 bg-gray-200 rounded" />
                </div>
              </div>

              {/* Sections render */}
              {sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-2">
                  <LayoutTemplate className="w-12 h-12 text-gray-300" />
                  <p>Start adding sections from the sidebar</p>
                </div>
              ) : (
                sections.map((section, idx) => (
                  <div key={section.id} className="relative group border-2 border-transparent hover:border-indigo-400 transition-colors">
                    {/* Visual hints for sections */}
                    <div className="absolute top-2 left-2 bg-indigo-500 text-white text-[10px] uppercase px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {section.type.replace('_', ' ')}
                    </div>

                    {section.type === 'hero' && (
                      <div className="h-96 bg-gray-100 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-3/4 h-12 bg-gray-300 rounded mb-4" />
                        <div className="w-1/2 h-4 bg-gray-200 rounded mb-8" />
                        <div className="w-32 h-10 bg-black rounded" />
                      </div>
                    )}
                    
                    {section.type === 'featured_collection' && (
                      <div className="py-16 px-8">
                        <div className="w-64 h-8 bg-gray-200 rounded mb-8" />
                        <div className="grid grid-cols-4 gap-4">
                          {[1,2,3,4].map(i => (
                            <div key={i} className="space-y-2">
                              <div className="aspect-square bg-gray-100 rounded-md" />
                              <div className="w-3/4 h-4 bg-gray-200 rounded" />
                              <div className="w-1/4 h-4 bg-gray-300 rounded" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {section.type === 'rich_text' && (
                      <div className="py-16 px-8 max-w-2xl mx-auto text-center">
                        <div className="w-1/2 h-8 bg-gray-300 rounded mx-auto mb-4" />
                        <div className="space-y-2">
                          <div className="w-full h-4 bg-gray-200 rounded" />
                          <div className="w-full h-4 bg-gray-200 rounded" />
                          <div className="w-3/4 h-4 bg-gray-200 rounded mx-auto" />
                        </div>
                      </div>
                    )}

                    {section.type === 'image_with_text' && (
                      <div className="py-16 px-8 flex items-center gap-8">
                        <div className="flex-1 aspect-video bg-gray-200 rounded" />
                        <div className="flex-1 space-y-4">
                          <div className="w-3/4 h-8 bg-gray-300 rounded" />
                          <div className="w-full h-4 bg-gray-200 rounded" />
                          <div className="w-5/6 h-4 bg-gray-200 rounded" />
                          <div className="w-32 h-10 bg-black rounded mt-4" />
                        </div>
                      </div>
                    )}

                    {section.type === 'newsletter' && (
                      <div className="py-20 px-8 bg-indigo-50 flex flex-col items-center justify-center text-center">
                        <div className="w-1/3 h-6 bg-indigo-200 rounded mb-4" />
                        <div className="flex gap-2 w-full max-w-md">
                          <div className="flex-1 h-10 bg-white border border-indigo-100 rounded" />
                          <div className="w-24 h-10 bg-indigo-600 rounded" />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Footer placeholder */}
              <div className="h-32 bg-gray-900 mt-16 px-8 py-8">
                <div className="w-24 h-6 bg-gray-800 rounded mb-4" />
                <div className="w-48 h-4 bg-gray-800 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
