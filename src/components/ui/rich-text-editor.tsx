'use client'

import { forwardRef } from 'react'
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertTable,
  ListsToggle,
  linkPlugin,
  tablePlugin,
  MDXEditorMethods
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import { cn } from '@/lib/utils'

export interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export const RichTextEditor = forwardRef<MDXEditorMethods, RichTextEditorProps>(
  ({ value, onChange, placeholder, className, minHeight = '200px' }, ref) => {
    return (
      <div className={cn("border border-input rounded-md overflow-hidden bg-background focus-within:ring-1 focus-within:ring-ring", className)}>
        <MDXEditor
          ref={ref}
          markdown={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          contentEditableClassName="prose dark:prose-invert max-w-none px-4 py-3"
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            markdownShortcutPlugin(),
            linkPlugin(),
            tablePlugin(),
            toolbarPlugin({
              toolbarContents: () => (
                <div className="flex flex-wrap items-center gap-1 p-1 bg-muted/40 border-b border-input">
                  <UndoRedo />
                  <div className="w-px h-4 bg-border mx-1" />
                  <BlockTypeSelect />
                  <div className="w-px h-4 bg-border mx-1" />
                  <BoldItalicUnderlineToggles />
                  <div className="w-px h-4 bg-border mx-1" />
                  <ListsToggle />
                  <div className="w-px h-4 bg-border mx-1" />
                  <CreateLink />
                  <InsertTable />
                </div>
              )
            })
          ]}
        />
        <style jsx global>{`
          .mdxeditor {
            min-height: ${minHeight};
          }
          .mdxeditor-toolbar {
            border-bottom: 1px solid hsl(var(--border));
            background: hsl(var(--muted) / 0.4);
          }
          .mdxeditor-content {
            min-height: ${minHeight};
          }
        `}</style>
      </div>
    )
  }
)

RichTextEditor.displayName = 'RichTextEditor'
