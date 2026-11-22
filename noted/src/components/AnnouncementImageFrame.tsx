import { useState } from 'react';
import { FileText } from 'lucide-react';

interface AnnouncementImageFrameProps {
  imageUrl: string | null;
  alt: string;
  fallbackTitle: string;
  className?: string;
}

export function AnnouncementImageFrame({
  imageUrl,
  alt,
  fallbackTitle,
  className = '',
}: AnnouncementImageFrameProps) {
  const [hasError, setHasError] = useState(false);

  if (!imageUrl || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-100 border border-slate-200 rounded-lg p-6 text-center ${className}`}
      >
        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 mb-3">
          <FileText className="w-5 h-5" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-slate-700 max-w-[22ch] line-clamp-2">
          {fallbackTitle}
        </p>
        <p className="text-xs text-slate-500 mt-1">Text-extracted record</p>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-lg border border-slate-100 bg-slate-50 ${className}`}>
      <img
        src={imageUrl}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className="w-full h-full object-contain"
      />
    </div>
  );
}
