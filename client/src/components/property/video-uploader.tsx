import {
  useCallback,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from 'react';
import { FileVideo, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PROPERTY_VIDEO_ACCEPT_STRING } from '@/constants/property.constants';
import { formatFileSize, validatePropertyVideo } from '@/lib/video-file-validation';
import { cn } from '@/lib/utils';

interface VideoUploaderProps {
  onSubmit: (file: File) => void;
  isSubmitting?: boolean;
}

export function VideoUploader({ onSubmit, isSubmitting = false }: VideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectFile = useCallback((incoming: FileList | File[]) => {
    const next = Array.from(incoming)[0];
    if (!next) return;

    const validationError = validatePropertyVideo(next);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }

    setError(null);
    setFile(next);
  }, []);

  const clearFile = () => {
    setError(null);
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Property video tour</Label>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload one short walkthrough video. AI will verify amenities against your listing.
        </p>
      </div>

      {!file ? (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload property video tour"
          onKeyDown={(e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e: DragEvent) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e: DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e: DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files.length) {
              selectFile(e.dataTransfer.files);
            }
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-10 transition-colors',
            error
              ? 'border-destructive/50 bg-destructive/5'
              : isDragging
                ? 'border-primary bg-accent'
                : 'border-primary/30 bg-accent/30 hover:border-primary/60 hover:bg-accent/50'
          )}
        >
          <Upload className={cn('mb-3 h-8 w-8', error ? 'text-destructive' : 'text-primary')} />
          <p className="text-sm font-medium text-foreground">Click to browse or drag and drop</p>
          <p className="mt-1 text-xs text-muted-foreground">MP4, MOV, or WEBM · Max 50MB</p>
          {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-accent/40 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FileVideo className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isSubmitting}
            onClick={clearFile}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <X className="mr-1 h-4 w-4" />
            Remove
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={PROPERTY_VIDEO_ACCEPT_STRING}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) {
            selectFile(e.target.files);
          }
          e.target.value = '';
        }}
      />

      <Button
        type="button"
        disabled={!file || isSubmitting}
        onClick={() => {
          if (file) onSubmit(file);
        }}
        className="w-full brand-gradient text-primary-foreground hover:opacity-90 sm:w-auto"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting…
          </>
        ) : (
          'Submit for Verification'
        )}
      </Button>
    </div>
  );
}
