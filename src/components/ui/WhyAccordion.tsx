import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, CheckCircle2 } from 'lucide-react';

export interface WhyAccordionProps {
  reasons: string[];
  title?: string;
  defaultExpanded?: boolean;
  className?: string;
}

export const WhyAccordion: React.FC<WhyAccordionProps> = ({
  reasons,
  title = 'Institutional Confluence & Evidence (Why this verdict)',
  defaultExpanded = true,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!reasons || reasons.length === 0) return null;

  return (
    <div
      className={`bg-[#131822] border border-white/10 rounded-xl overflow-hidden transition-colors ${className}`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-[#5b8cff] shrink-0" />
          <span className="text-xs font-semibold text-[#e8ecf4] tracking-tight">
            {title}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-[#a7b0c3] font-mono">
            {reasons.length}
          </span>
        </div>

        {expanded ? (
          <ChevronUp className="size-4 text-[#7c8699]" />
        ) : (
          <ChevronDown className="size-4 text-[#7c8699]" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-3.5 pt-1 space-y-2 border-t border-white/5">
          {reasons.map((reason, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-[#a7b0c3] leading-relaxed">
              <CheckCircle2 className="size-3.5 text-[#2ebd85] shrink-0 mt-0.5" />
              <span className="text-[#e8ecf4]">{reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WhyAccordion;
