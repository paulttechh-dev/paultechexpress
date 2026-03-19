import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { Layout } from './components/Layout';
import { AuthGuard } from './components/AuthGuard';
import { Home } from './screens/Home';
import { Login } from './screens/Login';
import { ClientDashboard } from './screens/ClientDashboard';
import { MotoboyDashboard } from './screens/MotoboyDashboard';
import { AdminDashboard } from './screens/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            
            <Route 
              path="/dashboard" 
              element={
                <AuthGuard allowedRoles={['client']}>
                  <ClientDashboard />
                </AuthGuard>
              } 
            />
            
            <Route 
              path="/motoboy" 
              element={
                <AuthGuard allowedRoles={['motoboy']}>
                  <MotoboyDashboard />
                </AuthGuard>
              } 
            />
            
            <Route 
              path="/admin" 
              element={
                <AuthGuard allowedRoles={['admin']}>
                  <AdminDashboard />
                </AuthGuard>
              } 
            />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
