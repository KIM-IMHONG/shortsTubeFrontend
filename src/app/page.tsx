"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { projectApi, Project } from "@/lib/api";
import { Video, Clock, CheckCircle, Loader2 } from "lucide-react";

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await projectApi.list();
      setProjects(data);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "prompts_generated":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "images_generated":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "videos_generated":
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "prompts_generated":
        return "생성 중...";
      case "images_generated":
        return "비디오 생성 중...";
      case "videos_generated":
      case "completed":
        return "완료";
      default:
        return "처리 중";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">YouTube Shorts 자동화</h1>
          <p className="text-muted-foreground mt-2">
            AI를 활용한 YouTube Shorts 영상 자동 생성
          </p>
        </div>
        <Button onClick={() => router.push("/create")}>새 프로젝트 생성</Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              아직 생성된 프로젝트가 없습니다.
            </p>
            <Button className="mt-4" onClick={() => router.push("/create")}>
              첫 프로젝트 만들기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project.project_id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/project/${project.project_id}`)}
            >
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">
                  {project.description}
                </CardTitle>
                <CardDescription>
                  {new Date(project.created_at).toLocaleDateString("ko-KR")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {getStatusIcon(project.status)}
                  <span className="text-sm">
                    {getStatusText(project.status)}
                  </span>
                </div>
                {(project.status === "videos_generated" ||
                  project.status === "completed") &&
                  project.videos && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {project.videos.filter((v) => v).length}개의 비디오 생성됨
                    </p>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
