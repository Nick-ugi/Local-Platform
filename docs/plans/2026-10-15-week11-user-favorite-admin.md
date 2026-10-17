# Week 11 User / Favorite / Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 방문자가 Web과 App에서 가입하고 로그인해 장소를 Favorite으로 저장하고 모아 본다. 운영자는 별도의 Admin Web에서 Place / Event / Notice를 등록, 수정, 비공개 처리하고, 공개한 항목이 Web과 App의 지도와 목록에 나타난다(S5).

**Architecture:** Backend에 Spring Security를 더한다. Access Token은 HS256 JWT(15분), Refresh Token은 임의 문자열(30일, DB에는 SHA-256 해시만, 재발급마다 교체)이다. 공개 API는 그대로 인증 없이 열려 있다. `/me`는 로그인, `/admin`은 `role=admin`이 필요하다. Admin은 새 workspace `admin`(React + Vite)이다. Web은 Next.js 서버가 토큰을 HttpOnly 쿠키로 보관하고 브라우저의 요청을 대신 보낸다. App은 토큰을 기기의 보안 저장소(expo-secure-store)에 둔다.

**Tech Stack:** Spring Boot 4 (spring-boot-starter-security, oauth2-resource-server의 Nimbus JWT, BCrypt), React 19 + Vite + React Router + mapbox-gl(Admin), Next.js 16 Route Handlers(Web), expo-secure-store(App)

**Spec:** [docs/01-mvp-feature-definition.md](../01-mvp-feature-definition.md) (USER-01 ~ USER-02, FAV-01 ~ FAV-02, ADMIN-01 ~ ADMIN-04, S5), [docs/06-api-specification.md](../06-api-specification.md) 1장 인증, 8장, 9장, [docs/05-erd.md](../05-erd.md) app_user, refresh_token, favorite, slug 규칙, [docs/02-information-architecture.md](../02-information-architecture.md) 2장 Admin, 3장 Admin, [docs/04-wireframe.md](../04-wireframe.md) (m-login, m-favorites, ad-login, ad-places, ad-place-form, ad-notice-form).

## Global Constraints

- 이번 주의 Feature는 모두 Should다. 공개 API와 지금까지의 화면은 바뀌지 않는다.
- 비밀 값은 커밋하지 않는다. JWT 서명 키는 `JWT_SECRET`이고, 개발용 기본값은 로컬에서만 쓴다(서버가 시작할 때 기본값이면 경고를 남긴다).
- 비밀번호는 BCrypt로만 저장한다. Refresh Token 원문은 응답에만 있고 DB에는 SHA-256 해시만 둔다.
- 로그인 실패는 이메일이 없는지 비밀번호가 틀렸는지 구별하지 않는다(`INVALID_CREDENTIALS`).
- Admin 계정은 가입으로 만들지 않는다. 가입한 계정의 `role`을 SQL로 `admin`으로 바꾼다(README에 적는다).
- 삭제 API는 없다. 내릴 항목은 `private`으로 바꾼다. `slug`는 등록할 때 이름이나 제목으로 만들고 바뀌지 않는다.
- 오류는 지금과 같은 Problem Details다. 인증이 없으면 401 `UNAUTHORIZED`, 권한이 없으면 403 `FORBIDDEN`.
- 커밋 메시지는 영어.

## Review Focus

1. **토큰이 새거나 재사용된다.** 재발급한 Refresh Token의 이전 값으로 다시 재발급하면 401이다. 로그아웃한 토큰도 401이다. 브라우저의 JavaScript는 Web의 토큰을 읽지 못한다. → Task 2, Task 8
2. **일반 사용자가 Admin API에 닿는다.** `/admin`은 `role=admin`이 아니면 403이다. 토큰 없이는 401이다. Admin Web은 `role`이 `admin`이 아니면 로그인을 거부한다. → Task 1, Task 6
3. **Admin이 공개 화면을 깨뜨린다.** 잘못된 입력(facility인데 subtype 없음, 끝이 시작보다 앞, 위도만 있음, http(s)가 아닌 URL)은 400과 필드별 오류다. `private`으로 바꾸면 상세는 404, 지도와 목록에서 빠진다. → Task 4, Task 5
4. **slug가 겹친다.** 같은 이름을 두 번 등록하면 `-2`가 붙는다. 수정해도 slug는 그대로다. → Task 4
5. **로그인한 뒤 원래 화면으로 돌아가지 않는다.** Favorite을 누르다 로그인하러 갔으면 돌아와서 저장까지 끝난다(m-login 1번). → Task 9, Task 10

