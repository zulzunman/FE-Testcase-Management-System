import { api } from './client';

export interface Feature {
  id: number;
  module: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: number;
  project: number;
  name: string;
  description: string;
  features: Feature[];
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  module_count: number;
  modules: Module[];
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Projects ---------------------------------------------------------------
export const fetchProjects = (params?: Record<string, string | number>) =>
  api.get<Paginated<Project>>('/projects/', { params }).then((r) => r.data);

export const fetchProject = (id: number) =>
  api.get<Project>(`/projects/${id}/`).then((r) => r.data);

export const createProject = (data: { name: string; description?: string }) =>
  api.post<Project>('/projects/', data).then((r) => r.data);

export const updateProject = (id: number, data: { name: string; description?: string }) =>
  api.put<Project>(`/projects/${id}/`, data).then((r) => r.data);

export const deleteProject = (id: number) =>
  api.delete(`/projects/${id}/`).then((r) => r.data);

// Modules ----------------------------------------------------------------
export const fetchModules = (projectId: number, params?: Record<string, string | number>) =>
  api.get<Paginated<Module>>(`/projects/${projectId}/modules/`, { params }).then((r) => r.data);

export const createModule = (projectId: number, data: { name: string; description?: string }) =>
  api.post<Module>(`/projects/${projectId}/modules/`, data).then((r) => r.data);

export const updateModule = (id: number, data: { name: string; description?: string }) =>
  api.put<Module>(`/modules/${id}/`, data).then((r) => r.data);

export const deleteModule = (id: number) => api.delete(`/modules/${id}/`).then((r) => r.data);

// Features ---------------------------------------------------------------
export const fetchFeatures = (moduleId: number, params?: Record<string, string | number>) =>
  api.get<Paginated<Feature>>(`/modules/${moduleId}/features/`, { params }).then((r) => r.data);

export const createFeature = (moduleId: number, data: { name: string; description?: string }) =>
  api.post<Feature>(`/modules/${moduleId}/features/`, data).then((r) => r.data);

export const updateFeature = (id: number, data: { name: string; description?: string }) =>
  api.put<Feature>(`/features/${id}/`, data).then((r) => r.data);

export const deleteFeature = (id: number) => api.delete(`/features/${id}/`).then((r) => r.data);