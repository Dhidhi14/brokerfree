import { useEffect, useState, type ComponentProps } from 'react';
import { Input } from '@/components/ui/input';

interface WizardNumberInputProps extends Omit<
  ComponentProps<typeof Input>,
  'type' | 'value' | 'onChange' | 'onBlur'
> {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onBlur: () => void;
}

function toDisplayString(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) {
    return '';
  }
  return String(value);
}

export function WizardNumberInput({
  value,
  onChange,
  onBlur,
  ...props
}: WizardNumberInputProps) {
  // Display string is owned locally so keystrokes/backspace are never
  // overwritten by re-formatting field.value on each render.
  const [text, setText] = useState(() => toDisplayString(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setText(toDisplayString(value));
    }
  }, [value, isFocused]);

  return (
    <Input
      type="number"
      value={text}
      onFocus={() => setIsFocused(true)}
      onChange={(e) => {
        const next = e.target.value;
        setText(next);
        if (next === '') {
          onChange(undefined);
          return;
        }
        const parsed = e.target.valueAsNumber;
        onChange(Number.isNaN(parsed) ? undefined : parsed);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        onBlur();
        if (e.target.value === '' || Number.isNaN(e.target.valueAsNumber)) {
          onChange(undefined);
          setText('');
          return;
        }
        const parsed = e.target.valueAsNumber;
        onChange(parsed);
        setText(String(parsed));
      }}
      {...props}
    />
  );
}
