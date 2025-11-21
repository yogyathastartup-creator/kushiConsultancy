import { getApiUrl } from './api';
// Centralized API Base URL resolution
const API_BASE_URL = getApiUrl();

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  UPLOAD_CV: `${API_BASE_URL}/upload/cv`,
  SEND_EMAIL: `${API_BASE_URL}/email/send`,
};

export const SERVICES = [
  'Structural Design & Analysis',
  'Global Recruitment & Staffing',
  'Project Management Consultancy',
];

export const RECRUITMENT_AREAS = [
  'Structural Engineering',
  'Civil Engineering (Onshore)',
  'Civil Engineering (Offshore)',
  'Pipeline Engineering',
  'Firefighting Pipeline Engineering',
  'Oil & Natural Gas Engineering',
];

export const CONTACT_INFO = {
  ADDRESS: '123 Kushi Consultancy St, City, Country',
  EMAIL: 'info@kushiconsultancy.com',
  PHONE: '+1234567890',
};

export const SOCIAL_MEDIA_LINKS = {
  FACEBOOK: 'https://facebook.com/kushiconsultancy',
  LINKEDIN: 'https://linkedin.com/company/kushiconsultancy',
  TWITTER: 'https://twitter.com/kushiconsultancy',
};