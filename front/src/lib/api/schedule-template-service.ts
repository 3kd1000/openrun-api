import axiosInstance from "@/services/api/axiosInstance";
import { getOpenRunSession } from "@/utils/openrunSession";
import type {
  ScheduleTemplate,
  CreateScheduleTemplateRequest,
  UpdateScheduleTemplateRequest,
} from "@/lib/types/schedule-template";

function getUserId(): number | undefined {
  return getOpenRunSession().userId;
}

export const getUserTemplates = async (): Promise<ScheduleTemplate[]> => {
  const response = await axiosInstance.get<ScheduleTemplate[]>(
    "/schedule-templates",
    { params: { userId: getUserId() } }
  );
  return response.data;
};

export const getTemplate = async (
  templateId: number
): Promise<ScheduleTemplate> => {
  const response = await axiosInstance.get<ScheduleTemplate>(
    `/schedule-templates/${templateId}`,
    { params: { userId: getUserId() } }
  );
  return response.data;
};

export const createTemplate = async (
  data: CreateScheduleTemplateRequest
): Promise<ScheduleTemplate> => {
  const response = await axiosInstance.post<ScheduleTemplate>(
    "/schedule-templates",
    data,
    { params: { userId: getUserId() } }
  );
  return response.data;
};

export const updateTemplate = async (
  templateId: number,
  data: UpdateScheduleTemplateRequest
): Promise<ScheduleTemplate> => {
  const response = await axiosInstance.put<ScheduleTemplate>(
    `/schedule-templates/${templateId}`,
    data,
    { params: { userId: getUserId() } }
  );
  return response.data;
};

export const deleteTemplate = async (templateId: number): Promise<void> => {
  await axiosInstance.delete(`/schedule-templates/${templateId}`, {
    params: { userId: getUserId() },
  });
};
