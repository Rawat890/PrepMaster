import { apiRequest } from '../../services/api.js';

/** All mock-test requests use the shared cookie-authenticated API client. */
export const generateMockTestRequest = (payload) => apiRequest('/mock-tests/generate', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const getMockTestRequest = (testId) => apiRequest(`/mock-tests/${encodeURIComponent(testId)}`);

export const saveAnswerRequest = (testId, questionId, selectedOption) => apiRequest(`/mock-tests/${encodeURIComponent(testId)}/answer`, {
  method: 'PUT',
  body: JSON.stringify({ questionId, selectedOption }),
});

export const saveReviewRequest = (testId, questionId, marked) => apiRequest(`/mock-tests/${encodeURIComponent(testId)}/review`, {
  method: 'PUT',
  body: JSON.stringify({ questionId, marked }),
});

export const submitMockTestRequest = (testId) => apiRequest(`/mock-tests/${encodeURIComponent(testId)}/submit`, {
  method: 'POST',
});

export const cancelMockTestRequest = (testId) => apiRequest(`/mock-tests/${encodeURIComponent(testId)}`, {
  method: 'DELETE',
});

export const getDashboardStatsRequest = () => apiRequest('/history/stats');

export const getMockHistoryRequest = (page = 1, limit = 10) =>
  apiRequest(`/history?page=${page}&limit=${limit}`);

export const getMockHistoryItemRequest = (testId) =>
  apiRequest(`/history/${encodeURIComponent(testId)}`);

export const getExamUpdatesRequest = () => apiRequest('/exam-updates');
export const createExamUpdateRequest = (payload) => apiRequest('/exam-updates', { method: 'POST', body: JSON.stringify(payload) });
export const editExamUpdateRequest = (id, payload) => apiRequest(`/exam-updates/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteExamUpdateRequest = (id) => apiRequest(`/exam-updates/${encodeURIComponent(id)}`, { method: 'DELETE' });
