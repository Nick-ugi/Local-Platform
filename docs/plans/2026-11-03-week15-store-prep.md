# Week 15 Store Prep (Android) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Google Play 내부 테스트에 올릴 수 있게 코드를 갖춘다. 계정 삭제(App 안과 Web 주소, Google Play 정책), 앱 아이콘과 스플래시, 릴리스 빌드 설정(`eas.json`), 필요 없는 Android 권한 막기, 14주차에 미룬 최근 본 장소의 저장 크기. 실제 빌드와 제출, iOS는 하지 않는다(Apple 계정이 아직 없다).

**Architecture:** Backend에 `DELETE /me`(비밀번호 확인)를 더한다. 즐겨찾기와 refresh token은 DB의 `ON DELETE CASCADE`로 함께 지워진다. Web은 쿠키 세션을 가진 서버 경로(`/api/auth/delete-account`)가 Backend를 부르고 쿠키를 지운다. App은 기존 세션 모듈이 부르고 저장된 토큰을 지운다. 아이콘은 SVG 원본을 저장소에 두고 PNG를 만든다. 스플래시는 `expo-splash-screen` 설정 플러그인이라 개발 빌드를 다시 만든다.

**Tech Stack:** 기존 그대로 + `expo-splash-screen`(`npx expo install`), EAS Build 설정 파일.

**Spec:** Google Play 계정 삭제 요구(앱에서 계정을 만들 수 있으면 앱 안과 웹 주소 양쪽에서 삭제를 요청할 수 있어야 한다), [docs/06-api-specification.md](../06-api-specification.md) section 1 · 8, Privacy Policy의 "Deleting your account", 14주차 미룬 일(아이콘이 Expo 기본 그림, `eas.json` 없음, SecureStore 2048바이트).

## Global Constraints

- 비밀번호가 틀리면 401이 아니라 403 `WRONG_PASSWORD`. App과 Web은 401을 "세션 만료"로 보고 로그아웃하기 때문이다.
- Admin 계정은 이 방법으로 지우지 않는다(403 `FORBIDDEN`). 운영자 계정이 사라지면 Admin을 쓸 수 없다.
- 공개 API는 더하기만 한다. 오류 코드는 `ErrorCode.java`와 `shared` `ERROR_CODES`가 같아야 한다(교차 테스트).
- 화면 문구는 English. 커밋 메시지 English, 작업마다 커밋. push · PR · 병합은 끝나고 묻는다.

## Review Focus

1. **비밀번호를 틀린다.** 계정은 그대로, 세션도 그대로(로그아웃되지 않는다), "That password is wrong." → Task 1 ~ 3
2. **지운 뒤 남은 access token(15분).** `GET /me`는 401, 즐겨찾기 저장은 서버 오류가 아니라 401. → Task 1
3. **로그인하지 않고 `/account/delete`에 온다.** 로그인으로 보내고 돌아오게 한다. → Task 2
4. **아이콘의 안전 영역.** Android 적응형 아이콘은 가장자리가 잘린다. 그림은 가운데 61% 원 안. → Task 4
5. **긴 이름 10곳.** 최근 본 장소 JSON이 2048바이트를 넘지 않게 오래된 것부터 뺀다. → Task 6

---

### Task 1: Backend 계정 삭제

- `DELETE /api/v1/me` body `{ "password": "..." }` → 204. 틀림 403 `WRONG_PASSWORD`, admin 403 `FORBIDDEN`, 비밀번호 빈칸 400. 시도 제한은 로그인과 같은 `AuthRateLimiter`(주소 + `delete:` + 계정 id).
- 지운 계정의 access token으로 `GET /me`, 즐겨찾기 → 401 `UNAUTHORIZED`(지금은 즐겨찾기 저장이 FK 오류로 500이 될 수 있다).
- `ErrorCode.WRONG_PASSWORD`, shared `ERROR_CODES`, docs/06.
- 테스트: 맞는 비밀번호 → 204 · 계정 · 즐겨찾기 · refresh token 사라짐 · 같은 이메일로 다시 가입 가능, 틀림 → 403 · 계정 남음, admin → 403, 토큰 없음 → 401, 지운 뒤 남은 토큰 → 401.

