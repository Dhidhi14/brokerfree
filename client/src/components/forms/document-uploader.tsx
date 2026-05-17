import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { KYC_ACCEPT_STRING } from '@/constants/kyc.constants';
import { validateKycFile, isImageFile } from '@/lib/kyc-file-validation';
import { cn } from '@/lib/utils';

interface DocumentUploaderProps {
  label: string;
  accept?: string;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
}

export function DocumentUploader({
  label,
  accept = KYC_ACCEPT_STRING,
  selectedFile,
  onFileSelect,
}: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile || !isImageFile(selectedFile)) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) {
        setError(null);
        onFileSelect(null);
        return;
      }

      const validationError = validateKycFile(file);
      if (validationError) {
        setError(validationError);
        onFileSelect(null);
        return;
      }

      setError(null);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = () => {
    setError(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const showError = error !== null;
  const showSelected = selectedFile !== null && !showError;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {!showSelected ? (
        <div
          role="button"
          tabIndex={0}
          aria-label={`Upload ${label}`}
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
          onDrop={handleDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 transition-colors',
            showError
              ? 'border-destructive/50 bg-destructive/5'
              : isDragging
                ? 'border-primary bg-accent'
                : 'border-primary/30 bg-accent/30 hover:border-primary/60 hover:bg-accent/50'
          )}
        >
          <Upload
            className={cn(
              'mb-3 h-8 w-8',
              showError ? 'text-destructive' : 'text-primary'
            )}
          />
          <p className="text-sm font-medium text-foreground">
            Click to browse or drag and drop
          </p>
          <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, or PDF · Max 5MB</p>
          {showError ? (
            <p className="mt-2 text-sm text-destructive">{error}</p>
          ) : null}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-4">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={`${label} preview`}
              className="mb-3 max-h-40 w-full rounded-md object-contain"
            />
          ) : (
            <div className="mb-3 flex items-center gap-2 rounded-md bg-muted px-3 py-2">
              <FileText className="h-5 w-5 shrink-0 text-primary" />
              <span className="truncate text-sm font-medium">{selectedFile.name}</span>
            </div>
          )}
          <Button type="button" variant="outline" size="sm" onClick={handleRemove}>
            <X className="mr-1 h-4 w-4" />
            Remove
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          handleFile(file);
        }}
      />
    </div>
  );
}
