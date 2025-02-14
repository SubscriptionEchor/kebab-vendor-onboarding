// Form State Types
export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface FormActions<T> {
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldTouched: (field: keyof T, touched?: boolean) => void;
  setFieldError: (field: keyof T, error?: string) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  resetForm: () => void;
  validateForm: () => Promise<boolean>;
  validateField: (field: keyof T) => Promise<string | undefined>;
}

export interface FormConfig<T> {
  initialValues: T;
  validationSchema?: ValidationSchema<T>;
  onSubmit: (values: T) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface ValidationSchema<T> {
  [K in keyof T]?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  message: string;
  value?: any;
  validate?: (value: any) => boolean | Promise<boolean>;
}

// Form Field Types
export interface FieldProps<T = any> {
  name: string;
  value: T;
  onChange: (value: T) => void;
  onBlur: () => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  required?: boolean;
}

export interface FormFieldConfig {
  label?: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

// Form Array Types
export interface ArrayFieldProps<T> extends FieldProps<T[]> {
  push: (value: T) => void;
  remove: (index: number) => void;
  move: (fromIndex: number, toIndex: number) => void;
}

// Form Section Types
export interface FormSection {
  title: string;
  description?: string;
  fields: string[];
  isOptional?: boolean;
  condition?: (values: any) => boolean;
}