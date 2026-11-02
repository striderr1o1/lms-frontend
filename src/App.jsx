import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';
import { homePath } from './auth/session.js';
import Shell from './components/Shell.jsx';
import AdminPage from './pages/AdminPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import StudentCoursePage from './pages/StudentCoursePage.jsx';
import StudentHomePage from './pages/StudentHomePage.jsx';
import TeacherCoursePage from './pages/TeacherCoursePage.jsx';
import TeacherHomePage from './pages/TeacherHomePage.jsx';

function UnknownRedirect() {
  const { profile, ready } = useAuth();
  if (!ready) return <p className="status-page">Loading…</p>;
  if (!profile) return <Navigate to="/login" replace />;
  return <Navigate to={homePath(profile.role)} replace />;
}

function StudentRoute({ children }) {
  return (
    <ProtectedRoute role="student">
      <Shell>{children}</Shell>
    </ProtectedRoute>
  );
}

function TeacherRoute({ children }) {
  return (
    <ProtectedRoute role="teacher">
      <Shell>{children}</Shell>
    </ProtectedRoute>
  );
}

function AdminRoute({ children }) {
  return (
    <ProtectedRoute role="admin">
      <Shell>{children}</Shell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/student" element={<StudentRoute><StudentHomePage /></StudentRoute>} />
          <Route path="/student/courses/:id" element={<StudentRoute><StudentCoursePage /></StudentRoute>} />
          <Route path="/teacher" element={<TeacherRoute><TeacherHomePage /></TeacherRoute>} />
          <Route path="/teacher/courses/:id" element={<TeacherRoute><TeacherCoursePage /></TeacherRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="*" element={<UnknownRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
