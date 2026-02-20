import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/lib/api/schedule-template-service";
import type {
  CreateScheduleTemplateRequest,
  UpdateScheduleTemplateRequest,
} from "@/lib/types/schedule-template";
import { ensureArray } from "@/lib/utils/safe";

export const templateKeys = {
  all: ["schedule-templates"] as const,
  list: () => [...templateKeys.all, "list"] as const,
};

export function useScheduleTemplates() {
  return useQuery({
    queryKey: templateKeys.list(),
    queryFn: getUserTemplates,
    select: ensureArray,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateScheduleTemplateRequest) => createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateId,
      data,
    }: {
      templateId: number;
      data: UpdateScheduleTemplateRequest;
    }) => updateTemplate(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: number) => deleteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
  });
}
