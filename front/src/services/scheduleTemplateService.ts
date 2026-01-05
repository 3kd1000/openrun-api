import axiosInstance from './api/axiosInstance';
import type {
  ScheduleTemplate,
  CreateScheduleTemplateRequest,
  UpdateScheduleTemplateRequest
} from '../types/scheduleTemplate';

export const scheduleTemplateService = {
  // 템플릿 생성
  createTemplate: async (
    userId: number,
    data: CreateScheduleTemplateRequest
  ): Promise<ScheduleTemplate> => {
    const response = await axiosInstance.post('/schedule-templates', data, {
      params: { userId }
    });
    return response.data;
  },

  // 사용자의 모든 템플릿 조회
  getUserTemplates: async (userId: number): Promise<ScheduleTemplate[]> => {
    const response = await axiosInstance.get('/schedule-templates', {
      params: { userId }
    });
    return response.data;
  },

  // 특정 템플릿 조회
  getTemplate: async (userId: number, templateId: number): Promise<ScheduleTemplate> => {
    const response = await axiosInstance.get(`/schedule-templates/${templateId}`, {
      params: { userId }
    });
    return response.data;
  },

  // 템플릿 수정
  updateTemplate: async (
    userId: number,
    templateId: number,
    data: UpdateScheduleTemplateRequest
  ): Promise<ScheduleTemplate> => {
    const response = await axiosInstance.put(`/schedule-templates/${templateId}`, data, {
      params: { userId }
    });
    return response.data;
  },

  // 템플릿 삭제
  deleteTemplate: async (userId: number, templateId: number): Promise<void> => {
    await axiosInstance.delete(`/schedule-templates/${templateId}`, {
      params: { userId }
    });
  }
};
