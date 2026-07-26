import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as authApi from '@/api/auth.api';
import { Navbar } from '@/components/layout/navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  changePasswordFormSchema,
  updateProfileSchema,
  type ChangePasswordFormValues,
  type UpdateProfileValues,
} from '@/lib/auth-schemas';
import { useAuthStore } from '@/store/auth-store';

export function ProfileSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const profileForm = useForm<UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { fullName: user?.fullName ?? '' },
  });

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (user?.fullName) {
      profileForm.reset({ fullName: user.fullName });
    }
  }, [user?.fullName, profileForm]);

  const updateProfileMutation = useMutation({
    mutationFn: async (values: UpdateProfileValues) => {
      const response = await authApi.updateProfile(values.fullName);
      if (!response.success || !response.data?.user) {
        throw new Error(response.error?.message ?? 'Failed to update profile');
      }
      return response.data.user;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      toast.success('Profile updated');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to update profile'));
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (values: ChangePasswordFormValues) => {
      const response = await authApi.changePassword(
        values.currentPassword,
        values.newPassword
      );
      if (!response.success) {
        throw new Error(response.error?.message ?? 'Failed to change password');
      }
    },
    onSuccess: () => {
      passwordForm.reset();
      toast.success('Password updated');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to change password'));
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8 animate-slide-up md:py-12">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Profile Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Update your display name and password.
        </p>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
            <CardDescription>These details cannot be changed here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email ?? '—'}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">
                {user?.phone ? `+91 ${user.phone}` : '—'}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="secondary" className="capitalize">
                {user?.role ?? '—'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Full name</CardTitle>
            <CardDescription>This name appears across the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form
                onSubmit={profileForm.handleSubmit((values) =>
                  updateProfileMutation.mutate(values)
                )}
                className="space-y-4"
              >
                <FormField
                  control={profileForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your full name"
                          autoComplete="name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="brand-gradient text-primary-foreground hover:opacity-90"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Save name'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Change password</CardTitle>
            <CardDescription>
              Use at least 8 characters with uppercase, lowercase, and a number.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit((values) =>
                  changePasswordMutation.mutate(values)
                )}
                className="space-y-4"
              >
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm new password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  variant="outline"
                >
                  {changePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    'Update password'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
