import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Project {
  project_id: string;
  description: string;
  status: string;
  prompts?: string[];
  images?: string[];
  videos?: string[];
  created_at: string;
}

export const projectApi = {
  create: async (description: string) => {
    const response = await api.post<Project>("/api/projects/create", {
      description,
    });
    return response.data;
  },

  get: async (projectId: string) => {
    const response = await api.get<Project>(`/api/projects/${projectId}`);
    return response.data;
  },

  list: async () => {
    const response = await api.get<{ projects: Project[] }>("/api/projects");
    return response.data.projects;
  },

  // 새로운 통합 생성 메서드 추가
  generateAll: async (projectId: string) => {
    const response = await api.post(`/api/projects/${projectId}/generate-all`);
    return response.data;
  },

  // 아래 메서드들은 나중에 필요할 수 있으니 그대로 유지
  generateImages: async (projectId: string) => {
    const response = await api.post(
      `/api/projects/${projectId}/generate-images`
    );
    return response.data;
  },

  generateVideos: async (projectId: string) => {
    const response = await api.post(
      `/api/projects/${projectId}/generate-videos`
    );
    return response.data;
  },

  updateImage: async (projectId: string, imageIndex: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.put(
      `/api/projects/${projectId}/images/${imageIndex}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },
};
