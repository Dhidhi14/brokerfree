import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Account' },
  { id: 2, label: 'Verify phone' },
  { id: 3, label: 'Your role' },
] as const;

interface RegisterStepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

export function RegisterStepIndicator({ currentStep }: RegisterStepIndicatorProps) {
  return (
    <nav aria-label="Registration progress" className="mb-8">
      <ol className="flex items-center gap-2">
        {STEPS.map((step, index) => {
          const isComplete = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <li key={step.id} className="flex flex-1 items-center gap-2">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    isComplete && 'bg-primary text-primary-foreground',
                    isCurrent && 'brand-gradient text-primary-foreground ring-2 ring-primary ring-offset-2',
                    !isComplete && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isComplete ? '✓' : step.id}
                </span>
                <span
                  className={cn(
                    'hidden truncate text-xs font-medium sm:block',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 ? (
                <div
                  className={cn(
                    'mb-5 h-0.5 flex-1 transition-colors sm:mb-0',
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  )}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
