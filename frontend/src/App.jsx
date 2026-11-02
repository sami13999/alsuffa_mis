import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth
import Login from './modules/auth/Login';

// Super Admin Pages
import AdminOverviewPage from './modules/admin/AdminOverviewPage';
import AcademicManagementPage from './modules/admin/AcademicManagementPage';
import StudentAdmissionsPage from './modules/admin/StudentAdmissionsPage';
import StaffManagementPage from './modules/admin/StaffManagementPage';
import TimetableBuilderPage from './modules/admin/TimetableBuilderPage';
import ExamManagementPage from './modules/admin/ExamManagementPage';
import SystemDiagnosticsPage from './modules/admin/SystemDiagnosticsPage';

// Accounts Pages
import AccountsOverviewPage from './modules/accounts/AccountsOverviewPage';
import FeeConfigurationPage from './modules/accounts/FeeConfigurationPage';
import BulkVouchersPage from './modules/accounts/BulkVouchersPage';
import FeeCollectionPOSPage from './modules/accounts/FeeCollectionPOSPage';
import PayrollDisbursementPage from './modules/accounts/PayrollDisbursementPage';

// Teacher Pages
import TeacherOverviewPage from './modules/teacher/TeacherOverviewPage';
import TeacherSchedulePage from './modules/teacher/TeacherSchedulePage';
import ExamMarksEntryPage from './modules/teacher/ExamMarksEntryPage';

// Student Pages
import StudentOverviewPage from './modules/student/StudentOverviewPage';
import StudentTimetablePage from './modules/student/StudentTimetablePage';
import StudentFeeVouchersPage from './modules/student/StudentFeeVouchersPage';
import StudentReportCardPage from './modules/student/StudentReportCardPage';

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
    return <Navigate to="/" replace />;
  }

  return children;
}

// Root Role Dispatcher
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
          {/* Public Authentication */}
          <Route path="/login" element={<Login />} />

          {/* Root Role Dispatcher */}
          <Route path="/" element={<RootRedirect />} />

          {/* ======================================================== */}
          {/* 1. SUPER ADMIN DEDICATED ROUTES                          */}
          {/* ======================================================== */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminOverviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/academics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AcademicManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <StudentAdmissionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <StaffManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/timetables"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <TimetableBuilderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/examinations"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ExamManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/diagnostics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SystemDiagnosticsPage />
              </ProtectedRoute>
            }
          />

          {/* ======================================================== */}
          {/* 2. ACCOUNTS / BURSAR DEDICATED ROUTES                    */}
          {/* ======================================================== */}
          <Route
            path="/accounts"
            element={
              <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                <AccountsOverviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounts/fees"
            element={
              <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                <FeeConfigurationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounts/vouchers"
            element={
              <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                <BulkVouchersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounts/pos"
            element={
              <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                <FeeCollectionPOSPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounts/payroll"
            element={
              <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                <PayrollDisbursementPage />
              </ProtectedRoute>
            }
          />

          {/* ======================================================== */}
          {/* 3. TEACHER FACULTY DEDICATED ROUTES                      */}
          {/* ======================================================== */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                <TeacherOverviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/schedule"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                <TeacherSchedulePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/marks"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                <ExamMarksEntryPage />
              </ProtectedRoute>
            }
          />

          {/* ======================================================== */}
          {/* 4. STUDENT PORTAL DEDICATED ROUTES                       */}
          {/* ======================================================== */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['admin', 'student']}>
                <StudentOverviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/timetable"
            element={
              <ProtectedRoute allowedRoles={['admin', 'student']}>
                <StudentTimetablePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/fees"
            element={
              <ProtectedRoute allowedRoles={['admin', 'student']}>
                <StudentFeeVouchersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/report-card"
            element={
              <ProtectedRoute allowedRoles={['admin', 'student']}>
                <StudentReportCardPage />
              </ProtectedRoute>
            }
          />

          {/* Legacy alias */}
          <Route path="/health" element={<Navigate to="/admin/diagnostics" replace />} />

          {/* Fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
