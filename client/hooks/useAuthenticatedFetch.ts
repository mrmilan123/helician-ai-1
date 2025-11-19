import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "@/lib/api-config";

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export function useAuthenticatedFetch() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const fetchWithAuth = async (
    url: string,
    options: FetchOptions = {},
  ): Promise<Response> => {
    const headers: Record<string, string> = {
      ...options.headers,
    };

    // Add Authorization header if token exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Add Content-Type for POST/PUT/PATCH requests
    if (
      options.method &&
      ["POST", "PUT", "PATCH"].includes(options.method.toUpperCase())
    ) {
      if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }
    }

    const fullUrl = buildApiUrl(url);

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
      logout();
      navigate("/");
      throw new Error("Unauthorized. Please login again.");
    }

    return response;
  };

  return fetchWithAuth;
}
