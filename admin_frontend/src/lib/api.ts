import axios, { AxiosError } from "axios";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}`;

export const api = axios.create({
    baseURL: API_BASE,
    headers: { "Content-Type": "application/json" },
    withCredentials: true, // Send httpOnly cookies with requests
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
    failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve()));
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

        if (!originalRequest || error.response?.status !== 401) {
            return Promise.reject(error);
        }
        if (originalRequest._retry && typeof window !== "undefined") {
            window.location.href = "/signin";
            return Promise.reject(error);
        }

        // Don't retry refresh endpoint
        if (originalRequest.url?.includes("/staff/auth/refresh")) {
            if (typeof window !== "undefined") {
                window.location.href = "/signin";
            }
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then(() => api(originalRequest));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            await api.post("/staff/auth/refresh");
            processQueue(null);
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError as AxiosError);
            if (typeof window !== "undefined") {
                window.location.href = "/signin";
            }
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);
