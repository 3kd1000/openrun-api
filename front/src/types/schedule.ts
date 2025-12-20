export interface Schedule {
  id: number;
  clubId: number;
  courtName: string;
  scheduledAt: string; // ISO 8601 format
  maxCapacity: number;
  currentParticipants: number;
  cost?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleRequest {
  clubId: number;
  courtName: string;
  scheduledAt: string; // ISO 8601 format: "2025-12-25T14:00:00"
  maxCapacity: number;
  cost?: number;
  description?: string;
}

export interface Participant {
  id: number;
  scheduleId: number;
  userId: number;
  status: 'CONFIRMED' | 'WAITING' | 'CANCELLED';
  position: number;
  joinedAt: string;
}
