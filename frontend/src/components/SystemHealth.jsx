import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Database,
  Server,
  Layers,
  Clock,
  AlertTriangle,
  Terminal,
  ShieldCheck
} from 'lucide-react';

const API_HEALTH_URL = 'http://localhost:5000/api/v1/health';

export default function SystemHealth() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [latencyMs, setLatencyMs] = useState(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const response = await axios.get(API_HEALTH_URL, {
        timeout: 5000
      });
      const endTime = performance.now();
      setLatencyMs(Math.round(endTime - startTime));
      setHealthData(response.data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      const endTime = performance.now();
      setLatencyMs(Math.round(endTime - startTime));
      if (err.response && err.response.data) {
        setHealthData(err.response.data);
        setError(err.response.data.error || 'Backend returned an unhealthy status.');
      } else if (err.code === 'ECONNABORTED') {
        setError('Connection timed out. Express server is not responding at port 5000.');
      } else {
        setError(err.message || 'Unable to reach backend server at http://localhost:5000.');
      }
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const isConnected = healthData?.status === 'online' && healthData?.database === 'connected';

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Al Suffa MIS Health Monitor
              </h1>
              <p className="text-sm text-slate-500">
                Core System Architecture & MySQL Database Verification
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-medium rounded-lg transition-all shadow-sm shadow-slate-300"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Checking...' : 'Recheck Health'}
        </button>
      </div>

      {/* Main Status Display */}
      {loading && !healthData ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="inline-flex p-4 rounded-full bg-slate-100 text-slate-600 mb-4 animate-spin">
            <RefreshCw className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">
            Running System Diagnostics
          </h3>
          <p className="text-sm text-slate-500">
            Querying Express backend & verifying MySQL schema at localhost:3306...
          </p>
        </div>
      ) : isConnected ? (
        /* Connected Status Card */
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0 mt-0.5">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-bold text-emerald-950">
                    System & Database Fully Operational
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    ONLINE
                  </span>
                </div>
                <p className="text-sm text-emerald-800 mt-1">
                  Express API is actively connected to the MySQL <code className="font-semibold">{healthData.database_name}</code> database. All required schema tables are present.
                </p>
              </div>
            </div>
          </div>

          {/* Metric cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Express Server */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider">Backend API</span>
                <Server className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 capitalize">
                {healthData.status}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span className="text-emerald-600 font-medium">HTTP 200 OK</span>
                {latencyMs !== null && <span>({latencyMs}ms)</span>}
              </p>
            </div>

            {/* Database Status */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider">Database</span>
                <Database className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 capitalize">
                {healthData.database}
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate" title={healthData.database_name}>
                Schema: <span className="font-medium text-slate-700">{healthData.database_name}</span>
              </p>
            </div>

            {/* Tables Detected */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider">Tables Detected</span>
                <Layers className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {healthData.tables_detected}
                <span className="text-sm font-normal text-slate-500"> / 19</span>
              </div>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                {healthData.tables_detected === 19 ? '100% Schema Complete' : 'Partial Tables Found'}
              </p>
            </div>

            {/* Diagnostics Time */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider">Last Sync</span>
                <Clock className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-lg font-bold text-slate-900">
                {lastChecked || 'Just now'}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Auto-refreshed on load
              </p>
            </div>
          </div>

          {/* Raw JSON inspection toggle */}
          <div className="bg-slate-900 text-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <Terminal className="w-4 h-4" />
                GET /api/v1/health Response
              </span>
              <span className="text-xs text-slate-400">application/json</span>
            </div>
            <pre className="font-mono text-xs overflow-x-auto text-emerald-300">
              {JSON.stringify(healthData, null, 2)}
            </pre>
          </div>
        </div>
      ) : (
        /* Disconnected / Error Card */
        <div className="space-y-6">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-xl bg-rose-500 text-white shrink-0 mt-0.5">
                <XCircle className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-bold text-rose-950">
                    System Diagnostic Alert: Connection Failed
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    DISCONNECTED
                  </span>
                </div>
                <p className="text-sm text-rose-800 mt-1">
                  {error || 'Unable to communicate with the Express server or MySQL database.'}
                </p>
              </div>
            </div>
          </div>

          {/* Troubleshooting Checklist */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-amber-700 font-semibold mb-4">
              <AlertTriangle className="w-5 h-5" />
              <h3>Troubleshooting & Resolution Steps</h3>
            </div>

            <ol className="list-decimal list-inside space-y-3 text-sm text-slate-700">
              <li className="leading-relaxed">
                <strong className="text-slate-900">Verify Express Backend Server:</strong> Ensure the Node.js server is running on <code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">http://localhost:5000</code>.
                <div className="mt-1 ml-5">
                  Run command: <code className="bg-slate-900 text-slate-100 px-2.5 py-1 rounded text-xs font-mono">npm run dev</code> inside <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs">/server</code>
                </div>
              </li>
              <li className="leading-relaxed">
                <strong className="text-slate-900">Verify MySQL Service:</strong> Ensure MySQL 8.0 is running locally on port <code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">3306</code>.
              </li>
              <li className="leading-relaxed">
                <strong className="text-slate-900">Check Database Credentials:</strong> Verify <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">server/.env</code> contains correct parameters:
                <pre className="mt-2 ml-5 bg-slate-900 text-slate-100 p-3 rounded-lg text-xs font-mono">
DB_HOST=127.0.0.1&#10;DB_PORT=3306&#10;DB_USER=root&#10;DB_PASSWORD=Akhunzada12!&#10;DB_NAME=school_management
                </pre>
              </li>
              <li className="leading-relaxed">
                <strong className="text-slate-900">Run CLI Direct Verification:</strong> Test MySQL connectivity directly from your terminal:
                <div className="mt-1 ml-5">
                  <code className="bg-slate-900 text-slate-100 px-2.5 py-1 rounded text-xs font-mono">node test-db.js</code>
                </div>
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

