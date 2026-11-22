import { useRef, useState } from 'react';
import { ImagePlus, Sparkles, Trash2, Upload } from 'lucide-react';
import type { SampleUploadPreset, UploadedImageState } from '../types/announcement';
import { SAMPLE_UPLOAD_PRESETS } from '../data/sampleAnnouncements';
import { AnnouncementImageFrame } from './AnnouncementImageFrame';

interface UploadViewProps {
  selectedImage: UploadedImageState | null;
  onSelectImage: (image: UploadedImageState | null) => void;
  onStartProcessing: () => void;
  uploadProgress: number | null;
  onCancel: () => void;
}

const ACCEPTED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function UploadView({
  selectedImage,
  onSelectImage,
  onStartProcessing,
  uploadProgress,
  onCancel,
}: UploadViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const isUploading = uploadProgress !== null;

  const handleFile = (file: File) => {
    setFileError(null);
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      setFileError('Please select a PNG, JPG, or WEBP announcement image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError('Image file size must be 10 MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        setFileError('Could not read the selected image file.');
        return;
      }

      const probe = new Image();
      probe.onload = () => {
        onSelectImage({
          imageUrl: dataUrl,
          imageName: file.name,
          fileSizeBytes: file.size,
          dimensionsLabel: `${probe.naturalWidth} × ${probe.naturalHeight} px`,
          presetId: null,
        });
      };
      probe.onerror = () => {
        onSelectImage({
          imageUrl: dataUrl,
          imageName: file.name,
          fileSizeBytes: file.size,
          dimensionsLabel: null,
          presetId: null,
        });
      };
      probe.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: SampleUploadPreset) => {
    setFileError(null);
    onSelectImage({
      imageUrl: preset.imageUrl,
      imageName: preset.imageName,
      fileSizeBytes: 390 * 1024,
      dimensionsLabel: 'Sample DCISM Notice',
      presetId: preset.id,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Upload Academic Announcement
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Upload a screenshot or photo of a DCISM notice. You will review all extracted details
            before saving.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={isUploading}
          className="self-start sm:self-auto px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Dropzone + Sample Presets */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <label htmlFor="announcement-file-input" className="sr-only">
              Upload announcement image
            </label>
            <input
              ref={fileInputRef}
              id="announcement-file-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = '';
              }}
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (!isUploading) setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (isUploading) return;
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging
                  ? 'border-blue-600 bg-blue-50/50'
                  : 'border-slate-300 bg-slate-50/60 hover:border-slate-400'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-blue-700 mb-4">
                <ImagePlus className="w-6 h-6" aria-hidden="true" />
              </div>

              <p className="text-sm font-semibold text-slate-900">
                Drag and drop an announcement screenshot here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports PNG, JPG, and WEBP up to 10 MB
              </p>

              <div className="mt-5">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors min-h-[40px] disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Choose Image File</span>
                </button>
              </div>
            </div>

            {fileError && (
              <p role="alert" className="mt-3 text-xs font-medium text-red-700">
                {fileError}
              </p>
            )}
          </div>

          {/* One-Click Sample DCISM Notices */}
          <section
            aria-labelledby="sample-notices-heading"
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <div>
              <h2
                id="sample-notices-heading"
                className="text-sm font-semibold text-slate-900"
              >
                Try with Sample DCISM Announcements
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Load a sample notice poster to test AI extraction and student review
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SAMPLE_UPLOAD_PRESETS.map((preset) => {
                const isSelected = selectedImage?.presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={isUploading}
                    onClick={() => handleSelectPreset(preset)}
                    className={`text-left p-3 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50 ${
                      isSelected
                        ? 'border-blue-700 bg-blue-50/50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-900 line-clamp-2">
                      {preset.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {preset.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right: Image Preview + Progress + Process CTA */}
        <aside className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Image Preview</h2>
            {selectedImage && !isUploading && (
              <button
                type="button"
                onClick={() => onSelectImage(null)}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-red-700 py-1"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Remove</span>
              </button>
            )}
          </div>

          {!selectedImage ? (
            <div className="border border-slate-200 rounded-lg bg-slate-50 h-72 flex flex-col items-center justify-center p-6 text-center">
              <p className="text-sm font-medium text-slate-700">No image selected</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Choose an announcement file or pick a sample DCISM poster to preview it here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnnouncementImageFrame
                imageUrl={selectedImage.imageUrl}
                alt={`Preview of ${selectedImage.imageName}`}
                fallbackTitle={selectedImage.imageName}
                className="h-72"
              />

              <div className="text-xs text-slate-600 space-y-1 border-t border-slate-100 pt-3">
                <p className="font-medium text-slate-900 truncate" title={selectedImage.imageName}>
                  {selectedImage.imageName}
                </p>
                <p className="font-mono tabular-nums text-slate-500">
                  {formatBytes(selectedImage.fileSizeBytes)}
                  {selectedImage.dimensionsLabel ? ` · ${selectedImage.dimensionsLabel}` : ''}
                </p>
              </div>
            </div>
          )}

          {/* Upload Progress Indicator */}
          {isUploading && (
            <div className="space-y-2 pt-1" aria-live="polite">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">Uploading announcement image</span>
                <span className="font-mono tabular-nums text-blue-700 font-semibold">
                  {uploadProgress}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={uploadProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-blue-700 transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={!selectedImage || isUploading}
            onClick={onStartProcessing}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors min-h-[44px] disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>{isUploading ? 'Uploading Image...' : 'Process Announcement'}</span>
          </button>
        </aside>
      </div>
    </div>
  );
}