---

## File Structure

```text
backend/src/main/java/com/queenstownlocal/backend
 ├── security      SecurityConfiguration, JwtService(발급, 검증), 401/403 Problem Details
 ├── auth          AuthController(signup, login, refresh, logout), AuthService, UserMapper, RefreshTokenMapper
 ├── me            MeController(/me, /me/favorites), FavoriteMapper
 ├── admin         AdminPlaceController, AdminEventController, AdminNoticeController, 요청 record와 검증, AdminMapper들
 └── common/slug   Slugs(이름 → slug, 겹치면 숫자)

admin                    React + Vite (http://localhost:5173, /api는 Vite가 Backend로 넘긴다)
 ├── src/auth            로그인, 토큰(메모리 + sessionStorage의 Refresh Token), 재발급
 ├── src/places, events, notices  목록과 등록 / 수정 화면
 └── src/map             핀을 끌어 위치를 정하는 지도(mapbox-gl)

web/src
 ├── app/api/auth/*      로그인, 가입, 로그아웃 Route Handler: 토큰을 HttpOnly 쿠키로
 ├── app/api/v1/me/*     쿠키의 토큰으로 /me를 대신 부른다(만료되면 재발급)
 ├── app/login, signup, favorites
 └── components/place/FavoriteButton.tsx

mobile/src
 ├── auth                AuthProvider(expo-secure-store), 로그인, 가입
 ├── app/login.tsx, signup.tsx, favorites.tsx
 └── detail/FavoriteButton.tsx
```

---

### Task 1: Security 기반

- `spring-boot-starter-security`, `spring-boot-starter-oauth2-resource-server`. Stateless, CSRF 끔(쿠키를 쓰지 않는 API다).
- `JwtService`: HS256, `sub`=user id, `email`, `role`, 15분. `JWT_SECRET`(32바이트 이상).
- 규칙: 공개 GET과 `/auth/**`는 열림, `/me/**`는 로그인, `/admin/**`는 `ROLE_ADMIN`. 401과 403은 Problem Details(`UNAUTHORIZED`, `FORBIDDEN`).
- 테스트: 공개 API는 토큰 없이 200. `/me`는 토큰 없이 401, 만료되거나 서명이 틀린 토큰도 401. 일반 사용자의 `/admin`은 403.

### Task 2: 가입, 로그인, 재발급, 로그아웃 (USER-01, USER-02)

| 테스트 | 기대 |
|---|---|
| 가입 | 201, 토큰 응답, `role=user`, 비밀번호는 BCrypt |
| 같은 이메일(대소문자만 다름) | 409 `EMAIL_ALREADY_USED` |
| 짧은 비밀번호, 이메일 형식 아님 | 400과 필드 오류 |
| 로그인 | 200. 틀린 비밀번호와 없는 이메일은 같은 401 |
| 재발급 | 새 토큰 둘. 이전 Refresh Token은 다시 쓰면 401 |
| 만료된 Refresh Token | 401 |
| 로그아웃 | 204, 그 토큰으로 재발급하면 401. 이미 무효여도 204 |

### Task 3: /me와 Favorite (FAV-01, FAV-02)

- `GET /me`, `GET /me/favorites`(최근 저장 순, private 제외, `distanceM`은 null), `PUT`/`DELETE /me/favorites/{slug}`(둘 다 멱등, 없는 Place의 PUT은 404).

### Task 4: Admin Place API (ADMIN-02)

- 목록(`q`, `status`, `category`, page, `updatedAt` 내림차순), 등록(201, slug 생성), 조회, 수정(전체 필드, slug 유지, `updated_at` 갱신).
- 검증은 API 명세 9장의 표 그대로. 오류는 필드별로 모아 400 하나로 돌려준다.
- `Slugs`: 소문자, 영숫자 외는 하이픈, 앞뒤 하이픈 제거, 길이 제한. 겹치면 `-2`, `-3`. 이름에 영숫자가 없으면 종류 이름(`place`).

### Task 5: Admin Event, Notice API (ADMIN-03, ADMIN-04)

- Place와 같은 구조. Event: `endsAt`은 `startsAt` 이후. Notice: 위도와 경도는 함께, `type` 필터.
- 테스트: 등록한 공개 Event가 `/events`와 `/map/markers`에 나오고, private으로 바꾸면 사라진다(S5).

