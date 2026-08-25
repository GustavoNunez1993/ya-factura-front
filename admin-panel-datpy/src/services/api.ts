import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

export const apiOrigin = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");

export const resolveAssetUrl = (path?: string | null) => {
  if (!path) return undefined;
  return path.startsWith("http") ? path : `${apiOrigin}${path}`;
};

//  Request interceptor
api.interceptors.request.use((config) => {

  const token = localStorage.getItem("accessToken");

  // ❌ NO enviar token en login ni refresh
  if (
    token &&
    !config.url?.includes("/auth/signin") &&
    !config.url?.includes("/auth/refresh")
  ) {
    config.headers.Authorization = `Bearer ${token}`;
  }


  return config;
});

//  Response interceptor (AUTO REFRESH)
api.interceptors.response.use(
  (response) => response,
  async (error) => {

    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/signin")
    ) {

      originalRequest._retry = true;

      try {

        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        localStorage.setItem("accessToken", res.data.accessToken);
        localStorage.setItem("refreshToken", res.data.refreshToken);

        originalRequest.headers.Authorization =
          `Bearer ${res.data.accessToken}`;

        return api(originalRequest);

      } catch (err) {

        localStorage.clear();
        window.location.href = "/login";

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;