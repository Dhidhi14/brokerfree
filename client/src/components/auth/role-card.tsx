import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RoleCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onContinue: () => void;
  isLoading?: boolean;
}

export function RoleCard({
  icon: Icon,
  title,
  description,
  onContinue,
  isLoading = false,
}: RoleCardProps) {
  return (
    <Card
      className={cn(
        'transition-all hover:border-primary/50 hover:shadow-md',
        'focus-within:ring-2 focus-within:ring-ring'
      )}
    >
      <CardHeader className="pb-3">
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          className="w-full brand-gradient text-primary-foreground hover:opacity-90"
          onClick={onContinue}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Continuing…
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
