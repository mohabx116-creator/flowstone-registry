const resolveApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:4000';
  }

  return null;
};

const API_BASE_URL = resolveApiBaseUrl();
const NETWORK_ERROR_MESSAGE =
  'The backend is still starting or temporarily unreachable. Please retry in a moment.';

type ApiRequestOptions = RequestInit & {
  token?: string | null;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { token, headers, ...requestOptions } = options;

  if (!API_BASE_URL) {
    throw new Error(
      'VITE_API_BASE_URL is required in production before API requests can be made.',
    );
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  }).catch((err) => {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('Failed to fetch') || err instanceof TypeError) {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }

    throw err;
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const rawMessage =
      errorBody?.message ??
      errorBody?.error ??
      `Request failed with status ${response.status}`;

    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : rawMessage;

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export { API_BASE_URL };
