import React from 'react';

interface FormattedMarkdownProps {
  content: string;
}

export const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({ content }) => {
  if (!content) return null;

  // Split lines
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;

  const renderInlineFormatted = (text: string): React.ReactNode => {
    // Process bold (**text**), code (`text`), italic (*text*)
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const raw = match[0];
      if (raw.startsWith('**') && raw.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-bold text-foreground">
            {raw.slice(2, -2)}
          </strong>
        );
      } else if (raw.startsWith('`') && raw.endsWith('`')) {
        const val = raw.slice(1, -1);
        const isPos = val.startsWith('+');
        const isNeg = val.startsWith('-');
        const colorClass = isPos
          ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
          : isNeg
          ? 'text-rose-500 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'
          : 'text-cyan-600 dark:text-cyan-300 bg-cyan-500/10 border-cyan-500/20';

        parts.push(
          <code
            key={match.index}
            className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold border ${colorClass}`}
          >
            {val}
          </code>
        );
      } else if (raw.startsWith('*') && raw.endsWith('*')) {
        parts.push(
          <em key={match.index} className="italic text-muted-foreground">
            {raw.slice(1, -1)}
          </em>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const flushTable = (keyPrefix: number) => {
    if (tableRows.length === 0) return null;
    const header = tableRows[0];
    const data = tableRows.slice(1);

    const tbl = (
      <div key={`table-${keyPrefix}`} className="my-3 overflow-x-auto rounded-xl border border-border bg-card/60 shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-secondary/80 text-foreground font-semibold">
              {header.map((col, idx) => (
                <th key={idx} className="p-2.5 font-mono text-[11px] tracking-wider uppercase">
                  {renderInlineFormatted(col.trim())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {data.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-secondary/40 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-2.5 font-medium text-foreground">
                    {renderInlineFormatted(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
    return tbl;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Table row detection
    if (line.startsWith('|') && line.endsWith('|')) {
      // Check if separator line
      if (line.includes('---')) {
        continue;
      }
      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      tableRows.push(cells);
      inTable = true;
      continue;
    } else if (inTable) {
      const tableElem = flushTable(i);
      if (tableElem) elements.push(tableElem);
    }

    // Horizontal Rule
    if (line === '---') {
      elements.push(<hr key={i} className="my-3 border-border/60" />);
      continue;
    }

    // Headings
    if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={i} className="text-sm font-bold text-foreground mt-3 mb-1.5 flex items-center gap-1.5">
          {renderInlineFormatted(line.slice(5))}
        </h4>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-base font-extrabold text-foreground tracking-tight mt-4 mb-2 pb-1 border-b border-border/60">
          {renderInlineFormatted(line.slice(4))}
        </h3>
      );
      continue;
    }

    // Bullet points
    if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(
        <div key={i} className="flex items-start gap-2 py-0.5 text-xs text-foreground/90">
          <span className="text-primary font-bold mt-0.5">•</span>
          <span className="flex-1 leading-relaxed">{renderInlineFormatted(line.slice(2))}</span>
        </div>
      );
      continue;
    }

    // Checkbox lists
    if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
      elements.push(
        <div key={i} className="flex items-center gap-2 py-1 px-2.5 rounded-lg bg-secondary/50 border border-border/50 text-xs text-foreground my-1">
          <span className="size-4 rounded border border-emerald-500/50 bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px] font-bold">
            ✓
          </span>
          <span>{renderInlineFormatted(line.slice(6))}</span>
        </div>
      );
      continue;
    }

    // Regular paragraph
    if (line.length > 0) {
      elements.push(
        <p key={i} className="text-xs leading-relaxed text-foreground/90 my-1">
          {renderInlineFormatted(line)}
        </p>
      );
    }
  }

  if (inTable) {
    const tableElem = flushTable(lines.length);
    if (tableElem) elements.push(tableElem);
  }

  return <div className="space-y-1 font-sans">{elements}</div>;
};
