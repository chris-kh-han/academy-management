# React Native 앱 개발 계획서

## 프로젝트 개요

- **목표**: 기존 Next.js F&B 관리 시스템을 React Native 앱으로 개발
- **배포 대상**: iOS App Store, Google Play Store
- **핵심 기능**: 대시보드, 재고 관리, 푸시 알림

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| **프레임워크** | Expo (SDK 52+) + React Native |
| **라우팅** | Expo Router (Next.js App Router와 유사) |
| **스타일링** | NativeWind v4 (Tailwind CSS for RN) |
| **UI 컴포넌트** | Gluestack UI v2 (shadcn/ui 대체) |
| **상태관리** | Zustand + React Query |
| **차트** | Victory Native |
| **리스트** | FlashList |
| **인증** | Clerk Expo SDK |
| **백엔드** | Supabase (기존 유지) |
| **푸시알림** | Expo Notifications + Supabase Edge Functions |

---

## 개발 일정

### Phase 1: MVP (6-8주)

#### 1주차: 프로젝트 셋업
- [ ] Expo 프로젝트 초기화
- [ ] NativeWind + Gluestack UI 설정
- [ ] Expo Router 네비게이션 구조 설계
- [ ] Supabase 클라이언트 연동
- [ ] Clerk Expo 인증 설정
- [ ] 기본 레이아웃 (TabBar, Header)

#### 2주차: 인증 & 브랜드/지점
- [ ] 로그인/회원가입 화면
- [ ] BranchContext → Zustand 스토어 마이그레이션
- [ ] 브랜드/지점 선택 화면
- [ ] 온보딩 플로우 (간소화 버전)

#### 3-4주차: 대시보드
- [ ] KPI 카드 컴포넌트
- [ ] 매출 트렌드 차트 (Victory Native)
- [ ] 카테고리 파이 차트
- [ ] TOP 메뉴 바 차트
- [ ] 저재고 알림 리스트
- [ ] 최근 입출고 리스트
- [ ] Pull-to-refresh 구현

#### 5-6주차: 재고 관리
- [ ] 재료 목록 화면 (FlashList)
- [ ] 검색 & 필터링
- [ ] 재료 상세 화면
- [ ] 입고 등록 폼
- [ ] 출고 등록 폼
- [ ] 재고 조정 기능

#### 7주차: 푸시 알림
- [ ] Expo Notifications 설정
- [ ] 저재고 알림 트리거 (Supabase Edge Function)
- [ ] 알림 권한 요청 플로우
- [ ] 알림 히스토리 화면

#### 8주차: 테스트 & 배포 준비
- [ ] iOS 시뮬레이터 테스트
- [ ] Android 에뮬레이터 테스트
- [ ] 실기기 테스트
- [ ] App Store Connect 설정
- [ ] Google Play Console 설정
- [ ] 첫 번째 빌드 제출

---

### Phase 2: 확장 기능 (10-12주)

#### 9-12주차: 판매 기록
- [ ] 판매 목록 화면
- [ ] 판매 등록 폼
- [ ] 날짜 범위 필터
- [ ] CSV 업로드 (서버 사이드 처리)

#### 13-16주차: 메뉴/레시피
- [ ] 메뉴 목록 (카테고리별)
- [ ] 메뉴 상세 & 레시피
- [ ] 메뉴 추가/편집
- [ ] 카테고리 관리
- [ ] 메뉴 순서 변경 (Drag & Drop)

#### 17-18주차: 리포트
- [ ] 매출 분석 화면
- [ ] 재고 분석 화면
- [ ] 메뉴 분석 화면
- [ ] 기간별 필터링

#### 19-20주차: 설정 & 마무리
- [ ] 설정 화면 (주요 항목만)
- [ ] 사용자 프로필
- [ ] 앱 정보
- [ ] 최종 테스트 & 버그 수정
- [ ] 스토어 업데이트

---

## 프로젝트 구조

```
academy-mobile/
├── app/                      # Expo Router 페이지
│   ├── (auth)/               # 인증 관련
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/               # 메인 탭 네비게이션
│   │   ├── index.tsx         # 대시보드
│   │   ├── inventory.tsx     # 재고
│   │   ├── sales.tsx         # 판매 (Phase 2)
│   │   └── settings.tsx      # 설정
│   ├── inventory/
│   │   ├── [id].tsx          # 재료 상세
│   │   └── add.tsx           # 입출고 등록
│   └── _layout.tsx
├── components/
│   ├── ui/                   # Gluestack UI 래퍼
│   ├── charts/               # Victory Native 차트
│   ├── lists/                # FlashList 컴포넌트
│   └── forms/                # 폼 컴포넌트
├── stores/                   # Zustand 스토어
│   ├── authStore.ts
│   └── branchStore.ts
├── hooks/                    # 커스텀 훅
├── utils/
│   └── supabase.ts           # Supabase 클라이언트
├── types/                    # 타입 정의 (웹에서 복사)
└── constants/
```

---

## Claude Code 설정

### 권장 Agents

프로젝트 `.claude/agents/` 폴더에 추가:

#### rn-component.md
```markdown
# React Native Component Agent

React Native 컴포넌트를 생성합니다.

## 규칙
- NativeWind className 사용
- Gluestack UI 컴포넌트 활용
- TypeScript 타입 필수
- Props 인터페이스 정의

## 참조
- context7로 NativeWind, Gluestack UI 최신 문서 확인
```

#### rn-screen.md
```markdown
# React Native Screen Agent

Expo Router 스크린을 생성합니다.

## 규칙
- React Query로 데이터 페칭
- 로딩/에러/빈 상태 처리
- Pull-to-refresh 포함
- SafeAreaView 사용

## 참조
- context7로 Expo Router, React Query 최신 문서 확인
```

