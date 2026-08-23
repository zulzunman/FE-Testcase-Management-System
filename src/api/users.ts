import { api } from './client';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  role_display: string;
  is_active: boolean;
}

export const fetchUsers = () =>
  api.get<{ results: User[] }>('/users/', { params: { page_size: 100 } }).then((r) => r.data.results);
