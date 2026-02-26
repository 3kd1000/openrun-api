import axiosInstance from './api/axiosInstance';
import type {
  ScheduleTemplate,
  CreateScheduleTemplateRequest,
  UpdateScheduleTemplateRequest
} from '../types/scheduleTemplate';

export const scheduleTemplateService = {
  // 템플릿 생성
  createTemplate: async (
    data: CreateScheduleTemplateRequest
  ): Promise<ScheduleTemplate> => {
    const response = await axiosInstance.post('/schedule-templates', data);
    return response.data;
  },

  // 사용자의 모든 템플릿 조회
  getUserTemplates: async (): Promise<ScheduleTemplate[]> => {
    const response = await axiosInstance.get('/schedule-templates');
    return response.data;
  },

  // 특정 템플릿 조회
  getTemplate: async (templateId: number): Promise<ScheduleTemplate> => {
    const response = await axiosInstance.get(`/schedule-templates/${templateId}`);
    return response.data;
  },

  // 템플릿 수정
  updateTemplate: async (
    templateId: number,
    data: UpdateScheduleTemplateRequest
  ): Promise<ScheduleTemplate> => {
    const response = await axiosInstance.put(`/schedule-templates/${templateId}`, data);
    return response.data;
  },

  // 템플릿 삭제
  deleteTemplate: async (templateId: number): Promise<void> => {
    await axiosInstance.delete(`/schedule-templates/${templateId}`);
  }
};
