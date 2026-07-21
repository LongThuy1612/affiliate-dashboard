import { getAccessToken } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface FeedbackItem {
  id: number;
  userId: number;
  type: string;
  message: string;
  status: 'unread' | 'read';
  createdAt: string;
  updatedAt: string;
}

export const feedbackApi = {
  submit: (type: string, message: string) =>
    request<FeedbackItem>('/feedback', {
      method: 'POST',
      body: JSON.stringify({ type, message }),
    }),
  list: () =>
    request<FeedbackItem[]>('/feedback'),
  markRead: (id: number) =>
    request<FeedbackItem>(`/feedback/${id}/read`, { method: 'PUT' }),
  delete: (id: number) =>
    request<{ success: boolean }>(`/feedback/${id}`, { method: 'DELETE' }),
};
