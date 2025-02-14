// API Response Types
export interface APIResponse<T> {
  data: T;
  errors?: Array<APIError>;
}

export interface APIError {
  message: string;
  path: string[];
  extensions?: Record<string, unknown>;
}

// API Error Types
export interface ValidationErrors {
  [field: string]: string[];
}

export interface ErrorResponse {
  message: string;
  errors?: ValidationErrors;
  statusCode?: number;
}

// API Request Types
export interface APIRequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  body?: unknown;
}

// GraphQL Types
export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<GraphQLError>;
}

export interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: string[];
  extensions?: Record<string, unknown>;
}

// File Upload Types
export interface UploadResponse {
  success: boolean;
  key: string;
  url?: string;
  error?: string;
}

export interface PresignedUrlResponse {
  url: string;
  fields: Record<string, string>;
}