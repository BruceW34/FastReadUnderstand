/**
 * ✅ INPUT VALIDATION & SANITIZATION
 * XSS, SQL Injection, vb. saldırılara karşı korunma
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: any;
}

// ===============================================
// 1️⃣ TEXT VALIDATION (Okuma metinleri için)
// ===============================================

export const validateReadingText = (text: string): ValidationResult => {
  const errors: string[] = [];

  // Empty check
  if (!text || typeof text !== 'string') {
    errors.push('Metin boş veya geçersiz');
  }

  // Length check
  if (text.length < 10) {
    errors.push('Metin en az 10 karakter olmalı');
  }
  if (text.length > 50000) {
    errors.push('Metin 50000 karakteri geçemez');
  }

  // XSS protection: script tags check
  if (/<script|<iframe|<embed|javascript:|onerror=|onclick=/gi.test(text)) {
    errors.push('Metin tehlikeli HTML/JavaScript içeriyor');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: sanitizeHTML(text),
  };
};

// ===============================================
// 2️⃣ USERNAME VALIDATION
// ===============================================

export const validateUsername = (username: string): ValidationResult => {
  const errors: string[] = [];

  if (!username || typeof username !== 'string') {
    errors.push('Username boş veya geçersiz');
  }

  if (username.length < 3) {
    errors.push('Username en az 3 karakter olmalı');
  }
  if (username.length > 50) {
    errors.push('Username 50 karakteri geçemez');
  }

  // Only alphanumeric, underscore, hyphen
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username sadece harf, rakam, alt çizgi ve tireden oluşabilir');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: username.trim(),
  };
};

// ===============================================
// 3️⃣ EMAIL VALIDATION
// ===============================================

export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email boş veya geçersiz');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Geçersiz email formatı');
  }

  if (email.length > 254) {
    errors.push('Email çok uzun');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: email.toLowerCase().trim(),
  };
};

// ===============================================
// 4️⃣ WPM (Words Per Minute) VALIDATION
// ===============================================

export const validateWPM = (wpm: any): ValidationResult => {
  const errors: string[] = [];

  const wpmNum = Number(wpm);
  if (isNaN(wpmNum)) {
    errors.push('WPM sayı olmalı');
  }

  if (wpmNum < 0 || wpmNum > 20000) {
    errors.push('WPM 0 ile 20000 arasında olmalı');
  }

  // Must be integer
  if (!Number.isInteger(wpmNum)) {
    errors.push('WPM tam sayı olmalı');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: Math.max(0, Math.min(20000, wpmNum)),
  };
};

// ===============================================
// 5️⃣ XP (Experience Points) VALIDATION
// ===============================================

export const validateXP = (xp: any): ValidationResult => {
  const errors: string[] = [];

  const xpNum = Number(xp);
  if (isNaN(xpNum)) {
    errors.push('XP sayı olmalı');
  }

  if (xpNum < 0 || xpNum > 1000000) {
    errors.push('XP 0 ile 1000000 arasında olmalı');
  }

  if (!Number.isInteger(xpNum)) {
    errors.push('XP tam sayı olmalı');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: Math.max(0, Math.min(1000000, xpNum)),
  };
};

// ===============================================
// 6️⃣ URL VALIDATION
// ===============================================

export const validateURL = (url: string): ValidationResult => {
  const errors: string[] = [];

  try {
    const urlObj = new URL(url);
    // Only allow http, https, ftp
    if (!['http:', 'https:', 'ftp:'].includes(urlObj.protocol)) {
      errors.push('Sadece HTTP, HTTPS veya FTP protokolleri izinli');
    }
  } catch {
    errors.push('Geçersiz URL formatı');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: url,
  };
};

// ===============================================
// 7️⃣ QUIZ ANSWER VALIDATION
// ===============================================

export const validateQuizAnswer = (
  answer: string,
  maxLength: number = 500
): ValidationResult => {
  const errors: string[] = [];

  if (!answer || typeof answer !== 'string') {
    errors.push('Cevap boş veya geçersiz');
  }

  if (answer.length > maxLength) {
    errors.push(`Cevap ${maxLength} karakteri geçemez`);
  }

  // XSS check
  if (/<script|<iframe|javascript:/gi.test(answer)) {
    errors.push('Cevap tehlikeli içerik barındırıyor');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: sanitizeHTML(answer),
  };
};

// ===============================================
// 8️⃣ BATCH VALIDATION (Multiple fields)
// ===============================================

export interface ValidationSchema {
  [field: string]: (value: any) => ValidationResult;
}

export const validateBatch = (
  data: Record<string, any>,
  schema: ValidationSchema
): Record<string, ValidationResult> => {
  const results: Record<string, ValidationResult> = {};

  for (const [field, validator] of Object.entries(schema)) {
    results[field] = validator(data[field]);
  }

  return results;
};

// ===============================================
// SANITIZATION FUNCTIONS
// ===============================================

/**
 * ✅ Remove dangerous HTML tags
 */
export const sanitizeHTML = (html: string): string => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

/**
 * ✅ Remove HTML completely (text only)
 */
export const stripHTML = (html: string): string => {
  return html
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&[#\w]+;/g, '') // Remove HTML entities
    .trim();
};

/**
 * ✅ Trim and normalize whitespace
 */
export const normalizeText = (text: string): string => {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/\n\s*\n/g, '\n'); // Multiple newlines to single newline
};

/**
 * ✅ JSON validation and parsing
 */
export const validateJSON = (jsonString: string): ValidationResult => {
  const errors: string[] = [];
  let parsed: any = null;

  try {
    parsed = JSON.parse(jsonString);
  } catch (e: any) {
    errors.push(`Invalid JSON: ${e.message}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: parsed,
  };
};

// ===============================================
// COMMON VALIDATION PATTERNS
// ===============================================

/**
 * ✅ Password validation
 */
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push('Şifre en az 8 karakter olmalı');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Şifre en az bir büyük harf içermeli');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Şifre en az bir küçük harf içermeli');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Şifre en az bir rakam içermeli');
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Şifre en az bir özel karakter (!@#$%^&*) içermeli');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * ✅ Phone number validation (Turkish)
 */
export const validatePhoneNumber = (phone: string): ValidationResult => {
  const errors: string[] = [];

  // Remove non-digits
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length !== 11) {
    errors.push('Telefon numarası 11 haneli olmalı');
  }

  if (!cleaned.startsWith('90')) {
    errors.push('Telefon numarası 90 ile başlamalı');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: cleaned,
  };
};
