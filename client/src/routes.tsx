import { Route, Routes } from 'react-router-dom';
import { GuestRoute } from '@/components/common/guest-route';
import { ProtectedRoute } from '@/components/common/protected-route';
import { AdminDashboardPage } from '@/pages/admin/dashboard';
import { AdminEscrowManagementPage } from '@/pages/admin/escrow-management';
import { AdminPropertyVerificationsPage } from '@/pages/admin/property-verifications';
import { AdminVerificationsPage } from '@/pages/admin/verifications';
import { HomePage } from '@/pages/home';
import { LoginPage } from '@/pages/auth/login';
import { RegisterPage } from '@/pages/auth/register';
import { VerifyOtpPage } from '@/pages/auth/verify-otp';
import { NotFoundPage } from '@/pages/not-found';
import { OwnerApplicationsPage } from '@/pages/owner/applications';
import { MyPropertiesPage } from '@/pages/owner/properties/index';
import { NewPropertyPage } from '@/pages/owner/properties/new';
import { OwnerVideoTourPage } from '@/pages/owner/properties/video-tour';
import { OwnerDashboardPage } from '@/pages/owner/dashboard';
import { OwnerKycPage } from '@/pages/owner/kyc';
import { PropertyDetailPage } from '@/pages/properties/detail';
import { PropertySearchPage } from '@/pages/properties/search';
import { ConversationsPage } from '@/pages/chat/conversations';
import { ChatThreadPage } from '@/pages/chat/thread';
import { AgreementDetailPage } from '@/pages/agreements/detail';
import { MyAgreementsPage } from '@/pages/agreements/my-agreements';
import { PhotoLockPage } from '@/pages/agreements/photo-lock';
import { MyEscrowsPage } from '@/pages/escrow/my-escrows';
import { TenantApplicationsPage } from '@/pages/tenant/applications';
import { TenantDashboardPage } from '@/pages/tenant/dashboard';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/properties" element={<PropertySearchPage />} />
      <Route path="/properties/:id" element={<PropertyDetailPage />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ConversationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:conversationId"
        element={
          <ProtectedRoute>
            <ChatThreadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agreements"
        element={
          <ProtectedRoute allowedRoles={['tenant', 'owner']}>
            <MyAgreementsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agreements/:id"
        element={
          <ProtectedRoute allowedRoles={['tenant', 'owner']}>
            <AgreementDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agreements/:agreementId/photo-lock"
        element={
          <ProtectedRoute allowedRoles={['tenant', 'owner']}>
            <PhotoLockPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/escrow"
        element={
          <ProtectedRoute allowedRoles={['tenant', 'owner']}>
            <MyEscrowsPage />
          </ProtectedRoute>
        }
      />
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
        path="/tenant/applications"
        element={
          <ProtectedRoute allowedRoles={['tenant']}>
            <TenantApplicationsPage />
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
        path="/owner/applications"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerApplicationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/kyc"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerKycPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/properties"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <MyPropertiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/properties/new"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <NewPropertyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/properties/:id/video-tour"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerVideoTourPage />
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
      <Route
        path="/admin/verifications"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminVerificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/property-verifications"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPropertyVerificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/escrow"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminEscrowManagementPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
