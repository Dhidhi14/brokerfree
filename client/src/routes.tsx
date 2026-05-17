import { Route, Routes } from 'react-router-dom';
import { GuestRoute } from '@/components/common/guest-route';
import { ProtectedRoute } from '@/components/common/protected-route';
import { AdminDashboardPage } from '@/pages/admin-dashboard';
import { HomePage } from '@/pages/home';
import { LoginPage } from '@/pages/auth/login';
import { RegisterPage } from '@/pages/auth/register';
import { VerifyOtpPage } from '@/pages/auth/verify-otp';
import { NotFoundPage } from '@/pages/not-found';
import { OwnerDashboardPage } from '@/pages/owner/dashboard';
import { TenantDashboardPage } from '@/pages/tenant/dashboard';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      {/* Register is NOT wrapped in GuestRoute — Step 1 sets auth session before OTP/role */}
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route
        path="/tenant"
        element={
          <ProtectedRoute allowedRoles={['tenant']}>
            <TenantDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
