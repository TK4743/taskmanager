import React, { useState, useRef } from 'react';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { cn } from '../../lib/utils';
import { FormattedTaskDescription } from './FormattedTaskDescription';

export function TaskDescriptionEditor({
  value,
  onChange,
  required = false,
  placeholder = "Task Description..."
}: {
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormatting = (type: 'bold' | 'italic' | 'bullet' | 'number') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    const selectedText = val.substring(start, end);

    let replacement = '';
    let selectStart = start;
    let selectEnd = start;

    if (type === 'bold') {
      if (selectedText) {
        if (selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length >= 4) {
          replacement = selectedText.slice(2, -2);
          selectStart = start;
          selectEnd = start + replacement.length;
        } else {
          replacement = `**${selectedText}**`;
          selectStart = start;
          selectEnd = start + replacement.length;
        }
      } else {
        replacement = '**bold text**';
        selectStart = start + 2;
        selectEnd = start + 11;
      }
    } else if (type === 'italic') {
      if (selectedText) {
        if (selectedText.startsWith('*') && selectedText.endsWith('*') && selectedText.length >= 2) {
          replacement = selectedText.slice(1, -1);
          selectStart = start;
          selectEnd = start + replacement.length;
        } else {
          replacement = `*${selectedText}*`;
          selectStart = start;
          selectEnd = start + replacement.length;
        }
      } else {
        replacement = '*italic text*';
        selectStart = start + 1;
        selectEnd = start + 12;
      }
    } else if (type === 'bullet') {
      if (selectedText) {
        const lines = selectedText.split('\n');
        const allBulleted = lines.every(l => l.startsWith('- '));
        replacement = lines.map(line => allBulleted ? (line.startsWith('- ') ? line.slice(2) : line) : (line.startsWith('- ') ? line : `- ${line}`)).join('\n');
        selectStart = start;
        selectEnd = start + replacement.length;
      } else {
        const before = val.substring(0, start);
        const needsNewline = before.length > 0 && !before.endsWith('\n');
        replacement = (needsNewline ? '\n' : '') + '- List item';
        selectStart = start + (needsNewline ? 3 : 2);
        selectEnd = start + replacement.length;
      }
    } else if (type === 'number') {
      if (selectedText) {
        const lines = selectedText.split('\n');
        const allNumbered = lines.every(l => /^\d+\.\s/.test(l));
        let count = 1;
        replacement = lines.map(line => {
          if (allNumbered) {
            return line.replace(/^\d+\.\s/, '');
          }
          const stripped = line.replace(/^\d+\.\s/, '');
          const res = `${count}. ${stripped}`;
          count++;
          return res;
        }).join('\n');
        selectStart = start;
        selectEnd = start + replacement.length;
      } else {
        const before = val.substring(0, start);
        const needsNewline = before.length > 0 && !before.endsWith('\n');
        replacement = (needsNewline ? '\n' : '') + '1. List item';
        selectStart = start + (needsNewline ? 4 : 3);
        selectEnd = start + replacement.length;
      }
    }

    const updated = val.substring(0, start) + replacement + val.substring(end);
    onChange(updated);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(selectStart, selectEnd);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      applyFormatting('bold');
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      applyFormatting('italic');
    }
  };

  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-white focus-within:ring-2 focus-within:ring-black/5 focus-within:border-black transition-all overflow-hidden shadow-xs">
      {/* Formatting Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-50 border-b border-zinc-200 text-zinc-600 select-none">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => applyFormatting('bold')}
            className="p-1.5 rounded-lg hover:bg-zinc-200 hover:text-zinc-900 active:scale-95 transition-all text-zinc-700 cursor-pointer"
            title="Bold (Ctrl+B)"
            aria-label="Bold"
          >
            <Bold size={15} />
          </button>
          <button
            type="button"
            onClick={() => applyFormatting('italic')}
            className="p-1.5 rounded-lg hover:bg-zinc-200 hover:text-zinc-900 active:scale-95 transition-all text-zinc-700 cursor-pointer"
            title="Italic (Ctrl+I)"
            aria-label="Italic"
          >
            <Italic size={15} />
          </button>
          <div className="h-4 w-[1px] bg-zinc-300 mx-1" />
          <button
            type="button"
            onClick={() => applyFormatting('bullet')}
            className="p-1.5 rounded-lg hover:bg-zinc-200 hover:text-zinc-900 active:scale-95 transition-all text-zinc-700 cursor-pointer"
            title="Bullet list"
            aria-label="Bullet list"
          >
            <List size={15} />
          </button>
          <button
            type="button"
            onClick={() => applyFormatting('number')}
            className="p-1.5 rounded-lg hover:bg-zinc-200 hover:text-zinc-900 active:scale-95 transition-all text-zinc-700 cursor-pointer"
            title="Numbered list"
            aria-label="Numbered list"
          >
            <ListOrdered size={15} />
          </button>
        </div>

        <div className="flex items-center gap-1 bg-zinc-200/70 p-0.5 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setIsPreview(false)}
            className={cn(
              "px-2.5 py-0.5 rounded-md transition-all cursor-pointer text-[11px]",
              !isPreview ? "bg-white text-zinc-900 shadow-xs font-bold" : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setIsPreview(true)}
            className={cn(
              "px-2.5 py-0.5 rounded-md transition-all cursor-pointer text-[11px]",
              isPreview ? "bg-white text-zinc-900 shadow-xs font-bold" : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      {!isPreview ? (
        <textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          required={required}
          className="w-full px-4 py-3 text-sm min-h-[120px] resize-y bg-white text-zinc-900 focus:outline-none border-0 block"
        />
      ) : (
        <div className="p-4 min-h-[120px] text-sm bg-white overflow-y-auto">
          {value ? (
            <FormattedTaskDescription content={value} />
          ) : (
            <span className="text-zinc-400 italic">No description entered yet. Switch to Write to enter text.</span>
          )}
        </div>
      )}
    </div>
  );
}



export default TaskDescriptionEditor;
