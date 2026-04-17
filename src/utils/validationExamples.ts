/**
 * ✅ VALIDATION USAGE EXAMPLES
 * 
 * Bu dosya validation utilities'in nasıl kullanılacağını gösterir
 */

import {
  validateReadingText,
  validateUsername,
  validateWPM,
  sanitizeHTML,
  validateBatch,
  ValidationSchema,
} from './validation';

// ===============================================
// EXAMPLE 1: Text Input Validation
// ===============================================
export const exampleTextValidation = () => {
  const userText = '<script>alert("XSS")</script>Merhaba dünya';

  const result = validateReadingText(userText);

  if (!result.isValid) {
    console.error('Validation errors:', result.errors);
    return;
  }

  // Use sanitized version
  const safeText = result.sanitized;
  console.log('Safe text:', safeText);
};

// ===============================================
// EXAMPLE 2: Form Validation
// ===============================================
export const exampleFormValidation = () => {
  const formData = {
    username: 'john_doe',
    wpm: 350,
    text: 'Lorem ipsum dolor sit amet...',
  };

  // Define validation schema
  const schema: ValidationSchema = {
    username: (value) => validateUsername(value),
    wpm: (value) => validateWPM(value),
    text: (value) => validateReadingText(value),
  };

  // Validate all fields
  const validationResults = validateBatch(formData, schema);

  // Check if all valid
  const isFormValid = Object.values(validationResults).every((r) => r.isValid);

  if (!isFormValid) {
    // Show errors to user
    Object.entries(validationResults).forEach(([field, result]) => {
      if (!result.isValid) {
        console.error(`${field}: ${result.errors.join(', ')}`);
      }
    });
    return;
  }

  // Use sanitized data
  console.log('Form is valid, proceeding...');
};

// ===============================================
// EXAMPLE 3: User Input Sanitization
// ===============================================
export const exampleSanitization = () => {
  const userInput = 'Hello<img src=x onerror="alert(\'XSS\')">World';

  // Remove HTML completely
  const safe = sanitizeHTML(userInput);
  console.log('Sanitized:', safe);
  // Output: Hello&lt;img src=x onerror=&quot;alert(&#x27;XSS&#x27;)&quot;&gt;World
};

// ===============================================
// EXAMPLE 4: React Component Integration
// ===============================================
// import React, { useState } from 'react';
// import { validateUsername } from '../utils/validation';

// export const SignupForm: React.FC = () => {
//   const [username, setUsername] = useState('');
//   const [error, setError] = useState('');

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     setUsername(value);

//     // Real-time validation
//     const result = validateUsername(value);
//     setError(result.isValid ? '' : result.errors[0]);
//   };

//   return (
//     <div>
//       <input
//         value={username}
//         onChange={handleChange}
//         placeholder="Username"
//       />
//       {error && <p className="text-red-600">{error}</p>}
//     </div>
//   );
// };
