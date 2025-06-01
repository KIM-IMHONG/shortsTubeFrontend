"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronRight,
  Upload,
  RefreshCw,
  Eye,
  Video,
  Check,
  Loader2,
  Image as ImageIcon,
  Film,
  Wand2,
  ArrowLeft,
} from "lucide-react";

interface SceneImage {
  scene_number: number;
  prompt: string;
  filepath: string | null;
  filename: string | null;
  status: string;
  needs_regeneration?: boolean;
  regenerated?: boolean;
}

interface SceneProject {
  project_id: string;
  status: string;
  description: string;
  scene_prompts: string[];
  scene_images: SceneImage[];
  video_prompts: string[];
  videos: string[];
  current_step: number;
  created_at: string;
}

const API_BASE = "http://localhost:8000";

export default function SceneWorkflowPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<SceneProject | null>(null);
  const [description, setDescription] = useState("");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [baseReferenceFile, setBaseReferenceFile] = useState<File | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [regenerateSceneNumber, setRegenerateSceneNumber] = useState<
    number | null
  >(null);
  const [regeneratePrompt, setRegeneratePrompt] = useState("");
  const [activeTab, setActiveTab] = useState("prompts");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const baseFileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 스타일 옵션 상태
  const [styleOptions, setStyleOptions] = useState({
    style: "raw",
    version: "6",
    aspect_ratio: "9:16",
    photographic: true,
    consistent_lighting: true,
  });

  const steps = [
    { number: 1, title: "장면 프롬프트 생성", icon: Wand2 },
    { number: 2, title: "이미지 생성", icon: ImageIcon },
    { number: 3, title: "영상 프롬프트 생성", icon: Film },
    { number: 4, title: "영상 생성", icon: Video },
  ];

  // 1단계: 장면 프롬프트 생성
  const handleGenerateScenePrompts = async () => {
    if (!description.trim()) {
      alert("설명을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      let response;

      // 기본 참고 이미지가 있으면 FormData 사용, 없으면 JSON 사용
      if (baseReferenceFile) {
        // FormData로 이미지 포함해서 전송
        const formData = new FormData();
        formData.append("description", description);
        formData.append("style_options", JSON.stringify(styleOptions));
        formData.append("file", baseReferenceFile);

        response = await fetch(`${API_BASE}/api/scene-projects/create`, {
          method: "POST",
          body: formData,
        });
      } else {
        // JSON으로 전송 (이미지 없음)
        response = await fetch(`${API_BASE}/api/scene-projects/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description,
            style_options: styleOptions,
          }),
        });
      }

      if (!response.ok) throw new Error("Failed to create scene project");

      const data = await response.json();
      setProject(data);
      setCurrentStep(2);
    } catch (error) {
      console.error("Error:", error);
      alert("장면 프롬프트 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 2단계: 이미지 생성
  const handleGenerateImages = async () => {
    if (!project) return;

    setLoading(true);
    try {
      const formData = new FormData();
      const imageToUse = baseReferenceFile || referenceFile;
      if (imageToUse) {
        formData.append("file", imageToUse);
      }

      const response = await fetch(
        `${API_BASE}/api/scene-projects/${project.project_id}/generate-images`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Failed to generate images");

      const data = await response.json();
      setProject(data);
      setCurrentStep(3);
    } catch (error) {
      console.error("Error:", error);
      alert("이미지 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 이미지 재생성
  const handleRegenerateImage = async () => {
    if (!project || regenerateSceneNumber === null) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/scene-projects/${project.project_id}/regenerate-image`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scene_number: regenerateSceneNumber,
            prompt: regeneratePrompt || undefined,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to regenerate image");

      const result = await response.json();

      // 프로젝트 상태 업데이트
      if (project.scene_images) {
        const updatedImages = project.scene_images.map((img) =>
          img.scene_number === regenerateSceneNumber ? result.scene_image : img
        );
        setProject({ ...project, scene_images: updatedImages });
      }

      setRegenerateDialogOpen(false);
      setRegenerateSceneNumber(null);
      setRegeneratePrompt("");
    } catch (error) {
      console.error("Error:", error);
      alert("이미지 재생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 3단계: 영상 프롬프트 생성
  const handleGenerateVideoPrompts = async () => {
    if (!project) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/scene-projects/${project.project_id}/generate-video-prompts`,
        {
          method: "POST",
        }
      );

      if (!response.ok) throw new Error("Failed to generate video prompts");

      const data = await response.json();
      setProject(data);
      setCurrentStep(4);
    } catch (error) {
      console.error("Error:", error);
      alert("영상 프롬프트 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 4단계: 영상 생성
  const handleGenerateVideos = async () => {
    if (!project) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/scene-projects/${project.project_id}/generate-videos`,
        {
          method: "POST",
        }
      );

      if (!response.ok) throw new Error("Failed to generate videos");

      const data = await response.json();
      setProject(data);
      alert("모든 영상이 성공적으로 생성되었습니다!");
    } catch (error) {
      console.error("Error:", error);
      alert("영상 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const openRegenerateDialog = (
    sceneNumber: number,
    originalPrompt: string
  ) => {
    setRegenerateSceneNumber(sceneNumber);
    setRegeneratePrompt(originalPrompt);
    setRegenerateDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => router.push("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          홈으로
        </Button>
        <div>
          <h1 className="text-3xl font-bold">🎬 10단계 장면 워크플로우</h1>
          <p className="text-muted-foreground mt-2">
            S2V-01 모델을 사용한 캐릭터 일관성 중심의 영상 제작
          </p>
        </div>
      </div>

      {/* 진행 상태 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.number
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-muted"
                }`}
              >
                {currentStep > step.number ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-5 h-5 mx-2 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm font-medium">
          {steps.map((step) => (
            <span
              key={step.number}
              className={
                currentStep >= step.number
                  ? "text-primary"
                  : "text-muted-foreground"
              }
            >
              {step.title}
            </span>
          ))}
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측: 단계별 컨트롤 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>
                단계 {currentStep}: {steps[currentStep - 1]?.title}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 &&
                  "메인 설명을 입력하고 10단계 장면을 생성하세요"}
                {currentStep === 2 &&
                  "생성된 장면 프롬프트로 이미지를 생성하세요"}
                {currentStep === 3 &&
                  "이미지를 기반으로 영상용 프롬프트를 생성하세요"}
                {currentStep === 4 && "S2V-01 모델로 최종 영상을 생성하세요"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 1단계: 프롬프트 생성 */}
              {currentStep === 1 && (
                <>
                  <div>
                    <Label htmlFor="description">메인 설명</Label>
                    <Textarea
                      id="description"
                      placeholder="예: 귀여운 강아지가 피자를 만드는 과정"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="base-reference">기본 참고 이미지</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      캐릭터 일관성을 위한 기본 이미지를 업로드하세요 (권장)
                    </p>
                    <div className="mt-2">
                      <input
                        ref={baseFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setBaseReferenceFile(e.target.files?.[0] || null)
                        }
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => baseFileInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {baseReferenceFile
                          ? baseReferenceFile.name
                          : "기본 참고 이미지 선택"}
                      </Button>
                      {baseReferenceFile && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-800">
                              참고 이미지 업로드됨: {baseReferenceFile.name}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>스타일 옵션</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="photographic"
                          checked={styleOptions.photographic}
                          onCheckedChange={(checked: boolean) =>
                            setStyleOptions({
                              ...styleOptions,
                              photographic: checked,
                            })
                          }
                        />
                        <Label htmlFor="photographic" className="text-sm">
                          캐릭터 일관성
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="consistent_lighting"
                          checked={styleOptions.consistent_lighting}
                          onCheckedChange={(checked: boolean) =>
                            setStyleOptions({
                              ...styleOptions,
                              consistent_lighting: checked,
                            })
                          }
                        />
                        <Label
                          htmlFor="consistent_lighting"
                          className="text-sm"
                        >
                          일관된 조명
                        </Label>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      --style raw, --v 6, --ar 9:16 자동 적용
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateScenePrompts}
                    disabled={loading || !description.trim()}
                    className="w-full"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4 mr-2" />
                    )}
                    10단계 장면 생성
                  </Button>
                </>
              )}

              {/* 2단계: 이미지 생성 */}
              {currentStep === 2 && (
                <>
                  {baseReferenceFile && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          기본 참고 이미지 적용됨
                        </span>
                      </div>
                      <p className="text-xs text-blue-600">
                        {baseReferenceFile.name}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="reference">
                      추가 참고 이미지 (선택사항)
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      {baseReferenceFile
                        ? "필요시 추가 참고 이미지를 업로드할 수 있습니다"
                        : "참고 이미지를 업로드하지 않으면 텍스트만으로 이미지를 생성합니다"}
                    </p>
                    <div className="mt-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setReferenceFile(e.target.files?.[0] || null)
                        }
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {referenceFile
                          ? referenceFile.name
                          : "추가 참고 이미지 선택"}
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateImages}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4 mr-2" />
                    )}
                    장면 이미지 생성
                  </Button>
                </>
              )}

              {/* 3단계: 영상 프롬프트 생성 */}
              {currentStep === 3 && (
                <Button
                  onClick={handleGenerateVideoPrompts}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Film className="w-4 h-4 mr-2" />
                  )}
                  영상 프롬프트 생성
                </Button>
              )}

              {/* 4단계: 영상 생성 */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">
                      S2V-01 모델 특징
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• 캐릭터 일관성 유지</li>
                      <li>• 부드러운 움직임</li>
                      <li>• 30fps 고품질</li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleGenerateVideos}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Video className="w-4 h-4 mr-2" />
                    )}
                    최종 영상 생성
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 우측: 결과 표시 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>결과 미리보기</CardTitle>
            </CardHeader>
            <CardContent>
              {!project ? (
                <div className="text-center py-12 text-muted-foreground">
                  단계 1을 완료하면 결과가 여기에 표시됩니다.
                </div>
              ) : (
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList>
                    <TabsTrigger value="prompts">장면 프롬프트</TabsTrigger>
                    {project.scene_images &&
                      project.scene_images.length > 0 && (
                        <TabsTrigger value="images">이미지</TabsTrigger>
                      )}
                    {project.video_prompts &&
                      project.video_prompts.length > 0 && (
                        <TabsTrigger value="video-prompts">
                          영상 프롬프트
                        </TabsTrigger>
                      )}
                    {project.videos && project.videos.length > 0 && (
                      <TabsTrigger value="videos">영상</TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="prompts" className="space-y-3">
                    {(project.scene_prompts || []).map((prompt, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Scene {index + 1}</Badge>
                        </div>
                        <p className="text-sm">{prompt}</p>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="images" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {(project.scene_images || []).map((image, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge
                              variant={
                                image.status === "success"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              Scene {image.scene_number}
                            </Badge>
                            {image.status === "success" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  openRegenerateDialog(
                                    image.scene_number,
                                    image.prompt
                                  )
                                }
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          {image.status === "success" && image.filepath ? (
                            <img
                              src={`${API_BASE}/${image.filepath.replace(
                                "downloads/scene_images/",
                                "scene_images/"
                              )}`}
                              alt={`Scene ${image.scene_number}`}
                              className="w-full h-32 object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                              <span className="text-sm text-gray-500">
                                생성 실패
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="video-prompts" className="space-y-3">
                    {(project.video_prompts || []).map(
                      (prompt, index) =>
                        prompt && (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">Video {index + 1}</Badge>
                            </div>
                            <p className="text-sm">{prompt}</p>
                          </div>
                        )
                    )}
                  </TabsContent>

                  <TabsContent value="videos" className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      {(project.videos || []).map((videoPath, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <Badge className="mb-2">Video {index + 1}</Badge>
                          <video
                            controls
                            className="w-full max-w-sm rounded"
                            src={`${API_BASE}/${videoPath.replace(
                              "downloads/videos/",
                              "videos/"
                            )}`}
                          />
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 재생성 다이얼로그 */}
      <Dialog
        open={regenerateDialogOpen}
        onOpenChange={setRegenerateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Scene {regenerateSceneNumber} 이미지 재생성
            </DialogTitle>
            <DialogDescription>
              새로운 프롬프트를 입력하거나 기존 프롬프트를 수정하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="regenerate-prompt">프롬프트</Label>
              <Textarea
                id="regenerate-prompt"
                value={regeneratePrompt}
                onChange={(e) => setRegeneratePrompt(e.target.value)}
                rows={3}
                placeholder="새로운 프롬프트를 입력하거나 기존 프롬프트를 수정하세요"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRegenerateDialogOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleRegenerateImage} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              재생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
