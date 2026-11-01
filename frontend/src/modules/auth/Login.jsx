import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Lock, User, KeyRound, AlertCircle, Sparkles } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await login(username, password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'accountant') navigate('/accounts');
      else if (user.role === 'teacher') navigate('/teacher');
      else if (user.role === 'student') navigate('/student');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (roleName, uName) => {
    setUsername(uName);
    setPassword('password123');
    setError(null);
  };

  return (
    <AuthLayout>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Sign In to Portal
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Select your authorized credentials or use quick-fill below.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Username or Email"
          id="username"
          icon={User}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. admin or teacher1"
          required
        />

        <Input
          label="Password"
          id="password"
          type="password"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          required
        />

        <Button
          type="submit"
          loading={loading}
          icon={KeyRound}
          className="w-full mt-2"
          size="lg"
        >
          Authenticate & Enter
        </Button>
      </form>

      {/* Quick Fill Credentials Bar */}
      <div className="mt-6 pt-5 border-t border-slate-200">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Quick Demo Switcher (Pre-seeded Accounts)</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickFill('admin', 'admin')}
            className={`p-2 rounded-lg border text-left transition ${
              username === 'admin'
                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-semibold'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="font-bold">Super Admin</div>
            <div className="text-[10px] text-slate-500 font-mono">admin</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('accountant', 'accountant')}
            className={`p-2 rounded-lg border text-left transition ${
              username === 'accountant'
                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-semibold'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="font-bold">Accountant</div>
            <div className="text-[10px] text-slate-500 font-mono">accountant</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('teacher', 'teacher1')}
            className={`p-2 rounded-lg border text-left transition ${
              username === 'teacher1'
                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-semibold'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="font-bold">Teacher (Salman)</div>
            <div className="text-[10px] text-slate-500 font-mono">teacher1</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('student', 'student1')}
            className={`p-2 rounded-lg border text-left transition ${
              username === 'student1'
                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-semibold'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="font-bold">Student (Hamza)</div>
            <div className="text-[10px] text-slate-500 font-mono">student1</div>
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

