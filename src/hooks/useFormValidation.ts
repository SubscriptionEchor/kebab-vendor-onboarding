import { useState, useCallback } from 'react';

interface ValidationRules {
  [key: string]: (value: any) => boolean;
}

interface ValidationError {
  field: string;
  message: string;
}

export function useFormValidation(rules: ValidationRules) {
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const validate = useCallback((data: any) => {
    const newErrors: ValidationError[] = [];

    Object.keys(rules).forEach((key) => {
      if (!rules[key](data[key])) {
        newErrors.push({
          field: key,
          message: `Invalid ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`
        });
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  }, [rules]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return { errors, validate, clearErrors };
}