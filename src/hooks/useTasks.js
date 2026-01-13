import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../integrations/api/client';
import { useAuth } from './useAuth.jsx';

// Get all tasks for a project
export function useTasks(projectId) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () =>
      apiClient.get(`/projects/${projectId}/tasks`),
    enabled: !!user && !!projectId,
  });
}

// Get single task
export function useTask(projectId, taskId) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () =>
      apiClient.get(`/projects/${projectId}/tasks/${taskId}`),
    enabled: !!projectId && !!taskId,
  });
}

// Create task
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) =>{

      console.log("data",data) ||
      apiClient.post(`/projects/${data?.project_id}/tasks`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });
}

// Update task
export function useUpdateTask(projectId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }) =>
      apiClient.put(`/projects/${projectId}/tasks/${id}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['task', data.id] });
    },
  });
}

// Delete task
export function useDeleteTask(projectId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId) =>
      apiClient.delete(`/projects/${projectId}/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });
}
