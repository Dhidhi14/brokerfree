import { useNavigate } from 'react-router-dom';
import { Building2, Home } from 'lucide-react';
import { toast } from 'sonner';
import { RoleCard } from '@/components/auth/role-card';
import { getApiErrorMessage } from '@/lib/api-error';
import { getDashboardPath } from '@/lib/role-routes';
import { useUpdateRoleMutation } from '@/hooks/use-auth-mutations';

export function RegisterStepRole() {
  const navigate = useNavigate();
  const updateRole = useUpdateRoleMutation();

  const handleSelect = (role: 'tenant' | 'owner') => {
    updateRole.mutate(role, {
      onSuccess: (user) => {
        toast.success(`Welcome! You're set up as ${role === 'tenant' ? 'a tenant' : 'an owner'}.`);
        navigate(getDashboardPath(user.role), { replace: true });
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Failed to save your role'));
      },
    });
  };

  const loadingRole = updateRole.isPending ? updateRole.variables : null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        How will you use BrokerFree? You can update this later in settings.
      </p>
      <div className="grid gap-4 sm:grid-cols-1">
        <RoleCard
          icon={Home}
          title="I want to rent a home"
          description="Search verified listings, apply, and rent without brokers."
          onContinue={() => handleSelect('tenant')}
          isLoading={loadingRole === 'tenant'}
        />
        <RoleCard
          icon={Building2}
          title="I want to list my property"
          description="List your home, get verified tenants, and manage rentals digitally."
          onContinue={() => handleSelect('owner')}
          isLoading={loadingRole === 'owner'}
        />
      </div>
    </div>
  );
}
