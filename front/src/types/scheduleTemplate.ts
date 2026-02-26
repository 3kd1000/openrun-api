export type TemplateType = 'SCHEDULE' | 'PARTICIPATION_START';

export interface ScheduleTemplate {
  id: number;
  userId: number;
  templateType: TemplateType;
  templateName: string;
  courtName?: string;
  maxCapacity?: number;
  cost?: number;
  courtAddress?: string;
  region?: string;
  matchType?: string | null;
  numberOfCourts?: number;
  participationStartPattern?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleTemplateRequest {
  templateType: TemplateType;
  templateName: string;
  courtName?: string;
  maxCapacity?: number;
  cost?: number;
  courtAddress?: string;
  region?: string;
  matchType?: string | null;
  numberOfCourts?: number;
  participationStartPattern?: string | null;
}

export interface UpdateScheduleTemplateRequest {
  templateName: string;
  courtName?: string;
  maxCapacity?: number;
  cost?: number;
  courtAddress?: string;
  region?: string;
  matchType?: string | null;
  numberOfCourts?: number;
  participationStartPattern?: string | null;
}
