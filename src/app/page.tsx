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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { projectApi, Project } from "@/lib/api";
import {
  Video,
  Clock,
  CheckCircle,
  Loader2,
  Trash2,
  MoreVertical,
  Heart,
} from "lucide-react";

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
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

  const handleDeleteClick = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;

    setDeleting(true);
    try {
      await projectApi.delete(projectToDelete.project_id);
      // 삭제 성공 시 목록에서 제거
      setProjects(
        projects.filter((p) => p.project_id !== projectToDelete.project_id)
      );
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert("프로젝트 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
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
        return "이미지 생성 중...";
      case "images_generated":
        return "비디오 생성 중...";
      case "videos_generated":
        return "완료";
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
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/create")}>
            기존 워크플로우
          </Button>
          <Button onClick={() => router.push("/scene-workflow")}>
            🎬 10단계 장면 워크플로우
          </Button>
        </div>
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
              className="cursor-pointer hover:shadow-lg transition-shadow relative"
              onClick={() => router.push(`/project/${project.project_id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg line-clamp-2 pr-2">
                        {project.description}
                      </CardTitle>
                      {project.dog_analysis && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-medium">
                          <Heart className="w-3 h-3" />
                          맞춤형
                        </div>
                      )}
                    </div>
                    <CardDescription>
                      {new Date(project.created_at).toLocaleDateString("ko-KR")}
                      {project.dog_analysis && (
                        <span className="ml-2 text-pink-600">
                          • {project.dog_analysis.breed}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 flex-shrink-0"
                    onClick={(e) => handleDeleteClick(project, e)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>프로젝트 삭제</DialogTitle>
            <DialogDescription>
              다음 프로젝트를 정말로 삭제하시겠습니까?
              <br />
              <br />
              <strong>&ldquo;{projectToDelete?.description}&rdquo;</strong>
              <br />
              <br />이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
