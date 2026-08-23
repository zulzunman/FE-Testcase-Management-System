import { api } from './client';

export interface TestCaseStep {
  id?: number;
  step_number: number;
  action: string;
  expected: string;
}

export interface TestCase {
  id: number;
  test_case_code: string;
  project: number;
  project_name: string;
  module: number;
  module_name: string;
  feature: number | null;
  feature_name: string | null;
  title: string;
  description: string;
  preconditions: string;
  expected_result: string;
  priority: string;
  status: string;
  assignee: number | null;
  assignee_name: string | null;
  tags: string[];
  steps: TestCaseStep[];
  created_by: number | null;
  created_by_name: string | null;
  modified_after_execution: boolean;
  created_at: string;
  updated_at: string;
}

export interface TestCasePayload {
  project: number;
  module: number;
  feature: number | null;
  title: string;
  description: string;
  preconditions: string;
  expected_result: string;
  priority: string;
  status: string;
  assignee: number | null;
  tag_names: string[];
  steps: { action: string; expected: string }[];
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface TestCaseQuery {
  search?: string;
  status?: string;
  priority?: string;
  project?: number;
  module?: number;
  feature?: number;
  assignee?: number;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export const fetchTestCases = (params?: TestCaseQuery) =>
  api.get<Paginated<TestCase>>('/test-cases/', { params }).then((r) => r.data);

export const fetchTestCase = (id: number) =>
  api.get<TestCase>(`/test-cases/${id}/`).then((r) => r.data);

export const createTestCase = (data: TestCasePayload) =>
  api.post<TestCase>('/test-cases/', data).then((r) => r.data);

export const updateTestCase = (id: number, data: TestCasePayload) =>
  api.put<TestCase>(`/test-cases/${id}/`, data).then((r) => r.data);

export const deleteTestCase = (id: number) =>
  api.delete(`/test-cases/${id}/`).then((r) => r.data);

export const duplicateTestCase = (id: number) =>
  api.post<TestCase>(`/test-cases/${id}/duplicate/`).then((r) => r.data);

// Options for select fields
export const TEST_CASE_STATUSES = [
  'draft',
  'ready',
  'in_progress',
  'passed',
  'failed',
  'blocked',
  'deprecated',
] as const;

export const TEST_CASE_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;