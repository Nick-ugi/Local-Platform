# Week 16 Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 15주차까지 만든 것을 둘러보다 찾은 빈틈을 메운다. 계속 쌓이는 refresh token 정리, Web의 아이콘 · 매니페스트 · 기본 공유 이미지, App 탭의 아이콘, Android 다크 모드에서도 밝은 화면, 비밀번호를 잊었을 때의 안내.

**Architecture:** Backend는 하루 한 번 쓸 수 없는 refresh token을 지운다(`@Scheduled`). Web은 Next.js의 파일 규칙(`icon.png`, `apple-icon.png`, `manifest.ts`, `opengraph-image.png`)을 쓰고, 그림은 15주차 `mobile/assets/brand`의 SVG에서 만든다. App은 `@expo/vector-icons`(+`expo-font`)로 탭 아이콘을, `expo-system-ui`로 `userInterfaceStyle: "light"`를 적용한다. 둘 다 네이티브 모듈이라 개발 빌드를 다시 만든다.

**Tech Stack:** 기존 그대로 + `@expo/vector-icons`, `expo-font`, `expo-system-ui`(`npx expo install`).

**Spec:** 둘러보며 찾은 것: refresh token은 갱신마다 한 줄씩 늘고 지우는 곳이 없다(`refresh_token`), Web은 기본 `favicon.ico`뿐이다(README의 Mobile Web/PWA), 사진 없는 장소의 공유 미리보기에 그림이 없다(SEO-01), App 탭은 글자만 있다(`tabBarIconStyle: { display: "none" }`), Android 테마가 `DayNight`라 다크 모드에서 시스템 부분이 어두워진다(prebuild 경고 "Install expo-system-ui"), 비밀번호 재설정이 없는데 안내도 없다.

## Global Constraints

- 공개 API와 DB 스키마는 바꾸지 않는다(정리는 기존 열로).
- 화면 문구는 English. 커밋 메시지 English, 작업마다 커밋. push는 하지 않는다.
- 아이콘과 색은 15주차 브랜드(`#0369a1`, 흰 지도 핀).

## Review Focus

1. **정리가 쓸 수 있는 토큰을 지운다.** 만료 전이고 무효가 아닌 토큰은 남는다. → Task 1
2. **방금 무효가 된 토큰.** 하루 동안은 남겨 문제를 볼 수 있게 한다. → Task 1
3. **사진이 있는 장소의 공유 이미지.** 기본 그림이 장소 사진을 덮지 않는다. → Task 2
4. **다크 모드 휴대폰.** 입력칸 글자와 placeholder, 탭, 헤더가 밝은 화면 그대로 읽힌다. → Task 3
5. **연락 주소가 없을 때.** "Forgot your password?" 안내는 숨긴다(Web은 Issues로). → Task 4

---

### Task 1: 쓸 수 없는 refresh token 정리 (Backend)

- `RefreshTokenMapper.deleteUnusable(now, revokedBefore)`: `expires_at < now` 또는 `revoked_at < revokedBefore`인 줄을 지우고 개수를 돌려준다.
- `RefreshTokenCleanup`: 매일 03:30(서버 시간)에 `deleteUnusable(now, now - 1일)`, 지운 개수를 로그. `@EnableScheduling`.
- 테스트: 만료됨 · 이틀 전 무효 · 한 시간 전 무효 · 쓸 수 있음 네 줄 → 앞의 두 줄만 지워진다.

### Task 2: Web 아이콘, 매니페스트, 기본 공유 이미지

- `web/src/app/icon.png`(512), `apple-icon.png`(180, 투명 없음), `favicon.ico`(32 · 16, PNG를 담은 ICO), `opengraph-image.png`(1200×630, 핀과 "Queenstown Local"), `manifest.ts`(name, short_name, start_url `/`, display `standalone`, theme · background color, 아이콘 192 · 512).
- 장소 · 이벤트 사진이 있으면 그 사진이 공유 이미지다(지금처럼). 없으면 기본 이미지.
- 테스트: `manifest()`의 값, 사진 없는 장소의 메타데이터가 이미지를 비워 두어 기본 이미지가 쓰인다, 사진 있는 장소는 그 사진.

### Task 3: App 탭 아이콘과 밝은 화면 고정

- `npx expo install @expo/vector-icons expo-font expo-system-ui`. 탭 아이콘(Ionicons): Map `map-outline`, Explore `list-outline`, Local `calendar-outline`, More `ellipsis-horizontal`(선택되면 채운 모양). 아이콘은 읽어 주지 않는다(라벨이 있다).
- 개발 빌드를 다시 만들고 에뮬레이터를 다크 모드로 바꿔 지도 · 검색 · 로그인 · 계정 삭제 화면 확인.
- 테스트: 탭마다 아이콘 이름(선택 / 아님), 앱 설정 `userInterfaceStyle: "light"`와 `expo-system-ui` 설치.

### Task 4: 비밀번호를 잊었을 때

- 로그인 화면(Web, App) 아래 "Forgot your password? Email us and we'll help." `CONTACT_EMAIL` · `EXPO_PUBLIC_CONTACT_EMAIL`이 있을 때 mailto(제목 "Forgotten password"). Web은 주소가 없으면 GitHub Issues 안내(법적 고지와 같게), App은 숨긴다.
- 테스트: 주소 있을 때 링크, 없을 때.

### Task 5: 확인과 문서

- 전체 테스트, lint, typecheck, admin 빌드, 로컬 서버 구성 `test:local` · `test:smoke`, Web 아이콘과 공유 이미지 확인, 에뮬레이터(다크 모드).
- README Current Status 16주차, backend README의 정리 작업, 커밋.
