import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { MainLayout } from './layouts/MainLayout.js';
import { HomePage } from './pages/HomePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { RoleProtectedRoute } from './components/RoleProtectedRoute.js';
import { FarmerDashboard } from './dashboards/FarmerDashboard/FarmerDashboard.js';
import { OwnerDashboard } from './dashboards/OwnerDashboard/OwnerDashboard.js';
import { AdminDashboard } from './dashboards/AdminDashboard/AdminDashboard.js';
import { PaymentPage } from './pages/PaymentPage.js';
import { PublicSchemesPage } from './pages/PublicSchemesPage.js';
import { NotFound } from './components/NotFound.js';
import { Unauthorized } from './components/Unauthorized.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          {/* Public Pages with Standard Header/Footer */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/schemes" element={<PublicSchemesPage />} />
            <Route path="/payment/:paymentReference" element={<PaymentPage />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
          </Route>

          {/* Role-Protected Farmer Dashboard */}
          <Route
            path="/farmer/dashboard"
            element={
              <RoleProtectedRoute allowedRoles={['FARMER']}>
                <FarmerDashboard />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/farmer/schemes"
            element={
              <RoleProtectedRoute allowedRoles={['FARMER']}>
                <FarmerDashboard defaultTab="government-schemes" />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/farmer/resources"
            element={
              <RoleProtectedRoute allowedRoles={['FARMER']}>
                <FarmerDashboard defaultTab="farmer-resources" />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/farmer/schemes/saved"
            element={
              <RoleProtectedRoute allowedRoles={['FARMER']}>
                <FarmerDashboard defaultTab="saved-schemes" />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/farmer/notifications"
            element={
              <RoleProtectedRoute allowedRoles={['FARMER']}>
                <FarmerDashboard defaultTab="notifications" />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/farmer/favorites"
            element={
              <RoleProtectedRoute allowedRoles={['FARMER']}>
                <FarmerDashboard defaultTab="favorites" />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/farmer/ai"
            element={
              <RoleProtectedRoute allowedRoles={['FARMER']}>
                <FarmerDashboard defaultTab="ai-assistant" />
              </RoleProtectedRoute>
            }
          />

          {/* Role-Protected Owner Dashboard */}
          <Route
            path="/owner/dashboard"
            element={
              <RoleProtectedRoute allowedRoles={['OWNER']}>
                <OwnerDashboard />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/owner/notifications"
            element={
              <RoleProtectedRoute allowedRoles={['OWNER']}>
                <OwnerDashboard defaultTab="notifications" />
              </RoleProtectedRoute>
            }
          />

          {/* Role-Protected Admin Dashboard */}
          <Route
            path="/admin/dashboard"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard defaultTab="notifications" />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard defaultTab="reviews" />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/schemes"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard defaultTab="government-schemes" />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/resources"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard defaultTab="farmer-resources" />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/ai"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard defaultTab="ai-monitoring" />
              </RoleProtectedRoute>
            }
          />

          {/* 404 Fallback */}
          <Route
            path="*"
            element={
              <MainLayout>
                <NotFound />
              </MainLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ErrorBoundary>
  );
}
