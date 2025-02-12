import { useState, useCallback } from 'react';
import type { 
  FormState, 
  FormActions, 
  FormConfig,
  ValidationSchema,
  ValidationRule 
} from '../types/form';

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onSubmit,
  validateOnChange = true,
  validateOnBlur = true,
}: FormConfig<T>) {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
  });

  const validateField = useCallback(async (field: keyof T): Promise<string | undefined> => {
    const value = state.values[field];
    const rules = validationSchema?.[field];

    if (!rules) return undefined;

    for (const rule of rules) {
      const error = await validateRule(value, rule);
      if (error) return error;
    }

    return undefined;
  }, [state.values, validationSchema]);

  const validateForm = useCallback(async (): Promise<boolean> => {
    if (!validationSchema) return true;

    const errors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    await Promise.all(
      Object.keys(validationSchema).map(async (field) => {
        const error = await validateField(field as keyof T);
        if (error) {
          errors[field as keyof T] = error;
          isValid = false;
        }
      })
    );

    setState(prev => ({
      ...prev,
      errors,
      isValid,
    }));

    return isValid;
  }, [validationSchema, validateField]);

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setState(prev => ({
      ...prev,
      values: {
        ...prev.values,
        [field]: value,
      },
    }));

    if (validateOnChange) {
      validateField(field).then(error => {
        setState(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            [field]: error,
          },
        }));
      });
    }
  }, [validateOnChange, validateField]);

  const setFieldTouched = useCallback((field: keyof T, touched = true) => {
    setState(prev => ({
      ...prev,
      touched: {
        ...prev.touched,
        [field]: touched,
      },
    }));

    if (validateOnBlur) {
      validateField(field).then(error => {
        setState(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            [field]: error,
          },
        }));
      });
    }
  }, [validateOnBlur, validateField]);

  const setFieldError = useCallback((field: keyof T, error?: string) => {
    setState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: error,
      },
    }));
  }, []);

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setState(prev => ({
      ...prev,
      isSubmitting,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: true,
    });
  }, [initialValues]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    setSubmitting(true);
    const isValid = await validateForm();

    if (isValid) {
      try {
        await onSubmit(state.values);
      } catch (error) {
        console.error('Form submission failed:', error);
      }
    }

    setSubmitting(false);
  }, [state.values, validateForm, onSubmit]);

  return {
    ...state,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    setSubmitting,
    resetForm,
    validateForm,
    validateField,
    handleSubmit,
  };
}

async function validateRule(value: any, rule: ValidationRule): Promise<string | undefined> {
  switch (rule.type) {
    case 'required':
      return value ? undefined : rule.message;
    
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : rule.message;
    
    case 'phone':
      return /^\+?[\d\s-]{10,}$/.test(value) ? undefined : rule.message;
    
    case 'minLength':
      return value?.length >= rule.value ? undefined : rule.message;
    
    case 'maxLength':
      return value?.length <= rule.value ? undefined : rule.message;
    
    case 'pattern':
      return rule.value.test(value) ? undefined : rule.message;
    
    case 'custom':
      return (await rule.validate?.(value)) ? undefined : rule.message;
    
    default:
      return undefined;
  }
}