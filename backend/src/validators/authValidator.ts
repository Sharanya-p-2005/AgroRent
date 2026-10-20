export interface RegisterInput {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  address?: string;
  village?: string;
  taluk?: string;
  district?: string;
  state?: string;
  pincode?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateRegisterInput(data: RegisterInput): ValidationResult {
  const errors: string[] = [];

  // Name
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.push('Full name is required (minimum 2 characters)');
  }

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || typeof data.email !== 'string' || !emailRegex.test(data.email.trim())) {
    errors.push('A valid email address is required');
  }

  // Phone
  const phoneClean = (data.phone || '').toString().trim().replace(/[\s-]/g, '');
  if (!phoneClean || phoneClean.length < 10) {
    errors.push('A valid 10-digit phone number is required');
  }

  // Role validation
  const normalizedRole = (data.role || '').toUpperCase();
  if (normalizedRole === 'ADMIN') {
    errors.push('Administrator accounts cannot be created via public registration');
  } else if (normalizedRole !== 'FARMER' && normalizedRole !== 'OWNER') {
    errors.push('Role must be either FARMER or OWNER');
  }

  // Password
  if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
    errors.push('Password is required (minimum 6 characters)');
  }

  // Confirm Password
  if (data.password !== data.confirmPassword) {
    errors.push('Passwords do not match');
  }

  // Location fields
  if (!data.address || typeof data.address !== 'string' || !data.address.trim()) {
    errors.push('Address is required');
  }
  if (!data.village || typeof data.village !== 'string' || !data.village.trim()) {
    errors.push('Village is required');
  }
  if (!data.taluk || typeof data.taluk !== 'string' || !data.taluk.trim()) {
    errors.push('Taluk / Tehsil is required');
  }
  if (!data.district || typeof data.district !== 'string' || !data.district.trim()) {
    errors.push('District is required');
  }
  if (!data.state || typeof data.state !== 'string' || !data.state.trim()) {
    errors.push('State is required');
  }
  if (!data.pincode || typeof data.pincode !== 'string' || !data.pincode.trim()) {
    errors.push('Pincode is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateLoginInput(data: { email?: string; password?: string }): ValidationResult {
  const errors: string[] = [];

  if (!data.email || typeof data.email !== 'string' || !data.email.trim()) {
    errors.push('Email is required');
  }

  if (!data.password || typeof data.password !== 'string' || !data.password) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
