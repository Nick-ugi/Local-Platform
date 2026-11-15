# Week 17 Security Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 배포 전에 알려진 보안 문제를 없앤다. Web의 Next.js를 보안 패치 버전으로 올리고, App의 Expo SDK 57 패키지를 SDK가 기대하는 패치 버전으로 맞추고, 호환 범위 안에서 고칠 수 있는 나머지 권고를 고친다.

**Architecture:** 코드는 바꾸지 않고 버전만 올린다. 메이저 버전은 그대로(Next.js 16, Expo SDK 57). `npm audit fix`는 `--force` 없이만 쓴다.

**Tech Stack:** 기존 그대로.

**Spec:** `npm audit --omit=dev`(2026-11-15): 17건(critical 1, high 6, moderate 9, low 1). critical은 `next@16.4.0`(이미지 최적화 API의 원격 코드 실행 등, 16.4.6에서 고침). `npx expo install --check`: `expo` 57.0.29 → ~57.0.33 등 8개. 나머지는 Expo CLI 같은 개발 도구의 의존성(`node-forge`, `zod`, `uuid`, `deepmerge` 등).

## Global Constraints

- 메이저 업그레이드 없음. npm이 제안하는 `expo@52`(내림)나 `expo-router@58`(다음 SDK)은 따르지 않는다.
- 공개 API, DB 스키마, 화면은 바꾸지 않는다.
- 커밋 메시지 English, 작업마다 커밋. push는 하지 않는다.

## Review Focus

1. **Next.js 패치가 빌드와 서버 렌더링을 바꾸지 않는다.** standalone 빌드, `/login`의 동적 렌더링, 보안 헤더, 아이콘과 공유 이미지. → Task 1, Task 4
2. **Expo 패치와 지금의 개발 빌드.** 네이티브 코드가 바뀐 패키지가 있으면 개발 빌드를 다시 만든다. → Task 2
3. **`npm audit fix`가 고친 것과 남긴 것.** 남은 권고는 이유와 함께 적는다. → Task 3

---

### Task 1: Next.js 16.4.6

- `next`와 `eslint-config-next`를 16.4.6으로(지금처럼 정확한 버전).
- 확인: Web 테스트, lint, typecheck, `npm run build -w web`(경로 표에서 `/login`은 ƒ), `npm audit`에서 `next`가 사라짐.

### Task 2: Expo SDK 57 패치

- `npx expo install --fix`(mobile).
- 확인: App 테스트, lint, typecheck, 에뮬레이터에서 지도 · 검색 · 상세 · 로그인. 네이티브 쪽이 맞지 않으면 개발 빌드를 다시 만든다.

### Task 3: 나머지 권고

- `npm audit fix`(`--force` 없이). 바뀐 패키지를 확인하고, 남은 권고와 남긴 이유를 적는다.
- 확인: 전체 테스트.

### Task 4: 확인과 문서

- 전체 테스트, lint, typecheck, admin 빌드, 로컬 서버 구성을 다시 빌드해 `test:local` · `test:smoke`, 에뮬레이터.
- README Current Status 17주차, 커밋.
