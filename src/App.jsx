import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';
import AppShell from './components/layout/AppShell.jsx';
import { ToastProvider } from './components/primitives/Toast.jsx';
import AdminCoursesPage from './pages/admin/AdminCoursesPage.jsx';
import AdminOverviewPage from './pages/admin/AdminOverviewPage.jsx';
import AdminPeoplePage from './pages/admin/AdminPeoplePage.jsx';
import AuthPage from './pages/auth/AuthPage.jsx';
import DesignPage from './pages/DesignPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import StudentCoursePage from './pages/student/StudentCoursePage.jsx';
import StudentHomePage from './pages/student/StudentHomePage.jsx';
import TeacherCoursePage from './pages/teacher/TeacherCoursePage.jsx';
import TeacherHomePage from './pages/teacher/TeacherHomePage.jsx';
import { ThemeProvider } from './theme/ThemeContext.jsx';

function LegacyStudentCourseRedirect() {
  const { id } = useParams();
  return <Navigate to={`/courses/${id}`} replace />;
}

function StudentRoute({ children }) {
  return (
    <ProtectedRoute role="student">
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

function TeacherRoute({ children }) {
  return (
    <ProtectedRoute role="teacher">
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

function AdminRoute({ children }) {
  return (
    <ProtectedRoute role="admin">
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/signup" element={<AuthPage mode="signup" />} />
              <Route path="/courses" element={<StudentRoute><StudentHomePage /></StudentRoute>} />
              <Route path="/courses/:id" element={<StudentRoute><StudentCoursePage /></StudentRoute>} />
              <Route path="/student" element={<Navigate to="/courses" replace />} />
              <Route path="/student/courses/:id" element={<LegacyStudentCourseRedirect />} />
              <Route path="/teacher" element={<TeacherRoute><TeacherHomePage /></TeacherRoute>} />
              <Route path="/teacher/courses/:id" element={<TeacherRoute><TeacherCoursePage /></TeacherRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminOverviewPage /></AdminRoute>} />
              <Route path="/admin/courses" element={<AdminRoute><AdminCoursesPage /></AdminRoute>} />
              <Route path="/admin/people" element={<AdminRoute><AdminPeoplePage /></AdminRoute>} />
              <Route path="/_design" element={<DesignPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
