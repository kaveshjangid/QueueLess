import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading QueueLess…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'staff' ? '/staff' : '/dashboard'} replace />;
}

function AppRoutes() {
  return <Routes>
    <Route path="/" element={<HomeRedirect/>}/>
    <Route path="/login" element={<Login/>}/>
    <Route path="/register" element={<Register/>}/>
    <Route path="/dashboard" element={<ProtectedRoute roles={['customer']}><Layout><CustomerDashboard/></Layout></ProtectedRoute>}/>
    <Route path="/staff" element={<ProtectedRoute roles={['staff','admin']}><Layout><StaffDashboard/></Layout></ProtectedRoute>}/>
    <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout><AdminDashboard/></Layout></ProtectedRoute>}/>
    <Route path="*" element={<HomeRedirect/>}/>
  </Routes>;
}

export default function App() {
  return <AuthProvider><AppRoutes/></AuthProvider>;
}
