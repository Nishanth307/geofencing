const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanEndpoint = endpoint.replace(/^\/+/, "");
  const url = `${DEFAULT_BASE_URL.replace(/\/+$/, "")}/${cleanEndpoint}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options.headers,
  };

  try {
    let response: Response;
    try {
      response = await fetch(url, { ...options, headers });
    } catch (primaryErr) {
      // If direct cross-origin fetch is blocked by browser policy/firewall,
      // fall back to Vite dev-server proxy
      try {
        response = await fetch(`/${cleanEndpoint}`, { ...options, headers });
      } catch {
        throw primaryErr;
      }
    }

    // Handle non-2xx statuses
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorData: unknown = null;
      try {
        errorData = await response.json();
        if (typeof errorData === "object" && errorData !== null && "error" in errorData) {
          errorMessage = String((errorData as { error: string }).error);
        }
      } catch {
        // Response wasn't json, keep default message
      }
      throw new ApiError(errorMessage, response.status, errorData);
    }

    // 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : "Network error occurred";
    throw new ApiError(message, 0);
  }
}
