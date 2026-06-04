import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import StudentDashboard from './pages/student/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import CandidateRanking from './pages/admin/CandidateRanking';
import StudentsList from './pages/admin/StudentsList';
import InterviewPortal from './pages/InterviewPortal';

const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="h-screen w-full flex justify-center items-center">Loading...</div>;
  
  if (!user) return <Navigate to="/login" replace />;
  if (roleRequired && user.role !== roleRequired) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/student'} replace />;
  
  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/student'} replace /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/student'} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/student'} replace /> : <Register />} />
      <Route path="/interview/:token" element={<InterviewPortal />} />
      
      {/* Student Routes */}
      <Route path="/student/*" element={
        <ProtectedRoute roleRequired="STUDENT">
          <StudentDashboard />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute roleRequired="ADMIN">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/ranking/:companyId" element={
        <ProtectedRoute roleRequired="ADMIN">
          <CandidateRanking />
        </ProtectedRoute>
      } />
      <Route path="/admin/students" element={
        <ProtectedRoute roleRequired="ADMIN">
          <StudentsList />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
