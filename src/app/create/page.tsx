"use client";

import { useState } from "react";
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
import { projectApi } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function CreatePage() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);

    try {
      // 1단계: 프로젝트 생성 및 프롬프트 생성
      setCurrentStep("프롬프트 생성 중...");
      setProgress(10);
      const project = await projectApi.create(description);

      // 2단계: 이미지 및 비디오 한번에 생성
      setCurrentStep("이미지 생성 중... (약 2-3분 소요)");
      setProgress(30);

      await projectApi.generateAll(project.project_id);

      setProgress(100);
      setCurrentStep("완료!");

      // 프로젝트 상세 페이지로 이동
      setTimeout(() => {
        router.push(`/project/${project.project_id}`);
      }, 1000);
    } catch (error) {
      console.error("Error:", error);
      alert("프로젝트 생성 중 오류가 발생했습니다.");
      setLoading(false);
      setProgress(0);
      setCurrentStep("");
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Button variant="ghost" onClick={() => router.push("/")} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        뒤로 가기
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>새 YouTube Shorts 생성</CardTitle>
          <CardDescription>
            생성하고 싶은 영상의 내용을 자세히 설명해주세요. AI가 10개의 장면을
            자동으로 생성합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  영상 설명
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="예: 귀여운 고양이가 집에서 놀고 있는 모습을 담은 영상. 고양이가 장난감을 가지고 놀다가 잠드는 스토리..."
                  rows={6}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                  disabled={loading}
                />
              </div>

              {loading && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{currentStep}</p>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !description.trim()}
                className="w-full"
              >
                {loading ? "생성 중..." : "영상 생성 시작"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
