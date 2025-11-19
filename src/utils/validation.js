import validator from 'validator';

/**
 * Sanitize string input to prevent XSS
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove script tags and dangerous patterns
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // Normalize multiple spaces to single space, preserve single spaces
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  // Trim only leading/trailing whitespace, preserve internal spaces
  return sanitized.trim();
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return validator.isEmail(email);
};

/**
 * Validate phone number
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  // Allow international formats
  return validator.isMobilePhone(phone, 'any', { strictMode: false });
};

/**
 * Validate username
 */
export const validateUsername = (username) => {
  if (!username || typeof username !== 'string') return false;
  // 3-50 characters, alphanumeric, underscores, hyphens only
  return /^[a-zA-Z0-9_-]{3,50}$/.test(username);
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return { valid: false, message: 'Password is required' };
  
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  
  if (password.length > 128) {
    return { valid: false, message: 'Password is too long' };
  }
  
  // Check for common patterns (optional)
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  if (strength < 3) {
    return { 
      valid: true, 
      weak: true,
      message: 'Password is weak. Consider using uppercase, lowercase, numbers, and special characters.' 
    };
  }
  
  return { valid: true, weak: false };
};

/**
 * Validate file upload
 */
export const validateFile = (file) => {
  if (!file) {
    return { valid: false, message: 'No file selected' };
  }

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      message: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.' 
    };
  }

  if (file.size > maxSize) {
    return { 
      valid: false, 
      message: `File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.` 
    };
  }

  // Check filename for suspicious patterns
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return { 
      valid: false, 
      message: 'Invalid filename.' 
    };
  }

  return { valid: true };
};

/**
 * Validate text input (general)
 */
export const validateTextInput = (input, minLength = 1, maxLength = 1000) => {
  if (!input || typeof input !== 'string') {
    return { valid: false, message: 'Input is required' };
  }

  const trimmed = input.trim();

  if (trimmed.length < minLength) {
    return { valid: false, message: `Input must be at least ${minLength} characters` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, message: `Input must not exceed ${maxLength} characters` };
  }

  return { valid: true };
};

/**
 * Sanitize and validate form data
 */
export const sanitizeFormData = (formData) => {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};
