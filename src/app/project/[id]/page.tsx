"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { projectApi, Project } from "@/lib/api";
import {
  ArrowLeft,
  Image as ImageIcon,
  Video,
  CheckCircle,
  Loader2,
} from "lucide-react";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
    // 프로젝트가 아직 완료되지 않았다면 주기적으로 체크
    const interval = setInterval(() => {
      if (project && project.status !== "completed") {
        loadProject();
      }
    }, 5000); // 5초마다 체크

    return () => clearInterval(interval);
  }, [projectId, project?.status]);

  const loadProject = async () => {
    try {
      const data = await projectApi.get(projectId);
      setProject(data);

      // 프로젝트가 완료되었으면 로딩 상태 해제
      if (data.status === "completed" || data.status === "videos_generated") {
        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to load project:", error);
      setLoading(false);
    }
  };

  if (loading && (!project || project.status === "prompts_generated")) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">콘텐츠 생성 중...</h2>
          <p className="text-muted-foreground">
            이미지와 비디오를 생성하고 있습니다. 약 5-10분 정도 소요됩니다.
          </p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center">프로젝트를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const isCompleted =
    project.status === "completed" || project.status === "videos_generated";

  return (
    <div className="container mx-auto p-6">
      <Button variant="ghost" onClick={() => router.push("/")} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        프로젝트 목록
      </Button>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">{project.description}</h1>
          {isCompleted && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">생성 완료</span>
            </div>
          )}
        </div>
        <p className="text-muted-foreground">
          생성일: {new Date(project.created_at).toLocaleDateString("ko-KR")}
        </p>
      </div>

      {/* 프롬프트 섹션 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>생성된 프롬프트</CardTitle>
          <CardDescription>AI가 생성한 10개의 장면 설명</CardDescription>
        </CardHeader>
        <CardContent>
          {project.prompts && project.prompts.length > 0 ? (
            <div className="space-y-2">
              {project.prompts.map((prompt, index) => (
                <div key={index} className="p-3 bg-muted rounded-lg">
                  <span className="font-medium">씬 {index + 1}:</span> {prompt}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">프롬프트 생성 중입니다...</p>
          )}
        </CardContent>
      </Card>

      {/* 생성된 콘텐츠 섹션 */}
      {isCompleted && project.videos && project.videos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>생성된 비디오</CardTitle>
            <CardDescription>
              각 장면별로 생성된 이미지와 비디오입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {project.videos.map((video, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="text-sm font-medium text-center">
                    씬 {index + 1}
                  </h4>

                  {/* 이미지 썸네일 */}
                  {project.images && project.images[index] && (
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      <img
                        src={`${
                          process.env.NEXT_PUBLIC_API_URL ||
                          "http://localhost:8000"
                        }${project.images[index]}`}
                        alt={`Scene ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* 비디오 플레이어 */}
                  {video ? (
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        controls
                        className="w-full h-full"
                        src={`${
                          process.env.NEXT_PUBLIC_API_URL ||
                          "http://localhost:8000"
                        }${video}`}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <Video className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 팁: 생성된 비디오를 다운로드하여 편집 후 YouTube Shorts에
                업로드하세요.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 아직 생성 중인 경우 */}
      {!isCompleted && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              콘텐츠를 생성하고 있습니다. 잠시만 기다려주세요...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
