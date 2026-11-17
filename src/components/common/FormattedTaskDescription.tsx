import React from 'react';
import { cn } from '../../lib/utils';

export function FormattedTaskDescription({ content, className = '' }: { content?: string; className?: string }) {
  if (!content || !content.trim()) {
    return <span className="text-zinc-400 italic">No description provided.</span>;
  }

  // Tokenize inline bold (**...** / <b>...</b> / <strong>...</strong>) and italic (*...* / <i>...</i> / <em>...</em>)
  const renderInline = (text: string) => {
    if (!text) return null;
    const tokenRegex = /(\*\*(?!\s)[^*]+(?<!\s)\*\*|\*(?!\s)[^*]+(?<!\s)\*|<(?:b|strong)>[\s\S]*?<\/(?:b|strong)>|<(?:i|em)>[\s\S]*?<\/(?:i|em)>)/g;
    const parts = text.split(tokenRegex);
    return parts.map((part, pIdx) => {
      if (!part) return null;
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return <strong key={pIdx} className="font-bold text-zinc-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return <em key={pIdx} className="italic text-zinc-800">{part.slice(1, -1)}</em>;
      }
      const bMatch = part.match(/^<(?:b|strong)>([\s\S]*?)<\/(?:b|strong)>$/i);
      if (bMatch) {
        return <strong key={pIdx} className="font-bold text-zinc-900">{bMatch[1]}</strong>;
      }
      const iMatch = part.match(/^<(?:i|em)>([\s\S]*?)<\/(?:i|em)>$/i);
      if (iMatch) {
        return <em key={pIdx} className="italic text-zinc-800">{iMatch[1]}</em>;
      }
      return part;
    });
  };

  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const elements: React.ReactNode[] = [];
  let currentBullets: string[] = [];
  let currentNumbers: string[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const pLines = [...currentParagraph];
      elements.push(
        <p key={`p-${elements.length}`} className="mb-2.5 last:mb-0 leading-relaxed text-zinc-600">
          {pLines.map((line, lIdx) => (
            <React.Fragment key={lIdx}>
              {renderInline(line)}
              {lIdx < pLines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      );
      currentParagraph = [];
    }
  };

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      const items = [...currentBullets];
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc pl-5 my-2 space-y-1 text-zinc-600">
          {items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      currentBullets = [];
    }
  };

  const flushNumbers = () => {
    if (currentNumbers.length > 0) {
      const items = [...currentNumbers];
      elements.push(
        <ol key={`ol-${elements.length}`} className="list-decimal pl-5 my-2 space-y-1 text-zinc-600">
          {items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
      currentNumbers = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushBullets();
      flushNumbers();
      flushParagraph();
      continue;
    }

    const bulletMatch = line.match(/^(\s*)(?:[-*•])\s+(.+)$/);
    if (bulletMatch) {
      flushNumbers();
      flushParagraph();
      currentBullets.push(bulletMatch[2]);
      continue;
    }

    const numberMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
    if (numberMatch) {
      flushBullets();
      flushParagraph();
      currentNumbers.push(numberMatch[2]);
      continue;
    }

    flushBullets();
    flushNumbers();
    currentParagraph.push(line);
  }

  flushBullets();
  flushNumbers();
  flushParagraph();

  return (
    <div className={cn("formatted-task-description whitespace-normal break-words", className)}>
      {elements}
    </div>
  );
}
