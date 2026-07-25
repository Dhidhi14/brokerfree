import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useRespondToApplicationMutation } from '@/hooks/use-applications';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  rejectApplicationSchema,
  type RejectApplicationValues,
} from '@/lib/application-schemas';

interface RespondDialogProps {
  applicationId: string;
  tenantName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RespondDialog({
  applicationId,
  tenantName,
  open,
  onOpenChange,
}: RespondDialogProps) {
  const respondMutation = useRespondToApplicationMutation();

  const form = useForm<RejectApplicationValues>({
    resolver: zodResolver(rejectApplicationSchema),
    defaultValues: {
      ownerResponse: '',
    },
  });

  const onSubmit = (values: RejectApplicationValues) => {
    respondMutation.mutate(
      {
        id: applicationId,
        decision: 'reject',
        ownerResponse: values.ownerResponse,
      },
      {
        onSuccess: () => {
          toast.success('Application rejected');
          form.reset();
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, 'Failed to reject application'));
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          form.reset();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject application</DialogTitle>
          <DialogDescription>
            Optionally share a short note with <span className="font-medium">{tenantName}</span>.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="ownerResponse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Response (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Looking for a longer lease term…"
                      className="min-h-[90px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={respondMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={respondMutation.isPending}>
                {respondMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting…
                  </>
                ) : (
                  'Reject application'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
