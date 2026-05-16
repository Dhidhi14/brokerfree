import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/protected-route';
import { AdminDashboardPage } from '@/pages/admin-dashboard';
import { HomePage } from '@/pages/home';
import { LoginPage } from '@/pages/login';
import { NotFoundPage } from '@/pages/not-found';
import { OwnerDashboardPage } from '@/pages/owner-dashboard';
import { RegisterPage } from '@/pages/register';
import { TenantDashboardPage } from '@/pages/tenant-dashboard';
import { VerifyOtpPage } from '@/pages/verify-otp';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
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
