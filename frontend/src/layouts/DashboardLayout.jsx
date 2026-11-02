import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  School,
  LayoutDashboard,
  GraduationCap,
  Users,
  CalendarCheck,
  CreditCard,
  FileSpreadsheet,
  Award,
  Activity,
  LogOut,
  Menu,
  X,
  Receipt,
  UserCheck,
  FileCheck
} from 'lucide-react';
import Badge from '../components/Badge';

export default function DashboardLayout({ children }) {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Separate Navigation Items per Role
  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { name: 'Executive Overview', path: '/admin', icon: LayoutDashboard, exact: true },
          { name: 'Academic Hierarchy', path: '/admin/academics', icon: GraduationCap },
          { name: 'Student Admissions', path: '/admin/students', icon: Users },
          { name: 'Staff Management', path: '/admin/staff', icon: UserCheck },
          { name: 'Timetable Builder', path: '/admin/timetables', icon: CalendarCheck },
          { name: 'Exam Terms & Papers', path: '/admin/examinations', icon: Award },
          { name: 'System Diagnostics', path: '/admin/diagnostics', icon: Activity }
        ];
      case 'accountant':
        return [
          { name: 'Financial Overview', path: '/accounts', icon: LayoutDashboard, exact: true },
          { name: 'Fee Configuration', path: '/accounts/fees', icon: CreditCard },
          { name: 'Bulk Vouchers', path: '/accounts/vouchers', icon: FileSpreadsheet },
          { name: 'Fee Collection POS', path: '/accounts/pos', icon: Receipt },
          { name: 'Staff Payroll', path: '/accounts/payroll', icon: Users }
        ];
      case 'teacher':
        return [
          { name: 'Teacher Overview', path: '/teacher', icon: LayoutDashboard, exact: true },
          { name: 'My Lecture Schedule', path: '/teacher/schedule', icon: CalendarCheck },
          { name: 'Exam Marks Entry', path: '/teacher/marks', icon: Award }
        ];
      case 'student':
        return [
          { name: 'Student Overview', path: '/student', icon: LayoutDashboard, exact: true },
          { name: 'My Class Timetable', path: '/student/timetable', icon: CalendarCheck },
          { name: 'Fee Vouchers & Bills', path: '/student/fees', icon: Receipt },
          { name: 'Report Card & Grades', path: '/student/report-card', icon: Award }
        ];
      default:
        return [{ name: 'Dashboard', path: '/', icon: LayoutDashboard }];
    }
  };

  const navItems = getNavItems();

  const roleBadgeVariants = {
    admin: 'danger',
    accountant: 'warning',
    teacher: 'info',
    student: 'success'
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="bg-emerald-600 p-1.5 rounded-lg">
            <School className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">AL SUFFA MIS</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar for Desktop & Mobile drawer */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block md:w-64 bg-slate-900 text-slate-300 shrink-0 md:sticky md:top-0 md:h-screen flex flex-col justify-between z-40`}
      >
        <div>
          {/* Logo Brand */}
          <div className="h-16 hidden md:flex items-center px-6 border-b border-slate-800 gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-900">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-base tracking-tight leading-tight">
                AL SUFFA
              </div>
              <div className="text-[10px] uppercase font-semibold text-emerald-400 tracking-widest">
                Education System
              </div>
            </div>
          </div>

          {/* User badge summary */}
          <div className="px-6 py-4 border-b border-slate-800/60 bg-slate-950/40">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Logged In Role
              </span>
              <Badge variant={roleBadgeVariants[role] || 'default'} size="sm">
                {role?.toUpperCase()}
              </Badge>
            </div>
            <div className="font-semibold text-white text-sm truncate">
              {user?.profile?.first_name
                ? `${user.profile.first_name} ${user.profile.last_name}`
                : user?.username}
            </div>
            <div className="text-xs text-slate-400 truncate">{user?.email}</div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname === item.path || location.pathname.startsWith(item.path + '/');

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-950/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 hidden md:flex items-center justify-between px-8 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Session:
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              2026-2027
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* System Diagnostics only visible to Super Admin */}
            {role === 'admin' && (
              <Link
                to="/admin/diagnostics"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition border border-emerald-200"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                <span>DB Online (19 Tables)</span>
              </Link>
            )}

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase">
                {user?.username?.slice(0, 2) || 'AS'}
              </div>
              <span className="text-xs font-semibold text-slate-700">
                {user?.username}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
