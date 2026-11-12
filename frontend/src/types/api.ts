export interface BaseResponse {
  time_ns?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface StandardResponse {
  success: boolean;
  message: string;
}

export interface BulkDeleteResponse {
  success: boolean;
  deleted_count: number;
  message: string;
}
