import { api } from './client';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  role_display: string;
  is_active: boolean;
}

export interface UserPayload {
  email: string;
  full_name: string;
  role: string;
  password?: string;
  is_active: boolean;
}

export interface PermissionDef {
  key: string;
  label: string;
}

export interface RoleMatrixEntry {
  role: string;
  label: string;
  permissions: string[];
}

export interface RolesMatrix {
  permissions: PermissionDef[];
  roles: RoleMatrixEntry[];
}

export const fetchUsers = () =>
  api.get<{ results: User[] }>('/users/', { params: { page_size: 100 } }).then((r) => r.data.results);

export const createUser = (data: UserPayload) =>
  api.post<User>('/users/', data).then((r) => r.data);

export const updateUser = (id: number, data: Partial<UserPayload>) =>
  api.put<User>(`/users/${id}/`, data).then((r) => r.data);

export const deleteUser = (id: number) => api.delete(`/users/${id}/`).then((r) => r.data);

export const fetchRolesMatrix = () => api.get<RolesMatrix>('/roles/').then((r) => r.data);

export const USER_ROLES = [
  'admin',
  'qa_lead',
  'qa_engineer',
  'developer',
  'product_manager',
] as const;