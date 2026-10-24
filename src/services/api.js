/**
 * Frontend API Service
 * Communicates with the Node.js / Express backend REST API
 */

const API_BASE_URL = '/api';

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('interviewai_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

export const authAPI = {
  async register(userData) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(userData),
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('interviewai_token', data.token);
    }
    return data;
  },

  async login(credentials) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(credentials),
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('interviewai_token', data.token);
    }
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    });
    return await handleResponse(res);
  },

  async logout() {
    localStorage.removeItem('interviewai_token');
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
      });
    } catch (e) {
      // Ignore network errors on logout
    }
  },
};

export const interviewAPI = {
  async createInterview(config) {
    const res = await fetch(`${API_BASE_URL}/interviews`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(config),
    });
    return await handleResponse(res);
  },

  async getInterviews() {
    const res = await fetch(`${API_BASE_URL}/interviews`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    });
    return await handleResponse(res);
  },

  async getInterviewById(id) {
    const res = await fetch(`${API_BASE_URL}/interviews/${id}`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    });
    return await handleResponse(res);
  },

  async getNextQuestion(id) {
    const res = await fetch(`${API_BASE_URL}/interviews/${id}/next-question`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
    });
    return await handleResponse(res);
  },

  async submitAnswer(id, { candidateAnswer, timeSpentSeconds, skip }) {
    const res = await fetch(`${API_BASE_URL}/interviews/${id}/answers`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ candidateAnswer, timeSpentSeconds, skip }),
    });
    return await handleResponse(res);
  },

  async finishInterview(id) {
    const res = await fetch(`${API_BASE_URL}/interviews/${id}/finish`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
    });
    return await handleResponse(res);
  },

  async deleteInterview(id) {
    const res = await fetch(`${API_BASE_URL}/interviews/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    return await handleResponse(res);
  },
};

export const dashboardAPI = {
  async getStats() {
    const res = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    });
    return await handleResponse(res);
  },
};

export const profileAPI = {
  async getProfile() {
    const res = await fetch(`${API_BASE_URL}/profile`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    });
    return await handleResponse(res);
  },

  async updateProfile(profileData) {
    const res = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PATCH',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(profileData),
    });
    return await handleResponse(res);
  },
};
