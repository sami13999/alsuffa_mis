import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './modules/auth/Login';
import AdminDashboard from './modules/admin/AdminDashboard';
import AccountsDashboard from './modules/accounts/AccountsDashboard';
import TeacherDashboard from './modules/teacher/TeacherDashboard';
import StudentPortal from './modules/student/StudentPortal';
import SystemHealth from './components/SystemHealth';
import DashboardLayout from './layouts/DashboardLayout';

// Protected Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-300">Verifying Al Suffa Credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-2xl border border-rose-200 text-center shadow-sm">
          <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            &times;
          </div>
          <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Your user account does not possess the permissions required to view this module.
          </p>
          <a
            href="/"
            className="inline-flex px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            Return to Authorized Dashboard
          </a>
        </div>
      </DashboardLayout>
    );
  }

  return children;
}

// Root Dispatcher based on active role
function RootRedirect() {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'accountant') return <Navigate to="/accounts" replace />;
  if (role === 'teacher') return <Navigate to="/teacher" replace />;
  if (role === 'student') return <Navigate to="/student" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth */}
          <Route path="/login" element={<Login />} />

          {/* Root Role Dispatcher */}
          <Route path="/" element={<RootRedirect />} />

          {/* Super Admin Dashboard */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Accounts & Bursar Dashboard */}
          <Route
            path="/accounts/*"
            element={
              <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                <AccountsDashboard />
              </ProtectedRoute>
            }
          />

          {/* Teacher Faculty Dashboard */}
          <Route
            path="/teacher/*"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          {/* Student Portal */}
          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRoles={['admin', 'student']}>
                <StudentPortal />
              </ProtectedRoute>
            }
          />

          {/* Diagnostics View */}
          <Route
            path="/health"
            element={
              <DashboardLayout>
                <SystemHealth />
              </DashboardLayout>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
