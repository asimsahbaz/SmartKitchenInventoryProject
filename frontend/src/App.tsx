import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import PantryPage from './pages/PantryPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-400">Loading...</div>
    </div>
  );
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  const init = useAuthStore(s => s.init);
  useEffect(() => { init(); }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <PantryPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
