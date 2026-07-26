import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PHOTO_LOCK_ACCEPT_STRING,
  PHOTO_LOCK_MAX_PHOTOS,
  PROPERTY_AREA_LABELS,
  PROPERTY_AREAS,
} from '@/constants/photo-lock.constants';
import { isPropertyImageFile, validatePropertyPhoto } from '@/lib/property-file-validation';
import { cn } from '@/lib/utils';
import type { AreaPhotoSelection, PropertyArea } from '@/types/photo-lock.types';

interface AreaPhotoUploaderProps {
  value: AreaPhotoSelection[];
  onChange: (selections: AreaPhotoSelection[]) => void;
  disabled?: boolean;
}

interface AreaRowProps {
  area: PropertyArea;
  file: File | null;
  previewUrl: string | null;
  disabled: boolean;
  onSelect: (file: File) => void;
  onClear: () => void;
}

function AreaRow({ area, file, previewUrl, disabled, onSelect, onClear }: AreaRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    (incoming: FileList | File[]) => {
      if (disabled) return;

      const nextFile = Array.from(incoming)[0];
      if (!nextFile) return;

      const validationError = validatePropertyPhoto(nextFile);
      if (validationError) {
        setError(validationError);
        return;
      }
      if (!isPropertyImageFile(nextFile)) {
        setError('Only image files are allowed');
        return;
      }

      setError(null);
      onSelect(nextFile);
    },
    [disabled, onSelect]
  );

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-border/80 bg-background/80 p-3 sm:flex-row sm:items-center',
        file ? 'border-indigo-200/80' : null
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-700">
          <Camera className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-foreground">{PROPERTY_AREA_LABELS[area]}</p>
          <p className="text-xs text-muted-foreground">
            {file ? file.name : 'Optional — skip if not applicable'}
          </p>
          {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
        </div>
      </div>

      {previewUrl ? (
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border">
          <img
            src={previewUrl}
            alt={`${PROPERTY_AREA_LABELS[area]} preview`}
            className="h-full w-full object-cover"
          />
          {!disabled ? (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute right-1 top-1 h-6 w-6"
              onClick={() => {
                setError(null);
                onClear();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          ) : null}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={`Upload ${PROPERTY_AREA_LABELS[area]} photo`}
          aria-disabled={disabled}
          onKeyDown={(e: KeyboardEvent) => {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onClick={() => {
            if (!disabled) inputRef.current?.click();
          }}
          onDragOver={(e: DragEvent) => {
            if (disabled) return;
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e: DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e: DragEvent) => {
            if (disabled) return;
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files.length) {
              handleFiles(e.dataTransfer.files);
            }
          }}
          className={cn(
            'flex h-20 w-full shrink-0 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-2 transition-colors sm:w-40',
            disabled
              ? 'cursor-not-allowed opacity-60'
              : isDragging
                ? 'border-primary bg-accent'
                : 'border-primary/30 bg-accent/30 hover:border-primary/60 hover:bg-accent/50'
          )}
        >
          <Upload className="mb-1 h-4 w-4 text-primary" />
          <p className="text-center text-[11px] font-medium text-foreground">Add photo</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_LOCK_ACCEPT_STRING}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files?.length) {
            handleFiles(e.target.files);
          }
          e.target.value = '';
        }}
      />
    </div>
  );
}

export function AreaPhotoUploader({ value, onChange, disabled = false }: AreaPhotoUploaderProps) {
  const [previews, setPreviews] = useState<Partial<Record<PropertyArea, string>>>({});

  useEffect(() => {
    const next: Partial<Record<PropertyArea, string>> = {};
    value.forEach((item) => {
      next[item.area] = URL.createObjectURL(item.file);
    });
    setPreviews(next);

    return () => {
      Object.values(next).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [value]);

  const fileByArea = new Map(value.map((item) => [item.area, item.file]));

  const setAreaFile = (area: PropertyArea, file: File) => {
    const withoutArea = value.filter((item) => item.area !== area);
    if (withoutArea.length >= PHOTO_LOCK_MAX_PHOTOS) {
      return;
    }
    onChange([...withoutArea, { area, file }]);
  };

  const clearAreaFile = (area: PropertyArea) => {
    onChange(value.filter((item) => item.area !== area));
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Add at least one area photo. Skip rooms that don&apos;t apply to this property.
        {value.length > 0 ? (
          <span className="ml-1 font-medium text-foreground">
            {value.length}/{PHOTO_LOCK_MAX_PHOTOS} selected
          </span>
        ) : null}
      </p>

      <div className="space-y-2">
        {PROPERTY_AREAS.map((area) => (
          <AreaRow
            key={area}
            area={area}
            file={fileByArea.get(area) ?? null}
            previewUrl={previews[area] ?? null}
            disabled={disabled}
            onSelect={(file) => setAreaFile(area, file)}
            onClear={() => clearAreaFile(area)}
          />
        ))}
      </div>
    </div>
  );
}
