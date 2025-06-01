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
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  projectApi,
  dogApi,
  promptTypeApi,
  DogAnalysis,
  PromptType,
} from "@/lib/api";
import {
  ArrowLeft,
  Upload,
  X,
  Check,
  Sparkles,
  ImageIcon,
  Video,
  Wand2,
  Play,
  CheckCircle,
} from "lucide-react";

export default function CreatePage() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const router = useRouter();

  // 워크플로우 선택
  const [selectedWorkflow, setSelectedWorkflow] = useState<
    "classic" | "dog" | "direct"
  >("classic");

  // 강아지 관련 상태
  const [dogImage, setDogImage] = useState<File | null>(null);
  const [dogImagePreview, setDogImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // 프롬프트 타입 관련 상태
  const [promptTypes, setPromptTypes] = useState<PromptType[]>([]);
  const [selectedPromptType, setSelectedPromptType] = useState<string>("");
  const [loadingPromptTypes, setLoadingPromptTypes] = useState(true);
  const [promptTypesError, setPromptTypesError] = useState<string | null>(null);

  // 클래식 워크플로우 상태
  const [classicProject, setClassicProject] = useState<any>(null);
  const [stepByStep, setStepByStep] = useState(false);

  // 강아지 워크플로우 상태 추가
  const [dogProject, setDogProject] = useState<any>(null);
  const [dogStepByStep, setDogStepByStep] = useState(false);

  // 직접 영상 생성 워크플로우 상태 추가
  const [directVideoProject, setDirectVideoProject] = useState<any>(null);
  const [directImages, setDirectImages] = useState<File[]>([]);
  const [directImagePreviews, setDirectImagePreviews] = useState<string[]>([]);
  const [directImagePrompts, setDirectImagePrompts] = useState<string[]>([]);
  const [directDescription, setDirectDescription] = useState("");

  // 프롬프트 타입 로드
  useEffect(() => {
    // API 호출 대신 하드코딩된 프롬프트 타입 사용 (임시)
    setPromptTypes([
      {
        type: "cooking",
        name: "요리 콘텐츠",
        description: "강아지가 셰프가 되어 다양한 요리를 만드는 콘텐츠",
        icon: "🍳",
        examples: [],
        suggested_descriptions: ["making pizza", "baking cookies"],
        example: "강아지가 피자를 만드는 모습",
      },
      {
        type: "life",
        name: "일상 생활",
        description: "강아지의 다양한 일상 활동을 담은 콘텐츠",
        icon: "🐕",
        examples: [],
        suggested_descriptions: ["walking in park", "playing with toys"],
        example: "강아지가 공원에서 산책하는 모습",
      },
    ]);
    setSelectedPromptType("cooking");
    setLoadingPromptTypes(false);
    console.log("✅ 하드코딩된 프롬프트 타입 로딩 완료");
  }, []);

  // 선택된 프롬프트 타입 찾기 헬퍼 함수
  const getSelectedPromptType = () => {
    return promptTypes.find((type) => type.type === selectedPromptType);
  };

  // 강아지 이미지 업로드 핸들러
  const handleDogImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  // 파일 처리 공통 함수
  const processFile = (file: File) => {
    // 이미지 파일 검증
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    // 현재 선택된 워크플로우에 따라 다르게 처리
    if (selectedWorkflow === "direct") {
      setDirectImages([file]);
      const reader = new FileReader();
      reader.onload = (e) => {
        setDirectImagePreviews([e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    } else {
      setDogImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setDogImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 강아지 이미지 제거
  const removeDogImage = () => {
    setDogImage(null);
    setDogImagePreview(null);
  };

  // 강아지 워크플로우 핸들러 (기존)
  const handleDogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    if (!selectedPromptType) {
      alert("프롬프트 타입을 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      let project: any;

      if (dogImage) {
        // 🎬 강아지 이미지 + 4단계 워크플로우
        setCurrentStep("강아지 분석 및 단계별 프롬프트 생성 중...");
        setProgress(20);

        const formData = new FormData();
        formData.append("description", description);
        formData.append("num_steps", "5");
        formData.append("file", dogImage);

        project = await projectApi.createNewWorkflow(formData);

        console.log("🎬 New 4-step workflow project created:", project);
        setDogProject(project);

        if (dogStepByStep) {
          // 단계별 워크플로우
          setCurrentStep(
            "새로운 4단계 워크플로우 프로젝트가 생성되었습니다. 다음 단계를 진행해주세요."
          );
          setProgress(100);
        } else {
          // 완전한 4단계 워크플로우 실행
          setCurrentStep("완전한 4단계 워크플로우 실행 중... (약 5-10분 소요)");
          setProgress(50);

          // 완전한 워크플로우 실행
          if (project?.project_id) {
            const result = await projectApi.executeCompleteWorkflow(
              project.project_id
            );

            console.log("✅ Complete workflow result:", result);

            setCurrentStep("완료!");
            setProgress(100);

            setTimeout(() => {
              router.push(`/project/${project.project_id}`);
            }, 1000);
          }
        }
      } else {
        // 기존 워크플로우 (강아지 이미지 없음)
        setCurrentStep("프롬프트 생성 중...");
        setProgress(20);

        project = await projectApi.create({
          description,
          content_type: selectedPromptType,
        });

        console.log("📝 Basic project created:", project);
        setDogProject(project);

        if (dogStepByStep) {
          // 단계별 워크플로우
          setCurrentStep(
            "기본 프로젝트가 생성되었습니다. 다음 단계를 진행해주세요."
          );
          setProgress(100);
        } else {
          // 전체 워크플로우 실행
          setCurrentStep("이미지와 영상 생성 중...");
          setProgress(50);

          await projectApi.generateAll(project.project_id);

          setCurrentStep("완료!");
          setProgress(100);

          setTimeout(() => {
            router.push(`/project/${project.project_id}`);
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Error creating project:", error);
      alert("프로젝트 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 강아지 워크플로우용 단계별 핸들러들
  const handleDogGenerateVideos = async () => {
    if (!dogProject) return;

    setLoading(true);
    try {
      setCurrentStep("4단계: 최종 비디오 생성 중... (약 2-3분 소요)");
      setProgress(80);

      if (dogProject.project_id) {
        // 4단계: 비디오 생성
        const result = await projectApi.executeWorkflowStep(
          dogProject.project_id,
          4
        );

        console.log("✅ Step 4 result:", result);

        setCurrentStep("비디오 생성 완료!");
        setProgress(100);

        // 프로젝트 새로고침
        const updatedProject = await projectApi.get(dogProject.project_id);
        setDogProject(updatedProject);

        // 프로젝트 페이지로 이동
        setTimeout(() => {
          router.push(`/project/${dogProject.project_id}`);
        }, 2000);
      } else {
        throw new Error("Invalid project ID");
      }
    } catch (error) {
      console.error("Error executing step 4:", error);
      alert("4단계 실행 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 새로운 4단계 워크플로우 단계별 핸들러들
  const handleExecuteStep1 = async () => {
    if (!dogProject) return;

    setLoading(true);
    try {
      setCurrentStep("1단계: 단계별 프롬프트 생성 중...");
      setProgress(25);

      const result = await projectApi.executeWorkflowStep(
        dogProject.project_id,
        1
      );
      console.log("✅ Step 1 result:", result);

      setCurrentStep("1단계 완료!");
      setProgress(100);

      // 프로젝트 새로고침
      const updatedProject = await projectApi.get(dogProject.project_id);
      setDogProject(updatedProject);
    } catch (error) {
      console.error("Error executing step 1:", error);
      alert("1단계 실행 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteStep2 = async () => {
    if (!dogProject) return;

    setLoading(true);
    try {
      setCurrentStep("2단계: 이미지 생성 중... (약 2-3분 소요)");
      setProgress(50);

      const result = await projectApi.executeWorkflowStep(
        dogProject.project_id,
        2
      );
      console.log("✅ Step 2 result:", result);

      setCurrentStep("2단계 완료!");
      setProgress(100);

      // 프로젝트 새로고침
      const updatedProject = await projectApi.get(dogProject.project_id);
      setDogProject(updatedProject);
    } catch (error) {
      console.error("Error executing step 2:", error);
      alert("2단계 실행 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteStep3 = async () => {
    if (!dogProject) return;

    setLoading(true);
    try {
      setCurrentStep("3단계: 최적 이미지 선택 및 비디오 프롬프트 생성 중...");
      setProgress(75);

      const result = await projectApi.executeWorkflowStep(
        dogProject.project_id,
        3
      );
      console.log("✅ Step 3 result:", result);

      setCurrentStep("3단계 완료!");
      setProgress(100);

      // 프로젝트 새로고침
      const updatedProject = await projectApi.get(dogProject.project_id);
      setDogProject(updatedProject);
    } catch (error) {
      console.error("Error executing step 3:", error);
      alert("3단계 실행 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteCompleteWorkflow = async () => {
    if (!dogProject) return;

    setLoading(true);
    try {
      setCurrentStep("완전한 4단계 워크플로우 실행 중... (약 5-10분 소요)");
      setProgress(50);

      const result = await projectApi.executeCompleteWorkflow(
        dogProject.project_id
      );
      console.log("✅ Complete workflow result:", result);

      setCurrentStep("완료!");
      setProgress(100);

      setTimeout(() => {
        router.push(`/project/${dogProject.project_id}`);
      }, 1000);
    } catch (error) {
      console.error("Error executing complete workflow:", error);
      alert("완전한 워크플로우 실행 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 클래식 워크플로우 핸들러
  const handleClassicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    if (!selectedPromptType) {
      alert("프롬프트 타입을 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      // 클래식 프로젝트 생성
      setCurrentStep("이미지 프롬프트 생성 중...");
      setProgress(20);

      const project = await projectApi.create({
        description,
        content_type: selectedPromptType,
      });

      console.log("📝 Classic project created:", project);
      setClassicProject(project);

      if (stepByStep) {
        // 단계별 워크플로우
        setCurrentStep("프로젝트가 생성되었습니다. 다음 단계를 진행해주세요.");
        setProgress(100);
      } else {
        // 전체 워크플로우 실행
        setCurrentStep("이미지와 비디오 생성 중...");
        setProgress(50);

        await projectApi.generateAll(project.project_id);

        setCurrentStep("워크플로우 완료!");
        setProgress(100);

        // 프로젝트 페이지로 이동
        setTimeout(() => {
          router.push(`/project/${project.project_id}`);
        }, 2000);
      }
    } catch (error) {
      console.error("Error creating classic project:", error);
      alert("프로젝트 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 단계별 클래식 워크플로우 핸들러들 (임시로 비활성화)
  const handleGenerateImages = async () => {
    alert("이 기능은 현재 개발 중입니다.");
  };

  const handleSelectBestImages = async () => {
    alert("이 기능은 현재 개발 중입니다.");
  };

  const handleGenerateOptimizedVideos = async () => {
    alert("이 기능은 현재 개발 중입니다.");
  };

  // 직접 영상 생성 워크플로우 핸들러
  const handleDirectVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (directImages.length === 0) {
      alert("이미지를 업로드해주세요.");
      return;
    }

    if (directImagePrompts.some((prompt) => !prompt.trim())) {
      alert("모든 이미지에 대한 프롬프트를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      // 1단계: 직접 영상 프로젝트 생성
      setCurrentStep("프로젝트 생성 중...");
      setProgress(20);

      const formData = new FormData();
      formData.append("description", directDescription);
      formData.append("prompts", JSON.stringify(directImagePrompts)); // 사용자 프롬프트 전송

      // 모든 이미지 추가
      directImages.forEach((file, index) => {
        formData.append("files", file);
      });

      const project = await projectApi.createDirectVideo(formData);
      console.log("🎬 Direct video project created:", project);
      setDirectVideoProject(project);

      // 2단계: 즉시 영상 생성 실행
      setCurrentStep("사용자 프롬프트로 영상 생성 중...");
      setProgress(50);

      const result = await projectApi.executeDirectVideo(project.project_id);
      console.log("🎥 Direct video generation result:", result);

      setDirectVideoProject(result);
      setCurrentStep("영상 생성 완료!");
      setProgress(100);

      // 잠시 후 완료 상태로 변경
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error in direct video workflow:", error);
      alert("영상 생성 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  if (loadingPromptTypes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">프롬프트 타입을 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              홈으로
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                YouTube Shorts 생성
              </h1>
              <p className="text-gray-600 mt-1">
                AI로 자동 생성되는 YouTube Shorts 콘텐츠
              </p>
            </div>
          </div>

          {/* 워크플로우 선택 탭 */}
          <Tabs
            value={selectedWorkflow}
            onValueChange={(value: string) =>
              setSelectedWorkflow(value as "classic" | "dog" | "direct")
            }
          >
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="classic" className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                클래식 워크플로우
              </TabsTrigger>
              <TabsTrigger value="dog" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                강아지 이미지 업로드
              </TabsTrigger>
              <TabsTrigger value="direct" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                직접 영상 생성
              </TabsTrigger>
            </TabsList>

            {/* 클래식 워크플로우 */}
            <TabsContent value="classic">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    클래식 워크플로우
                  </CardTitle>
                  <CardDescription>
                    텍스트 설명 → 이미지 생성(3개씩) → AI 최적 선택 → 비디오
                    생성
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 진행률 표시 */}
                  {loading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{currentStep}</span>
                        <span className="text-gray-600">{progress}%</span>
                      </div>
                      <Progress value={progress} className="w-full" />
                    </div>
                  )}

                  {!classicProject ? (
                    /* 프로젝트 생성 폼 */
                    <form onSubmit={handleClassicSubmit} className="space-y-4">
                      {/* 프롬프트 타입 선택 */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          콘텐츠 타입
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {promptTypes
                            .filter((type) => type.status !== "coming_soon")
                            .map((type) => (
                              <button
                                key={type.type}
                                type="button"
                                onClick={() => setSelectedPromptType(type.type)}
                                className={`p-3 rounded-lg border text-left transition-colors ${
                                  selectedPromptType === type.type
                                    ? "border-purple-500 bg-purple-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <div className="font-medium">{type.name}</div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {type.description}
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>

                      {/* 설명 입력 */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          콘텐츠 설명
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder={
                            getSelectedPromptType()?.example ||
                            "생성하고 싶은 YouTube Shorts 내용을 상세히 설명해주세요..."
                          }
                          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          required
                        />
                      </div>

                      {/* 워크플로우 옵션 */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">
                          실행 방식
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="workflow"
                              checked={!stepByStep}
                              onChange={() => setStepByStep(false)}
                              className="form-radio text-purple-600"
                            />
                            <span>전체 워크플로우 자동 실행</span>
                          </label>
                          <label className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="workflow"
                              checked={stepByStep}
                              onChange={() => setStepByStep(true)}
                              className="form-radio text-purple-600"
                            />
                            <span>단계별 수동 실행</span>
                          </label>
                        </div>
                      </div>

                      {/* 생성 버튼 */}
                      <Button
                        type="submit"
                        disabled={loading || !description.trim()}
                        className="w-full"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            생성 중...
                          </div>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            클래식 프로젝트 생성
                          </>
                        )}
                      </Button>
                    </form>
                  ) : (
                    /* 단계별 실행 버튼들 */
                    stepByStep && (
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h3 className="font-medium text-green-800 mb-1">
                            프로젝트 생성 완료!
                          </h3>
                          <p className="text-sm text-green-600">
                            {classicProject.message}
                          </p>
                        </div>

                        {/* Step 1: 이미지 생성 */}
                        <Button
                          onClick={handleGenerateImages}
                          disabled={
                            loading ||
                            classicProject?.status !== "prompts_generated"
                          }
                          className="w-full"
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          1단계: 이미지 생성 (프롬프트당 3개씩)
                        </Button>

                        {/* Step 2: 최적 이미지 선택 */}
                        <Button
                          onClick={handleSelectBestImages}
                          disabled={
                            loading ||
                            classicProject?.status !== "images_generated"
                          }
                          className="w-full"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          2단계: AI 최적 이미지 선택
                        </Button>

                        {/* Step 3: 비디오 생성 */}
                        <Button
                          onClick={handleGenerateOptimizedVideos}
                          disabled={
                            loading ||
                            classicProject?.status !== "best_images_selected"
                          }
                          className="w-full"
                        >
                          <Video className="h-4 w-4 mr-2" />
                          3단계: 최적화된 비디오 생성
                        </Button>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 강아지 워크플로우 */}
            <TabsContent value="dog">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    강아지 이미지 업로드 워크플로우
                  </CardTitle>
                  <CardDescription>
                    강아지 이미지 업로드 → 분석 → 새로운 4단계 워크플로우 실행
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 진행률 표시 */}
                  {loading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{currentStep}</span>
                        <span className="text-gray-600">{progress}%</span>
                      </div>
                      <Progress value={progress} className="w-full" />
                    </div>
                  )}

                  {!dogProject ? (
                    /* 프로젝트 생성 폼 */
                    <form onSubmit={handleDogSubmit} className="space-y-4">
                      {/* 프롬프트 타입 선택 */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          콘텐츠 타입
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {promptTypes
                            .filter((type) => type.status !== "coming_soon")
                            .map((type) => (
                              <button
                                key={type.type}
                                type="button"
                                onClick={() => setSelectedPromptType(type.type)}
                                className={`p-3 rounded-lg border text-left transition-colors ${
                                  selectedPromptType === type.type
                                    ? "border-purple-500 bg-purple-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <div className="font-medium">{type.name}</div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {type.description}
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>

                      {/* 강아지 이미지 업로드 */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          강아지 이미지 업로드 (선택사항)
                        </label>
                        {!dogImagePreview ? (
                          <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                              isDragOver
                                ? "border-purple-500 bg-purple-50"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() =>
                              document.getElementById("dogImageInput")?.click()
                            }
                          >
                            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-2">
                              강아지 이미지를 드래그하거나 클릭하여 업로드
                            </p>
                            <p className="text-sm text-gray-500">
                              PNG, JPG, JPEG 파일만 지원됩니다
                            </p>
                            <input
                              id="dogImageInput"
                              type="file"
                              accept="image/*"
                              onChange={handleDogImageChange}
                              className="hidden"
                            />
                          </div>
                        ) : (
                          <div className="relative">
                            <img
                              src={dogImagePreview}
                              alt="강아지 미리보기"
                              className="w-full max-w-sm mx-auto rounded-lg shadow-md"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={removeDogImage}
                              className="absolute top-2 right-2 bg-white"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* 설명 입력 */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          콘텐츠 설명
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder={
                            getSelectedPromptType()?.example ||
                            "생성하고 싶은 YouTube Shorts 내용을 상세히 설명해주세요..."
                          }
                          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          required
                        />
                      </div>

                      {/* 워크플로우 옵션 */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">
                          실행 방식
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="dogWorkflow"
                              checked={!dogStepByStep}
                              onChange={() => setDogStepByStep(false)}
                              className="form-radio text-purple-600"
                            />
                            <span>전체 워크플로우 자동 실행</span>
                          </label>
                          <label className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="dogWorkflow"
                              checked={dogStepByStep}
                              onChange={() => setDogStepByStep(true)}
                              className="form-radio text-purple-600"
                            />
                            <span>단계별 수동 실행</span>
                          </label>
                        </div>
                      </div>

                      {/* 워크플로우 설명 */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-medium text-blue-800 mb-2">
                          {dogImage
                            ? "새로운 4단계 워크플로우"
                            : "기본 워크플로우"}
                        </h3>
                        <p className="text-sm text-blue-600">
                          {dogImage
                            ? "1단계: 단계별 프롬프트 생성 → 2단계: 이미지 생성 → 3단계: 최적 이미지 선택 및 비디오 프롬프트 생성 → 4단계: 최종 비디오 생성"
                            : "기본 프롬프트를 사용하여 이미지와 영상을 순차적으로 생성합니다."}
                        </p>
                      </div>

                      {/* 생성 버튼 */}
                      <Button
                        type="submit"
                        disabled={loading || !description.trim()}
                        className="w-full"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            생성 중...
                          </div>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            {dogImage
                              ? "강아지 맞춤 프로젝트 생성"
                              : "기본 프로젝트 생성"}
                          </>
                        )}
                      </Button>
                    </form>
                  ) : (
                    /* 단계별 실행 버튼들 */
                    dogStepByStep && (
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h3 className="font-medium text-green-800 mb-1">
                            프로젝트 생성 완료!
                          </h3>
                          <p className="text-sm text-green-600">
                            {dogImage
                              ? "강아지 맞춤형 프로젝트가"
                              : "기본 프로젝트가"}{" "}
                            생성되었습니다.
                          </p>
                        </div>

                        <h3 className="text-lg font-semibold">단계별 실행</h3>

                        {/* Step 1: 단계별 프롬프트 생성 */}
                        <div className="flex items-center gap-4">
                          <Button
                            onClick={handleExecuteStep1}
                            disabled={
                              loading || dogProject?.step_prompts?.length > 0
                            }
                            className="flex-1"
                          >
                            <Wand2 className="h-4 w-4 mr-2" />
                            1단계: 단계별 프롬프트 생성
                          </Button>
                          {dogProject?.step_prompts?.length > 0 && (
                            <span className="text-green-600 text-sm">
                              ✅ 완료
                            </span>
                          )}
                        </div>

                        {/* Step 2: 이미지 생성 */}
                        <div className="flex items-center gap-4">
                          <Button
                            onClick={handleExecuteStep2}
                            disabled={
                              loading ||
                              !dogProject?.step_prompts?.length ||
                              dogProject?.generated_images?.length > 0
                            }
                            className="flex-1"
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            2단계: 이미지 생성
                          </Button>
                          {dogProject?.generated_images?.length > 0 && (
                            <span className="text-green-600 text-sm">
                              ✅ 완료
                            </span>
                          )}
                        </div>

                        {/* Step 3: 최적 이미지 선택 및 비디오 프롬프트 생성 */}
                        <div className="flex items-center gap-4">
                          <Button
                            onClick={handleExecuteStep3}
                            disabled={
                              loading ||
                              !dogProject?.generated_images?.length ||
                              dogProject?.video_prompt
                            }
                            className="flex-1"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            3단계: 최적 이미지 선택 및 비디오 프롬프트 생성
                          </Button>
                          {dogProject?.video_prompt && (
                            <span className="text-green-600 text-sm">
                              ✅ 완료
                            </span>
                          )}
                        </div>

                        {/* Step 4: 최종 비디오 생성 */}
                        <div className="flex items-center gap-4">
                          <Button
                            onClick={handleDogGenerateVideos}
                            disabled={
                              loading ||
                              !dogProject?.video_prompt ||
                              dogProject?.final_video_path
                            }
                            className="flex-1"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            4단계: 최종 비디오 생성
                          </Button>
                          {dogProject?.final_video_path && (
                            <span className="text-green-600 text-sm">
                              ✅ 완료
                            </span>
                          )}
                        </div>

                        {/* 전체 워크플로우 한번에 실행 옵션 */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-600 mb-3">
                            또는 한번에 모든 단계 실행:
                          </p>
                          <Button
                            onClick={handleExecuteCompleteWorkflow}
                            disabled={
                              loading || dogProject?.status === "completed"
                            }
                            className="w-full"
                            variant="outline"
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            완전한 4단계 워크플로우 한번에 실행
                          </Button>
                        </div>

                        {/* 생성된 단계별 프롬프트 */}
                        {dogProject?.step_prompts?.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-md font-semibold mb-3">
                              생성된 단계별 프롬프트
                            </h4>
                            <div className="space-y-2">
                              {dogProject.step_prompts.map(
                                (prompt: string, index: number) => (
                                  <div
                                    key={index}
                                    className="p-3 bg-gray-50 rounded-lg"
                                  >
                                    <div className="text-sm font-medium text-gray-700">
                                      Step {index + 1}:
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      {prompt}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* 생성된 이미지들 미리보기 */}
                        {dogProject?.generated_images?.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-md font-semibold mb-3">
                              생성된 이미지들
                            </h4>
                            <div className="grid grid-cols-5 gap-2">
                              {dogProject.generated_images.map(
                                (image: string, index: number) => (
                                  <div key={index} className="relative">
                                    <img
                                      src={`http://localhost:8000/${image}`}
                                      alt={`Step ${index + 1}`}
                                      className="w-full h-20 object-cover rounded border"
                                    />
                                    <span className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                      {index + 1}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* 선택된 이미지 및 비디오 프롬프트 */}
                        {dogProject?.selected_image_index !== undefined && (
                          <div className="mt-6">
                            <h4 className="text-md font-semibold mb-3">
                              선택된 최적 이미지 및 비디오 프롬프트
                            </h4>
                            <div className="border rounded-lg p-4">
                              <div className="text-sm text-gray-600 mb-2">
                                선택된 이미지:{" "}
                                {dogProject.selected_image_index + 1}번째
                              </div>
                              {dogProject.selection_reason && (
                                <div className="text-sm text-gray-600 mb-3">
                                  선택 이유: {dogProject.selection_reason}
                                </div>
                              )}
                              {dogProject.video_prompt && (
                                <div className="bg-blue-50 p-3 rounded">
                                  <div className="text-sm font-medium text-blue-800 mb-1">
                                    생성된 비디오 프롬프트:
                                  </div>
                                  <div className="text-sm text-blue-700">
                                    {dogProject.video_prompt}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 최종 생성된 비디오 */}
                        {dogProject?.final_video_path && (
                          <div className="mt-6">
                            <h4 className="text-md font-semibold mb-3">
                              최종 생성된 비디오
                            </h4>
                            <video
                              src={`http://localhost:8000/${dogProject.final_video_path}`}
                              controls
                              className="w-full max-w-md mx-auto rounded border"
                            />
                          </div>
                        )}

                        {/* 완료 후 결과 보기 */}
                        {dogProject?.status === "completed" && (
                          <div className="mt-6 pt-4 border-t border-gray-200">
                            <Button
                              onClick={() =>
                                router.push(
                                  `/project/${dogProject?.project_id}`
                                )
                              }
                              className="w-full"
                              variant="default"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              프로젝트 완료 - 상세 결과 보기
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 직접 영상 생성 */}
            <TabsContent value="direct">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    직접 영상 생성
                  </CardTitle>
                  <CardDescription>
                    이미지 업로드 → 각 이미지별 프롬프트 입력 → 영상 생성
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 진행률 표시 */}
                  {loading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{currentStep}</span>
                        <span className="text-gray-600">{progress}%</span>
                      </div>
                      <Progress value={progress} className="w-full" />
                    </div>
                  )}

                  {!directVideoProject ? (
                    /* 프로젝트 생성 폼 */
                    <form
                      onSubmit={handleDirectVideoSubmit}
                      className="space-y-4"
                    >
                      {/* 여러 이미지 업로드 */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          이미지 업로드 (최대 10개)
                        </label>

                        {/* 업로드 영역 */}
                        <div
                          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                            isDragOver
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() =>
                            document
                              .getElementById("multipleImagesInput")
                              ?.click()
                          }
                        >
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-2">
                            이미지들을 드래그하거나 클릭하여 업로드
                          </p>
                          <p className="text-sm text-gray-500">
                            PNG, JPG, JPEG 파일만 지원됩니다 (최대 10개)
                          </p>
                          <input
                            id="multipleImagesInput"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length > 10) {
                                alert(
                                  "최대 10개의 이미지까지 업로드할 수 있습니다."
                                );
                                return;
                              }
                              setDirectImages(files);

                              // 미리보기 생성
                              const previews: string[] = [];
                              const prompts: string[] = [];

                              files.forEach((file, index) => {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  previews[index] = event.target
                                    ?.result as string;
                                  if (
                                    previews.filter((p) => p).length ===
                                    files.length
                                  ) {
                                    setDirectImagePreviews([...previews]);
                                  }
                                };
                                reader.readAsDataURL(file);
                                prompts.push(""); // 빈 프롬프트로 초기화
                              });

                              setDirectImagePrompts(prompts);
                            }}
                            className="hidden"
                          />
                        </div>

                        {/* 업로드된 이미지들과 프롬프트 입력 */}
                        {directImagePreviews.length > 0 && (
                          <div className="space-y-4 mt-4">
                            <h4 className="text-md font-semibold">
                              업로드된 이미지와 프롬프트 (
                              {directImagePreviews.length}개)
                            </h4>

                            {directImagePreviews.map((preview, index) => (
                              <div
                                key={index}
                                className="border rounded-lg p-4 space-y-3"
                              >
                                <div className="flex items-start gap-4">
                                  <div className="relative flex-shrink-0">
                                    <img
                                      src={preview}
                                      alt={`이미지 ${index + 1}`}
                                      className="w-24 h-24 object-cover rounded border"
                                    />
                                    <span className="absolute -top-2 -left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                                      {index + 1}
                                    </span>
                                  </div>

                                  <div className="flex-1 space-y-2">
                                    <label className="text-sm font-medium text-gray-700">
                                      이미지 {index + 1} 프롬프트
                                    </label>
                                    <textarea
                                      value={directImagePrompts[index] || ""}
                                      onChange={(e) => {
                                        const newPrompts = [
                                          ...directImagePrompts,
                                        ];
                                        newPrompts[index] = e.target.value;
                                        setDirectImagePrompts(newPrompts);
                                      }}
                                      placeholder={`이미지 ${
                                        index + 1
                                      }에 대한 Midjourney 스타일 프롬프트를 입력하세요...\n예: "A lonely cardboard box sits on a snowy street under a lamppost on a freezing winter night. --ar 3:2 --style cinematic --v 6"`}
                                      className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                                      required
                                    />
                                  </div>

                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newImages = directImages.filter(
                                        (_, i) => i !== index
                                      );
                                      const newPreviews =
                                        directImagePreviews.filter(
                                          (_, i) => i !== index
                                        );
                                      const newPrompts =
                                        directImagePrompts.filter(
                                          (_, i) => i !== index
                                        );

                                      setDirectImages(newImages);
                                      setDirectImagePreviews(newPreviews);
                                      setDirectImagePrompts(newPrompts);
                                    }}
                                    className="bg-white"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setDirectImages([]);
                                setDirectImagePreviews([]);
                                setDirectImagePrompts([]);
                              }}
                              className="w-full"
                            >
                              모든 이미지 제거
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* 전체 스토리 설명 */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          전체 스토리 설명 (선택사항)
                        </label>
                        <textarea
                          value={directDescription}
                          onChange={(e) => setDirectDescription(e.target.value)}
                          placeholder="전체 스토리에 대한 간단한 설명을 입력하세요..."
                          className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        />
                      </div>

                      {/* 생성 버튼 */}
                      <Button
                        type="submit"
                        disabled={
                          loading ||
                          directImagePreviews.length === 0 ||
                          directImagePrompts.some((prompt) => !prompt.trim())
                        }
                        className="w-full"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            생성 중...
                          </div>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            {directImagePreviews.length}개 이미지로 영상 생성
                          </>
                        )}
                      </Button>

                      {/* 도움말 */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-2">
                          프롬프트 작성 가이드
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>
                            • 각 이미지는 순서대로 연결되어 하나의 스토리를
                            만듭니다
                          </li>
                          <li>
                            • Midjourney 스타일로 작성: &quot;상황 설명 --ar 3:2
                            --style [스타일] --v 6&quot;
                          </li>
                          <li>
                            • 스타일 예시: cinematic, photorealistic, cozy
                            lighting, warm tone, domestic, playful, joyful,
                            energetic
                          </li>
                          <li>• 25-35단어로 상세하게 설명하세요</li>
                        </ul>
                      </div>
                    </form>
                  ) : (
                    /* 완료 후 결과 보기 */
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="font-medium text-green-800 mb-1">
                          영상 생성 완료!
                        </h3>
                        <p className="text-sm text-green-600">
                          {directVideoProject.message}
                        </p>
                      </div>

                      {/* 생성된 영상들 */}
                      {directVideoProject?.generated_videos &&
                        directVideoProject.generated_videos.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-md font-semibold mb-3">
                              생성된 영상들 (
                              {directVideoProject.generated_videos.length}개)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {directVideoProject.generated_videos.map(
                                (videoPath: string, index: number) => (
                                  <div key={index} className="space-y-2">
                                    <h5 className="text-sm font-medium">
                                      영상 {index + 1}
                                    </h5>
                                    <video
                                      src={`http://localhost:8000${videoPath}`}
                                      controls
                                      className="w-full rounded border"
                                    />
                                    {directVideoProject.story_prompts &&
                                      directVideoProject.story_prompts[
                                        index
                                      ] && (
                                        <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                          {
                                            directVideoProject.story_prompts[
                                              index
                                            ]
                                          }
                                        </p>
                                      )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* 완료 후 결과 보기 */}
                      {directVideoProject?.status === "completed" && (
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <Button
                            onClick={() =>
                              router.push(
                                `/project/${directVideoProject?.project_id}`
                              )
                            }
                            className="w-full"
                            variant="default"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            프로젝트 완료 - 상세 결과 보기
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