#### migrate-component.md
```markdown
# Component Migration Agent

웹 컴포넌트를 React Native로 변환합니다.

## 변환 규칙
- shadcn/ui → Gluestack UI
- Tailwind CSS → NativeWind
- next/image → expo-image
- next/link → expo-router Link
- onClick → onPress
- div → View
- span/p → Text

## 참조
- 웹 컴포넌트 원본 먼저 Read로 확인
- context7로 대체 라이브러리 문서 확인
```

### 권장 Skills

프로젝트 `.claude/skills/` 폴더에 추가:

#### rn-component.md
```markdown
---
name: rn-component
description: React Native 컴포넌트 생성
---

# /rn-component

NativeWind + Gluestack UI 기반 React Native 컴포넌트를 생성합니다.

## 사용법
/rn-component Button - 버튼 컴포넌트 생성
/rn-component Card title description - 카드 컴포넌트 생성

## 규칙
1. context7로 최신 문서 확인
2. TypeScript 타입 정의
3. NativeWind className 사용
4. Gluestack UI 컴포넌트 활용
```

#### rn-screen.md
```markdown
---
name: rn-screen
description: Expo Router 스크린 생성
---

# /rn-screen

Expo Router 스크린을 생성합니다.

## 사용법
/rn-screen inventory - 재고 목록 스크린
/rn-screen inventory/[id] - 재고 상세 스크린

## 규칙
1. app/ 폴더에 생성
2. React Query 데이터 페칭
3. 로딩/에러/빈 상태 처리
4. SafeAreaView 사용
```

---

## 권장 MCP 서버

| MCP | 용도 | 상태 |
|-----|------|------|
| **supabase** | DB 쿼리, 마이그레이션, Edge Functions | 이미 설치됨 |
| **context7** | 최신 라이브러리 문서 참조 | 이미 설치됨 |

### context7 활용 예시

```
# Expo Router 문서 조회
resolve-library-id: "expo-router"
query-docs: "how to create tab navigation"

# NativeWind 문서 조회
resolve-library-id: "nativewind"
query-docs: "how to use dark mode"

# Gluestack UI 문서 조회
resolve-library-id: "gluestack-ui"
query-docs: "button component variants"

# Victory Native 문서 조회
resolve-library-id: "victory-native"
query-docs: "pie chart example"
```

---

## 초기 설정 명령어

```bash
# 1. Expo 프로젝트 생성
pnpm create expo-app academy-mobile --template tabs

# 2. 필수 패키지 설치
cd academy-mobile
pnpm expo install expo-router expo-linking expo-constants expo-status-bar

# 3. NativeWind 설정
pnpm add nativewind tailwindcss
pnpm dlx tailwindcss init

# 4. Gluestack UI 설치
pnpm add @gluestack-ui/themed @gluestack-style/react

# 5. 데이터 관련
pnpm add @supabase/supabase-js @tanstack/react-query zustand

# 6. 차트 & 리스트
pnpm add victory-native @shopify/flash-list react-native-svg

# 7. Clerk 인증
pnpm expo install @clerk/clerk-expo

# 8. 푸시 알림
pnpm expo install expo-notifications expo-device

# 9. 기타 유틸
pnpm add date-fns zod react-hook-form @hookform/resolvers
```

---

## 웹 → 앱 컴포넌트 매핑

| 웹 (Next.js) | 앱 (React Native) |
|--------------|-------------------|
| `<div>` | `<View>` |
| `<span>`, `<p>` | `<Text>` |
| `<button>` | `<Pressable>` or Gluestack `<Button>` |
| `<input>` | `<TextInput>` or Gluestack `<Input>` |
| `<Image>` (next/image) | `<Image>` (expo-image) |
| `<Link>` (next/link) | `<Link>` (expo-router) |
| `onClick` | `onPress` |
| `className` (Tailwind) | `className` (NativeWind) |
| `useRouter()` | `useRouter()` (expo-router) |
| `usePathname()` | `usePathname()` (expo-router) |

### 지원 안 되는 Tailwind 클래스 (NativeWind)

```
# 사용 불가
hover:, focus:, group-hover: (웹 전용)
grid (FlexBox만 지원)
before:, after: (pseudo-elements)

# 대체 필요
cursor-pointer → 불필요 (기본 터치 피드백)
transition → Reanimated 사용
```

---

## 검증 방법

### MVP 완료 기준
- [ ] iOS 시뮬레이터에서 모든 화면 정상 작동
- [ ] Android 에뮬레이터에서 모든 화면 정상 작동
- [ ] 실기기에서 푸시 알림 수신 확인
- [ ] Supabase 데이터 CRUD 정상 작동
- [ ] 로그인/로그아웃 플로우 정상
- [ ] App Store / Play Store 심사 제출 가능 상태

### 테스트 체크리스트
- [ ] 오프라인 상태 처리
- [ ] 네트워크 에러 처리
- [ ] 로딩 상태 표시
- [ ] 빈 데이터 상태 표시
- [ ] 키보드 회피 동작
- [ ] 다크모드 지원 (선택)

---

## 참고 자료

- [Expo 공식 문서](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [NativeWind v4](https://www.nativewind.dev/)
- [Gluestack UI v2](https://gluestack.io/)
- [Victory Native](https://commerce.nearform.com/open-source/victory-native/)
- [FlashList](https://shopify.github.io/flash-list/)
- [Supabase JS](https://supabase.com/docs/reference/javascript/)
- [Clerk Expo](https://clerk.com/docs/quickstarts/expo)
