// API utility functions for frontend-backend communication

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
    this.name = "ApiError"
  }
}

export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(
        data.error || data.message || "An error occurred",
        response.status,
        data.code
      )
    }

    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    
    // Handle network errors
    throw new ApiError(
      "Network error occurred. Please check your connection.",
      0
    )
  }
}

// Helper functions for common API operations
export const api = {
  get: <T = any>(url: string, options?: RequestInit) =>
    apiRequest<T>(url, { method: "GET", ...options }),

  post: <T = any>(url: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(url, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),

  put: <T = any>(url: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(url, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),

  patch: <T = any>(url: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(url, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),

  delete: <T = any>(url: string, options?: RequestInit) =>
    apiRequest<T>(url, { method: "DELETE", ...options }),
}

// Helper to handle common error scenarios
export function handleApiError(error: any): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return error.message || "Bad request"
      case 401:
        return "Please log in to continue"
      case 403:
        return "You don't have permission to perform this action"
      case 404:
        return "Resource not found"
      case 429:
        return "Too many requests. Please try again later"
      case 500:
        return "Server error. Please try again later"
      default:
        return error.message || "An unexpected error occurred"
    }
  }

  return "An unexpected error occurred"
}

// Data transformation helpers
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString()
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount)
}

// Validation helpers
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidRegistration(registration: string): boolean {
  const regexes = [
    /^[A-Z]{2}[0-9]{2}\s?[A-Z]{3}$/, // AB12 CDE
    /^[A-Z][0-9]{1,3}\s?[A-Z]{3}$/, // A123 BCD
    /^[A-Z]{3}\s?[0-9]{1,3}[A-Z]$/, // ABC 123D
    /^[0-9]{1,4}\s?[A-Z]{1,3}$/, // 1234 AB
  ]
  
  return regexes.some(regex => regex.test(registration.toUpperCase().replace(/\s/g, " ")))
}

export function formatRegistration(value: string): string {
  const cleaned = value.replace(/\s/g, "").toUpperCase()
  if (cleaned.length > 4) {
    return cleaned.slice(0, 4) + " " + cleaned.slice(4, 7)
  }
  return cleaned
}
