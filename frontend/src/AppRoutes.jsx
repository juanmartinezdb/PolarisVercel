import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Calendar from './pages/Calendar';
import Logbook from './pages/Logbook';
import Compendium from './pages/Compendium';
import LoadingSpinner from './components/ui/LoadingSpinner';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <LoadingSpinner size="large" text="Loading Iter Polaris..." />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/calendar" replace />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/logbook" element={<Logbook />} />
        <Route path="/compendium" element={<Compendium />} />
        <Route path="*" element={<Navigate to="/calendar" replace />} />
      </Routes>
    </Layout>
  );
}

export default AppRoutes;