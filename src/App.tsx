import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectListPage from './pages/ProjectListPage';
import TestCaseDetailPage from './pages/testcases/TestCaseDetailPage';
import TestCaseFormPage from './pages/testcases/TestCaseFormPage';
import TestCaseListPage from './pages/testcases/TestCaseListPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectListPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/test-cases" element={<TestCaseListPage />} />
            <Route path="/test-cases/new" element={<TestCaseFormPage />} />
            <Route path="/test-cases/:id" element={<TestCaseDetailPage />} />
            <Route path="/test-cases/:id/edit" element={<TestCaseFormPage />} />
          </Route>
        </Route>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}