### Task 6: Admin Web — 바탕과 로그인 (ADMIN-01)

- `admin` workspace: Vite + React + TypeScript, React Router, Vitest + Testing Library, ESLint. 개발 서버는 5173, `/api`는 Vite의 proxy가 `http://localhost:8080`으로.
- 로그인: `/auth/login` 후 `role`이 `admin`이 아니면 거부하고 로그아웃한다. Access Token은 메모리, Refresh Token은 `sessionStorage`(창을 닫으면 끝난다). 401이면 한 번 재발급해 다시 보낸다.
- 왼쪽 메뉴(Places, Events, Notices, Log out), 로그인하지 않았으면 `/login`으로.

### Task 7: Admin Web — 목록과 등록 / 수정 (ADMIN-02 ~ ADMIN-04)

- 목록(ad-places): 검색, 분류 필터, 상태 필터, 표(이름, 분류, 상태, 수정일), New 버튼, 행을 누르면 수정.
- 폼(ad-place-form, ad-notice-form): 필수 표시, 서버의 필드 오류를 그 칸 아래에. Subtype은 Facilities일 때만. 위치는 지도의 핀을 끌거나 지도를 눌러 정하고, 위도와 경도 칸이 따라간다(칸을 고치면 핀이 간다). Notice는 위치가 선택이다. 상태는 Public / Private.
- 날짜와 시각은 뉴질랜드 시간으로 입력하고 보낸다.

### Task 8: Web — 로그인과 쿠키 (USER-01, USER-02)

- Route Handler `POST /api/auth/login`, `/signup`, `/logout`: Backend를 부르고 토큰을 `HttpOnly; SameSite=Lax; Path=/` 쿠키로(배포에서는 `Secure`). 응답 본문에는 `user`만.
- `/api/v1/me/**`: 쿠키의 Access Token으로 Backend를 부르고, 401이면 Refresh Token으로 한 번 재발급해 쿠키를 바꾸고 다시 보낸다.
- 화면: `/login`, `/signup`(m-login), More에 로그인 상태(이메일, Favorites, Log out / Log in). 로그인하면 `?next=`로 돌아간다(같은 사이트의 경로만).

### Task 9: Web — Favorite (FAV-01, FAV-02)

- Place 상세에 저장 버튼(하트). 로그인하지 않았으면 `/login?next=/places/{slug}?favorite=1`로, 돌아오면 저장을 끝낸다.
- `/favorites`(m-favorites): Explore와 같은 카드, 하트로 해제, 없으면 Explore로 가는 링크. 검색 엔진에는 내지 않는다.

### Task 10: App — 로그인과 Favorite

- `expo-secure-store`(네이티브 모듈이라 개발 빌드를 다시 만든다). `AuthProvider`: 시작할 때 저장된 Refresh Token으로 재발급, 401이면 한 번 재발급해 다시 보낸다.
- More에 Log in / 이메일, Favorites, Log out. `login`, `signup`, `favorites` Stack 화면. Place 상세의 하트(로그인하지 않았으면 로그인 후 돌아와 저장).

### Task 11: 확인과 문서

| 확인 | 기대 |
|---|---|
| Admin에서 Place를 Public으로 등록 | Web과 App의 지도, Explore, 상세에 나온다 |
| 그 Place를 Private으로 | 지도와 목록에서 빠지고 상세는 404 |
| Event, Notice 등록과 수정 | 일시가 뉴질랜드 시간 그대로 Web과 App에 |
| 일반 계정으로 Admin 로그인 | 거부 |
| Web: 하트 → 로그인 → 돌아와 저장 → Favorites → 해제 | 동작 |
| App: 같은 흐름, 앱을 껐다 켜도 로그인 유지, Log out | 동작 |

README(Admin 계정 만들기, `JWT_SECRET`, Admin 실행), backend/README, admin/README, mobile/README, 루트 README의 Current Status에 11주차.

---

## 범위 밖

| 항목 | 시점 |
|---|---|
| 비밀번호 찾기, 이메일 인증, 소셜 로그인 | MVP 이후 |
| Admin의 사용자 관리, 이미지 업로드 | MVP 이후 (이미지는 URL) |
| 배포 환경의 쿠키 도메인, CORS, https | 12주차 배포 |
