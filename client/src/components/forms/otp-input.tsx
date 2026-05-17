import { useCallback, useEffect, useRef, type ClipboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  className,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  const updateValue = useCallback(
    (nextDigits: string[]) => {
      const cleaned = nextDigits.map((d) => (/\d/.test(d) ? d : '')).join('');
      onChange(cleaned);

      if (cleaned.length === length && onComplete) {
        onComplete(cleaned);
      }
    },
    [length, onChange, onComplete]
  );

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const focusAt = (index: number) => {
    const target = Math.max(0, Math.min(index, length - 1));
    inputRefs.current[target]?.focus();
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = [...digits.map((d) => (/\d/.test(d) ? d : ''))];

    if (!digit) {
      next[index] = '';
      updateValue(next);
      return;
    }

    next[index] = digit;
    updateValue(next);

    if (index < length - 1) {
      focusAt(index + 1);
    }
  };

  const handleKeyDown = (index: number, key: string) => {
    if (key === 'Backspace') {
      const current = digits[index]?.trim() ?? '';

      if (!current && index > 0) {
        const next = [...digits.map((d) => (/\d/.test(d) ? d : ''))];
        next[index - 1] = '';
        updateValue(next);
        focusAt(index - 1);
        return;
      }

      if (!current) {
        return;
      }

      const next = [...digits.map((d) => (/\d/.test(d) ? d : ''))];
      next[index] = '';
      updateValue(next);
    }

    if (key === 'ArrowLeft' && index > 0) {
      focusAt(index - 1);
    }

    if (key === 'ArrowRight' && index < length - 1) {
      focusAt(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);

    if (!pasted) {
      return;
    }

    onChange(pasted);

    if (pasted.length === length && onComplete) {
      onComplete(pasted);
    }

    focusAt(Math.min(pasted.length, length - 1));
  };

  return (
    <div className={cn('flex justify-center gap-2 sm:gap-3', className)}>
      {Array.from({ length }).map((_, index) => (
        <Input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          disabled={disabled}
          value={digits[index]?.trim() ?? ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e.key)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            'h-12 w-11 text-center text-lg font-semibold sm:h-14 sm:w-12',
            'p-0'
          )}
          aria-label={`Digit ${index + 1} of ${length}`}
        />
      ))}
    </div>
  );
}
