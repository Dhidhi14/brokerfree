import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  PROPERTY_ACCEPT_STRING,
  PROPERTY_MAX_PHOTOS,
} from '@/constants/property.constants';
import { isPropertyImageFile, validatePropertyPhoto } from '@/lib/property-file-validation';
import { cn } from '@/lib/utils';

interface PhotoPreview {
  file: File;
  previewUrl: string;
}

interface PhotoUploaderProps {
  photos: File[];
  onChange: (photos: File[]) => void;
}

export function PhotoUploader({ photos, onChange }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<PhotoPreview[]>([]);

  useEffect(() => {
    const nextPreviews = photos.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPreviews(nextPreviews);

    return () => {
      nextPreviews.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [photos]);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const files = Array.from(incoming);
      if (!files.length) return;

      const remaining = PROPERTY_MAX_PHOTOS - photos.length;
      if (remaining <= 0) {
        setError(`Maximum ${PROPERTY_MAX_PHOTOS} photos allowed`);
        return;
      }

      const toAdd: File[] = [];
      for (const file of files.slice(0, remaining)) {
        const validationError = validatePropertyPhoto(file);
        if (validationError) {
          setError(validationError);
          return;
        }
        if (!isPropertyImageFile(file)) {
          setError('Only image files are allowed');
          return;
        }
        toAdd.push(file);
      }

      setError(null);
      onChange([...photos, ...toAdd]);
    },
    [onChange, photos]
  );

  const removePhoto = (index: number) => {
    setError(null);
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Property photos</Label>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload up to {PROPERTY_MAX_PHOTOS} photos. The first photo will be used as the cover
          image.
        </p>
      </div>

      {previews.length < PROPERTY_MAX_PHOTOS ? (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload property photos"
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
              addFiles(e.dataTransfer.files);
            }
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 transition-colors',
            error
              ? 'border-destructive/50 bg-destructive/5'
              : isDragging
                ? 'border-primary bg-accent'
                : 'border-primary/30 bg-accent/30 hover:border-primary/60 hover:bg-accent/50'
          )}
        >
          <Upload className={cn('mb-3 h-8 w-8', error ? 'text-destructive' : 'text-primary')} />
          <p className="text-sm font-medium text-foreground">Click to browse or drag and drop</p>
          <p className="mt-1 text-xs text-muted-foreground">
            JPG, PNG, or WEBP · Max 5MB each · {photos.length}/{PROPERTY_MAX_PHOTOS} uploaded
          </p>
          {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        </div>
      ) : null}

      {previews.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {previews.map((item, index) => (
            <div key={`${item.file.name}-${index}`} className="relative overflow-hidden rounded-lg border">
              <img
                src={item.previewUrl}
                alt={`Property photo ${index + 1}`}
                className="aspect-square w-full object-cover"
              />
              {index === 0 ? (
                <span className="absolute left-2 top-2 rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Cover
                </span>
              ) : null}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2 h-7 w-7"
                onClick={() => removePhoto(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={PROPERTY_ACCEPT_STRING}
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) {
            addFiles(e.target.files);
          }
          e.target.value = '';
        }}
      />
    </div>
  );
}
