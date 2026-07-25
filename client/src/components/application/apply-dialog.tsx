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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateApplicationMutation } from '@/hooks/use-applications';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  applyApplicationSchema,
  getMinMoveInDateInput,
  type ApplyApplicationValues,
} from '@/lib/application-schemas';

interface ApplyDialogProps {
  propertyId: string;
  propertyTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplyDialog({
  propertyId,
  propertyTitle,
  open,
  onOpenChange,
}: ApplyDialogProps) {
  const createMutation = useCreateApplicationMutation();
  const minDate = getMinMoveInDateInput();

  const form = useForm<ApplyApplicationValues>({
    resolver: zodResolver(applyApplicationSchema),
    defaultValues: {
      message: '',
      moveInDate: minDate,
      occupants: 1,
    },
  });

  const onSubmit = (values: ApplyApplicationValues) => {
    createMutation.mutate(
      {
        propertyId,
        message: values.message,
        moveInDate: values.moveInDate,
        occupants: values.occupants,
      },
      {
        onSuccess: () => {
          toast.success('Application submitted');
          form.reset({ message: '', moveInDate: minDate, occupants: 1 });
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, 'Failed to submit application'));
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          form.reset({ message: '', moveInDate: minDate, occupants: 1 });
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply to this property</DialogTitle>
          <DialogDescription>
            Introduce yourself to the owner of <span className="font-medium">{propertyTitle}</span>.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell the owner about yourself, your work, and why this home fits…"
                      className="min-h-[110px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="moveInDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Move-in date</FormLabel>
                    <FormControl>
                      <Input type="date" min={minDate} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="occupants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occupants</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(event) => field.onChange(event.target.valueAsNumber || '')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="brand-gradient text-primary-foreground hover:opacity-90"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  'Submit application'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
