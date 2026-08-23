import { api } from './client';
import type { Paginated } from './test-cases';

export interface ExecutionAttachment {
  id: number;
  url: string | null;
  file: string;
  uploaded_at: string;
}

export interface TestExecution {
  id: number;
  test_case: number;
  test_case_code: string;
  executor: number | null;
  executor_name: string | null;
  execution_date: string;
  result: string;
  actual_result: string;
  notes: string;
  attachments: ExecutionAttachment[];
}

export interface ExecutePayload {
  result: string;
  actual_result: string;
  notes: string;
  attachments?: File[];
}

export const executeTestCase = (testCaseId: number, payload: ExecutePayload) => {
  const form = new FormData();
  form.append('result', payload.result);
  form.append('actual_result', payload.actual_result);
  form.append('notes', payload.notes);
  payload.attachments?.forEach((f) => form.append('attachments', f));
  return api
    .post<{ execution: TestExecution; test_case_status: string }>(
      `/test-cases/${testCaseId}/execute/`,
      form,
    )
    .then((r) => r.data);
};

export const fetchExecutions = (testCaseId: number, params?: { page?: number; page_size?: number }) =>
  api.get<Paginated<TestExecution>>(`/test-cases/${testCaseId}/executions/`, { params }).then((r) => r.data);

export const TEST_RESULTS = ['pass', 'fail', 'blocked'] as const;