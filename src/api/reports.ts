import { api } from './client';

export interface TestCaseSummary {
  total: number;
  draft: number;
  ready: number;
  in_progress: number;
  passed: number;
  failed: number;
  blocked: number;
}

export interface ExecutionSummary {
  total_executions: number;
  pass: number;
  fail: number;
  blocked: number;
  pass_rate: number;
  fail_rate: number;
  blocked_rate: number;
}

export interface RecentExecution {
  id: number;
  test_case_id: number;
  test_case_code: string;
  title: string;
  result: string;
  executor_name: string | null;
  execution_date: string;
}

export interface ProjectProgress {
  project_id: number;
  project_name: string;
  total: number;
  executed: number;
  progress: number;
}

export interface ModuleProgress {
  module_id: number;
  module_name: string;
  project_id: number;
  total: number;
  executed: number;
  progress: number;
}

export interface DashboardData {
  test_case_summary: TestCaseSummary;
  execution_summary: ExecutionSummary;
  progress: number;
  total_projects: number;
  total_modules: number;
  recent_executions: RecentExecution[];
}

export const fetchDashboard = () =>
  api.get<DashboardData>('/reports/dashboard/').then((r) => r.data);

export const fetchTestSummary = (params?: { project?: number; module?: number }) =>
  api.get<TestCaseSummary>('/reports/test-summary/', { params }).then((r) => r.data);

export const fetchExecutionSummary = (params?: { project?: number; module?: number }) =>
  api.get<ExecutionSummary>('/reports/execution-summary/', { params }).then((r) => r.data);

export const fetchProgress = (params?: { project?: number }) =>
  api
    .get<{ projects: ProjectProgress[]; modules?: ModuleProgress[] }>('/reports/progress/', { params })
    .then((r) => r.data);