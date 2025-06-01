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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { projectApi, promptTypeApi, Project } from "@/lib/api";
import {
  ArrowLeft,
  Image as ImageIcon,
  Video,
  CheckCircle,
  Loader2,
  Trash2,
  Sparkles,
} from "lucide-react";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [promptTypeInfo, setPromptTypeInfo] = useState<any>(null);

  useEffect(() => {
    loadProject();
    // 프로젝트가 아직 완료되지 않았다면 주기적으로 체크
    const interval = setInterval(() => {
      if (
        project &&
        project.status !== "completed" &&
        project.status !== "videos_generated"
      ) {
        loadProject();
      }
    }, 5000); // 5초마다 체크

    return () => clearInterval(interval);
  }, [projectId, project?.status]);

  // 프롬프트 타입 정보 로드
  useEffect(() => {
    if (project?.prompt_type) {
      loadPromptTypeInfo(project.prompt_type);
    }
  }, [project?.prompt_type]);

  const loadPromptTypeInfo = async (promptType: string) => {
    try {
      const info = await promptTypeApi.get(promptType);
      setPromptTypeInfo(info);
    } catch (error) {
      console.error("Failed to load prompt type info:", error);
    }
  };

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

  const handleGenerateImages = async () => {
    if (!project) return;
    setProcessing(true);
    try {
      await projectApi.generateImages(project.project_id);
      await loadProject();
    } catch (error) {
      console.error("Failed to generate images:", error);
      alert("이미지 생성 중 오류가 발생했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  const handleAnalyzeAndGenerateVideoPrompts = async () => {
    if (!project) return;

    setProcessing(true);
    try {
      await projectApi.analyzeAndImproveVideoPrompts(project.project_id);
      await loadProject();
    } catch (error) {
      console.error(
        "Failed to analyze images and generate video prompts:",
        error
      );
      alert("이미지 분석 및 영상 프롬프트 생성에 실패했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateVideos = async () => {
    if (!project) return;
    setProcessing(true);
    try {
      await projectApi.generateVideos(project.project_id);
      await loadProject();
    } catch (error) {
      console.error("Failed to generate videos:", error);
      alert("비디오 생성 중 오류가 발생했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!project) return;
    setProcessing(true);
    try {
      await projectApi.generateAll(project.project_id);
      await loadProject();
    } catch (error) {
      console.error("Failed to generate all:", error);
      alert("전체 생성 중 오류가 발생했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!project) return;

    setDeleting(true);
    try {
      await projectApi.delete(project.project_id);
      // 삭제 성공 시 홈으로 이동
      router.push("/");
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert("프로젝트 삭제 중 오류가 발생했습니다.");
      setDeleting(false);
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "image_prompts_generated":
        return "이미지 프롬프트 생성 완료";
      case "images_generated":
        return "이미지 생성 완료";
      case "video_prompts_generated":
        return "비디오 프롬프트 생성 완료";
      case "videos_generated":
      case "completed":
        return "생성 완료";
      case "prompts_generated":
        return "이미지 생성 중...";
      default:
        return "처리 중...";
    }
  };

  if (
    loading &&
    (!project ||
      (project.status !== "completed" && project.status !== "videos_generated"))
  ) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {project ? getStatusMessage(project.status) : "콘텐츠 생성 중..."}
          </h2>
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
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={() => router.push("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          프로젝트 목록
        </Button>
        <Button variant="outline" onClick={handleDeleteClick}>
          <Trash2 className="w-4 h-4 mr-2" />
          프로젝트 삭제
        </Button>
      </div>

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
        <div className="flex items-center gap-4 text-muted-foreground">
          <p>
            생성일: {new Date(project.created_at).toLocaleDateString("ko-KR")}
          </p>
          {project.prompt_type && (
            <div className="flex items-center gap-1">
              {promptTypeInfo && (
                <span className="text-base">{promptTypeInfo.icon}</span>
              )}
              <Sparkles className="w-4 h-4" />
              <span>
                스타일:{" "}
                {promptTypeInfo ? promptTypeInfo.name : project.prompt_type}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 강아지 정보 섹션 */}
      {project.dog_analysis && project.dog_image_path && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>맞춤형 강아지 정보</CardTitle>
            <CardDescription>
              업로드된 강아지의 분석 결과입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-muted rounded-lg overflow-hidden">
                  <img
                    src={`${
                      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
                    }${project.dog_image_path}`}
                    alt="업로드된 강아지 사진"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <span className="font-medium">품종:</span>{" "}
                  {project.dog_analysis.breed}
                </div>
                <div>
                  <span className="font-medium">특징:</span>{" "}
                  {project.dog_analysis.characteristics.join(", ")}
                </div>
                <div>
                  <span className="font-medium">확신도:</span>{" "}
                  {Math.round(project.dog_analysis.confidence * 100)}%
                </div>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 이 강아지의 특징을 반영하여 맞춤형 프롬프트가
                    생성되었습니다.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* 4단계 워크플로우 컨트롤 */}
      {project.status !== "completed" && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>생성 단계</CardTitle>
            <CardDescription>
              단계별로 콘텐츠를 생성하거나 한 번에 모든 단계를 실행할 수
              있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 현재 상태 표시 */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <span className="font-medium">현재 상태:</span>
                <span className="text-sm">
                  {project.status === "image_prompts_generated" &&
                    "1단계 완료 - 이미지 프롬프트 생성됨"}
                  {project.status === "images_generated" &&
                    "2단계 완료 - 이미지 생성됨"}
                  {project.status === "video_prompts_generated" &&
                    "3단계 완료 - 비디오 프롬프트 생성됨"}
                  {project.status === "videos_generated" &&
                    "4단계 완료 - 비디오 생성됨"}
                </span>
              </div>

              {/* 단계별 버튼들 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 2단계: 이미지 생성 */}
                {project.status === "image_prompts_generated" && (
                  <Button
                    onClick={handleGenerateImages}
                    disabled={processing}
                    className="w-full"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        이미지 생성 중...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        2단계: 이미지 생성
                      </>
                    )}
                  </Button>
                )}

                {/* 3단계: 이미지 분석 후 비디오 프롬프트 생성 */}
                {project.status === "images_generated" && (
                  <Button
                    onClick={handleAnalyzeAndGenerateVideoPrompts}
                    disabled={processing}
                    className="w-full"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        분석 중...
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        3단계: 이미지 분석
                      </>
                    )}
                  </Button>
                )}

                {/* 4단계: 비디오 생성 */}
                {project.status === "video_prompts_generated" && (
                  <Button
                    onClick={handleGenerateVideos}
                    disabled={processing}
                    className="w-full"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        비디오 생성 중...
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        4단계: 비디오 생성
                      </>
                    )}
                  </Button>
                )}

                {/* 한 번에 모든 단계 실행 */}
                {project.status === "image_prompts_generated" && (
                  <Button
                    onClick={handleGenerateAll}
                    disabled={processing}
                    variant="outline"
                    className="w-full"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        전체 생성 중...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        모든 단계 실행
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            <h3 className="text-lg font-semibold mb-2">
              {getStatusMessage(project.status)}
            </h3>
            <p className="text-muted-foreground">
              {project.status === "prompts_generated"
                ? "이미지를 생성하고 있습니다. 잠시만 기다려주세요..."
                : project.status === "images_generated"
                ? "비디오를 생성하고 있습니다. 잠시만 기다려주세요..."
                : "콘텐츠를 생성하고 있습니다. 잠시만 기다려주세요..."}
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>프로젝트 삭제</DialogTitle>
            <DialogDescription>
              현재 프로젝트를 정말로 삭제하시겠습니까?
              <br />
              <br />
              <strong>&ldquo;{project?.description}&rdquo;</strong>
              <br />
              <br />
              생성된 모든 이미지와 비디오가 함께 삭제됩니다. 이 작업은 되돌릴 수
              없습니다.
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
