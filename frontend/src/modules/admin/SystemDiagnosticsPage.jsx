import React from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import SystemHealth from '../../components/SystemHealth';

export default function SystemDiagnosticsPage() {
  return (
    <DashboardLayout>
      <SystemHealth />
    </DashboardLayout>
  );
}

