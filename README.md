# YouTube Shorts Automation Frontend

AI를 활용한 YouTube Shorts 영상 자동 생성 프론트엔드 애플리케이션입니다.

## 기능

- 텍스트 설명을 통한 프로젝트 생성
- AI 기반 프롬프트 자동 생성
- 이미지 자동 생성 및 편집
- 비디오 자동 생성
- 프로젝트 관리 및 추적

## 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI**: Tailwind CSS, shadcn/ui
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **State Management**: Zustand

## 시작하기

### 필수 조건

- Node.js 18 이상
- npm 또는 yarn

### 설치

1. 의존성 설치:

```bash
npm install
```

2. 개발 서버 시작:

```bash
npm run dev
```

3. 브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인합니다.

### 환경 변수

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── create/            # 프로젝트 생성 페이지
│   ├── project/[id]/      # 프로젝트 상세 페이지
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 홈페이지
│   └── globals.css        # 전역 스타일
├── components/ui/         # UI 컴포넌트
│   ├── button.tsx
│   ├── card.tsx
│   └── progress.tsx
└── lib/                   # 유틸리티 및 API
    ├── api.ts            # API 클라이언트
    └── utils.ts          # 유틸리티 함수
```

## 사용법

1. **프로젝트 생성**: 홈페이지에서 "새 프로젝트 생성" 버튼을 클릭하고 영상 설명을 입력합니다.
2. **프롬프트 확인**: AI가 생성한 10개의 장면 설명을 확인합니다.
3. **이미지 생성**: "이미지 생성 시작" 버튼을 클릭하여 각 장면의 이미지를 생성합니다.
4. **비디오 생성**: 이미지가 생성된 후 "비디오 생성 시작" 버튼을 클릭합니다.

## 빌드

프로덕션 빌드를 생성하려면:

```bash
npm run build
npm start
```

## 개발

- `npm run dev` - 개발 서버 시작
- `npm run build` - 프로덕션 빌드 생성
- `npm run lint` - ESLint 실행

## 라이선스

MIT License
