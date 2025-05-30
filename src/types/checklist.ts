import { Timestamp } from 'firebase/firestore';

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  repeatable?: boolean;
}

export interface ChecklistHistory {
  id: string;
  itemId: string;
  userId: string;
  completedAt: Timestamp;
  uncheckedAt?: Timestamp | null;
  itemTitle: string;
} 