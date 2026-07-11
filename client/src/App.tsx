import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import QuestionnaireList from './pages/QuestionnaireList';
import QuestionnaireEditor from './pages/QuestionnaireEditor';
import QuestionnaireCreate from './pages/QuestionnaireCreate';
import DataManagement from './pages/DataManagement';
import Statistics from './pages/Statistics';
import ReportList from './pages/ReportList';
import ReportDetail from './pages/ReportDetail';
import AggregateAnalysisPage from './pages/AggregateAnalysis';
import FillQuestionnaire from './pages/FillQuestionnaire';
import RespondentReport from './pages/RespondentReport';
import DistributionPage from './pages/DistributionPage';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center min-h-screen text-text-muted">加载中...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/fill/:shareCode" element={<FillQuestionnaire />} />
      <Route path="/report/:responseId" element={<RespondentReport />} />

      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute><AppLayout /></ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="questionnaires" element={<QuestionnaireList />} />
        <Route path="questionnaires/new" element={<QuestionnaireCreate />} />
        <Route path="questionnaires/:id/edit" element={<QuestionnaireEditor />} />
        <Route path="data" element={<DataManagement />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="distribution" element={<DistributionPage />} />
        <Route path="reports" element={<ReportList />} />
        <Route path="reports/:id" element={<ReportDetail />} />
        <Route path="reports/aggregate" element={<AggregateAnalysisPage />} />
        <Route path="reports/config" element={<Navigate to="/reports" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
