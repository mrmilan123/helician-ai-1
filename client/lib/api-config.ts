/**
 * Get the API base URL from environment variables or use default
 */
export function getApiBaseUrl(): string {
  // Use environment variable if set, otherwise default to http://localhost:5678/webhook
  return import.meta.env.VITE_API_BASE_URL || "http://localhost:5678/webhook";
}

/**
 * Build a complete API URL from a relative path
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;
  return `${baseUrl}/${cleanPath}`;
}
