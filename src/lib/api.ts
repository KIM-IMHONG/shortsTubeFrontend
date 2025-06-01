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
  dog_image_path?: string;
  dog_analysis?: DogAnalysis;
  prompt_type?: string;
}

// 강아지 분석 결과 인터페이스 추가
export interface DogAnalysis {
  breed: string;
  characteristics: string[];
  confidence: number;
}

// 프롬프트 타입 인터페이스 추가
export interface PromptTypeExample {
  title: string;
  prompt: string;
  description: string;
}

export interface PromptType {
  type: string;
  name: string;
  description: string;
  icon: string;
  examples: PromptTypeExample[];
  example?: string;
  suggested_descriptions: string[];
  status?: string;
  features?: string[];
  best_for?: string[];
  tips?: string[];
}

export interface PromptTypesResponse {
  prompt_types: PromptType[];
}

export const projectApi = {
  create: async (data: { description: string; content_type: string }) => {
    const response = await api.post<Project>("/api/projects/create", data);
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

  // 🆕 이미지 생성 (2단계)
  generateImages: async (projectId: string) => {
    const response = await api.post(
      `/api/projects/${projectId}/generate-images`
    );
    return response.data;
  },

  // 🆕 영상 프롬프트 분석 및 개선 (3단계)
  analyzeAndImproveVideoPrompts: async (projectId: string) => {
    const response = await api.post(
      `/api/projects/${projectId}/analyze-and-generate-video-prompts`
    );
    return response.data;
  },

  // 🆕 영상 생성 (4단계)
  generateVideos: async (projectId: string) => {
    const response = await api.post(
      `/api/projects/${projectId}/generate-videos`
    );
    return response.data;
  },

  // 새로운 통합 생성 메서드 추가
  generateAll: async (projectId: string) => {
    const response = await api.post(`/api/projects/${projectId}/generate-all`);
    return response.data;
  },

  // 프로젝트 삭제
  delete: async (projectId: string) => {
    const response = await api.delete(`/api/projects/${projectId}`);
    return response.data;
  },

  // 강아지 이미지 업로드와 프롬프트 생성을 한번에 처리
  createWithDogUpload: async (
    description: string,
    contentType: string,
    dogImageFile: File
  ) => {
    const formData = new FormData();
    formData.append("description", description);
    formData.append("content_type", contentType);
    formData.append("file", dogImageFile);

    const response = await api.post<Project>(
      "/api/projects/create-with-dog-upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // === 새로운 4단계 워크플로우 API들 ===

  // 새로운 워크플로우 프로젝트 생성 (4단계 워크플로우)
  createNewWorkflow: async (formData: FormData) => {
    const response = await fetch(
      `${API_URL}/api/projects/create-new-workflow`,
      {
        method: "POST",
        body: formData,
      }
    );
    if (!response.ok) throw new Error("Failed to create new workflow project");
    return response.json();
  },

  // 직접 영상 생성 워크플로우 (이미지 → 영상 프롬프트 → 영상)
  createDirectVideo: async (formData: FormData) => {
    const response = await fetch(
      `${API_URL}/api/projects/create-direct-video`,
      {
        method: "POST",
        body: formData,
      }
    );
    if (!response.ok) throw new Error("Failed to create direct video project");
    return response.json();
  },

  // 직접 영상 생성 실행
  executeDirectVideo: async (projectId: string) => {
    const response = await api.post(
      `/api/projects/${projectId}/execute-direct-video`
    );
    return response.data;
  },

  // 완전한 4단계 워크플로우 실행
  executeCompleteWorkflow: async (projectId: string) => {
    const response = await api.post(
      `/api/projects/${projectId}/execute-complete-workflow`
    );
    return response.data;
  },

  // 워크플로우 단계별 실행
  executeWorkflowStep: async (projectId: string, step: number) => {
    const response = await api.post(
      `/api/projects/${projectId}/execute-step/${step}`
    );
    return response.data;
  },
};

// 강아지 관련 API 추가
export const dogApi = {
  // 강아지 이미지 업로드 및 분석
  uploadAndAnalyze: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<{
      image_path: string;
      analysis: DogAnalysis;
    }>("/api/upload-dog-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

// 프롬프트 타입 관련 API 추가
export const promptTypeApi = {
  // 모든 프롬프트 타입 가져오기
  list: async () => {
    const response = await api.get<PromptTypesResponse>("/api/prompt-types");
    return response.data.prompt_types;
  },

  // 특정 프롬프트 타입 가져오기
  get: async (promptType: string) => {
    const response = await api.get<PromptType>(
      `/api/prompt-types/${promptType}`
    );
    return response.data;
  },
};