### Task 2: Web 계정 삭제

- `POST /api/auth/delete-account` `{ password }`: 쿠키의 access token(없거나 만료면 refresh로 갱신)으로 Backend `DELETE /me`, 204면 쿠키를 지운다. Backend의 답(403 · 429)은 그대로.
- `/account/delete` 페이지: 무엇이 지워지는지, 비밀번호, "Delete my account". 지우면 "Your account has been deleted." 로그인하지 않았으면 `/login?next=/account/delete`. Google Play에 적을 주소.
- More(로그인 상태)에 "Delete account" 링크. Privacy Policy의 "Deleting your account"를 직접 지우는 방법으로 고친다.
- 테스트: 경로(성공 · 틀림 · 세션 없음), 페이지(로그인 전 · 성공 · 틀림 문구).

### Task 3: App 계정 삭제

- `session.deleteAccount(password)`: `DELETE /me`(body), 성공하면 세션을 지운다. 403은 세션을 지우지 않는다. `useAuth().deleteAccount`.
- More(로그인 상태)에 "Delete account" → `/delete-account` 화면(설명, 비밀번호, 빨간 버튼). 성공하면 "Your account has been deleted." 와 More로.
- 테스트: 성공(요청 body와 저장소의 refresh token 삭제), 틀림(세션 그대로, 문구), More의 줄.

### Task 4: 앱 아이콘과 스플래시

- `mobile/assets/brand/*.svg` 원본(호수색 바탕에 흰 지도 핀, 핀 안에 산). PNG: `icon.png` 1024, 적응형 `android-icon-foreground.png`(투명, 가운데 61% 원 안), `android-icon-monochrome.png`, `splash-icon.png`. 적응형 배경은 색(`backgroundColor`)만.
- `npx expo install expo-splash-screen`, 플러그인 `{ image, imageWidth: 200, backgroundColor }`.
- 개발 빌드를 다시 만들어 에뮬레이터에서 런처 아이콘과 스플래시 확인(JAVA_HOME JDK 21).

### Task 5: 릴리스 빌드 설정과 권한

- `mobile/eas.json`: `development`(개발 클라이언트, APK), `preview`(내부 배포 APK, `APP_VARIANT=production`), `production`(AAB, `APP_VARIANT=production`, 버전 코드 자동 증가), `cli.appVersionSource: remote`.
- `app.config.ts`: `android.blockedPermissions`에 저장소 읽기 · 쓰기, `SYSTEM_ALERT_WINDOW`, `VIBRATE`(쓰지 않음). 남는 권한은 위치와 인터넷.
- mobile/README "스토어 준비(Android)": EAS 계정과 `eas init`, EAS 환경 변수(API · 사이트 주소, Mapbox 토큰, 연락 주소), 빌드 명령, Play Console 체크리스트(개인정보 처리방침 주소, 계정 삭제 주소, 데이터 보안 항목). iOS는 Apple 계정이 생긴 뒤.
- 확인: `npx expo config --type introspect`로 권한 목록.

### Task 6: 최근 본 장소 저장 크기

- 저장할 JSON이 2048바이트를 넘으면 오래된 곳부터 뺀다. 테스트: 이름 120자짜리 10곳 → 저장된 값 ≤ 2048바이트, 가장 최근 곳은 남음.

### Task 7: 확인과 문서

- 전체 테스트, lint, typecheck, admin 빌드, 로컬 서버 구성 `test:local` · `test:smoke`, 에뮬레이터(계정 만들기 → 삭제 → 다시 로그인 안 됨).
- README Current Status 15주차, docs/06. 커밋 → push · PR · 병합은 묻는다.
