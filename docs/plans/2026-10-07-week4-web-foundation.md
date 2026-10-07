# Week 4 Web Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Web이 로컬에서 실행되어 상단 메뉴로 화면을 오가고, Place 상세 화면이 Backend API에서 받은 데이터를 서버에서 렌더링한다.

**Architecture:** 루트에 npm workspaces를 두고 `shared`와 `web`을 묶는다. `shared`는 코드 값과 API 타입을 TypeScript 소스 그대로 제공한다. `web`은 Next.js App Router이고, 서버 컴포넌트가 API를 호출한다. 비동기 페이지는 얇게 두고, 테스트할 수 있는 동기 컴포넌트와 함수에 내용을 둔다.

**Tech Stack:** Next.js 16.4, React 19.3, TypeScript 5, Tailwind CSS 4, next-intl 4, Vitest 5, Testing Library, npm workspaces (Node 24)

**Spec:** [docs/01-mvp-feature-definition.md](../01-mvp-feature-definition.md) (NAV-01, COMMON-02, COMMON-04), [docs/02-information-architecture.md](../02-information-architecture.md), [docs/03-user-flow.md](../03-user-flow.md) (상태 안내), [docs/04-wireframe.md](../04-wireframe.md) (d-map의 상단 메뉴, d-place), [docs/06-api-specification.md](../06-api-specification.md). 캘린더 4주차의 완료 기준은 "Desktop Web 기본 화면과 API 연동 완료"다.

## Global Constraints

- 패키지 이름은 `@queenstown/shared`, `@queenstown/web`이다. 루트 `package.json`의 `workspaces`는 `["shared", "web"]`이다.
- Web은 3001번 포트를 쓴다. 이 PC의 3000번은 다른 컨테이너가 쓰고 있다.
- API 주소는 환경 변수 `API_BASE_URL`에서 읽고 기본값은 `http://localhost:8080`이다. 이번 주는 서버에서만 API를 호출한다. 브라우저가 API를 직접 부르지 않으므로 CORS는 추가하지 않는다.
- 화면의 문구는 모두 `web/messages/en.json`에 둔다. 컴포넌트에 문구를 직접 쓰지 않는다. `<html lang="en">`이다.
- URL과 메뉴의 활성 범위는 `docs/02-information-architecture.md` 3장과 4장을 따른다. 메뉴 문구는 Map / Explore / Local / More다.
- 코드 값은 `docs/05-erd.md` 4장과 같아야 한다. Category의 화면 문구는 Food, Cafes, Bars, Activities, Shopping, Facilities다.
- 날짜는 `Pacific/Auckland` 기준으로 `2 Oct 2026` 형태로 표시한다.
- 이번 주는 데스크톱 배치(1200px)만 만든다. 모바일 하단 탭은 5주차다.
- Google Fonts를 쓰지 않는다. 생성된 `layout.tsx`의 `next/font/google` 사용을 지우고 시스템 글꼴을 쓴다. 디자인은 아직 정하지 않았고, 빌드가 외부 네트워크에 의존하지 않게 한다.
- 테스트는 Vitest의 `run` 모드로 돌린다. 루트의 `npm test`가 모든 workspace의 테스트를 실행한다.
- 커밋 메시지는 영어로 쓰고 마지막 줄에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`를 붙인다.

## Review Focus

1. **Backend가 꺼져 있거나 응답하지 않는다.** 화면이 깨지거나 스택이 보이지 않고 "다시 시도"가 있는 오류 안내가 나와야 한다. → Task 3
2. **API가 JSON이 아닌 오류를 응답한다.** Tomcat이 직접 거부한 요청은 HTML로 온다(3주차에 미뤄 둔 문제). JSON 파싱 오류가 아니라 상태 코드를 가진 오류로 다뤄야 한다. → Task 3
3. **`slug`에 공백, 한글, 슬래시가 들어 있다.** 경로에 넣을 때 인코딩해야 하고, 있을 수 없는 `slug`는 오류가 아니라 404 화면이어야 한다. → Task 3
4. **선택 항목이 모두 `null`인 Place다.** 설명, 영업시간, 전화번호, 웹사이트가 없으면 빈 제목이나 "null"을 보여주지 않고 그 줄을 숨겨야 한다. → Task 4
5. **서버의 시간대가 뉴질랜드가 아니다.** 개발 PC는 한국 시간이다. `2026-10-01T12:30:00Z`는 뉴질랜드에서 10월 2일이므로 `2 Oct 2026`으로 보여야 한다. → Task 4

---

## File Structure

```text
package.json                         workspaces, 전체 test / lint 스크립트
shared/
 ├── package.json, tsconfig.json
 └── src
      ├── index.ts                   공개 API
      ├── codes.ts                   Category, 하위 유형, Notice 유형, 상태, 오류 코드
      ├── codes.test.ts              Backend의 Migration, ErrorCode와 값이 같은지 확인
      ├── geo.ts                     Queenstown 중심, 서비스 반경
      └── api.ts                     PlaceDetail, ProblemDetail 타입
web/
 ├── package.json, next.config.ts, vitest.config.mts, vitest.setup.ts
 ├── .env.example, README.md
 ├── messages/en.json                화면 문구
 └── src
      ├── i18n/request.ts            next-intl 설정 (언어 하나)
      ├── app
      │    ├── layout.tsx            html, 문구 Provider, 상단 메뉴
      │    ├── page.tsx              Map (자리만)
      │    ├── explore/page.tsx      Explore (자리만)
      │    ├── notices/page.tsx      Local (자리만)
      │    ├── more/page.tsx         More (자리만)
      │    ├── places/[slug]/page.tsx  Place 상세
      │    ├── loading.tsx, error.tsx, not-found.tsx
      ├── components
      │    ├── nav/menu.ts           메뉴 정의와 activeMenu
      │    ├── nav/TopNav.tsx        상단 메뉴
      │    ├── state/StateMessage.tsx  로딩, 오류, 없음 안내
      │    └── place/PlaceDetailView.tsx
      ├── lib
      │    ├── api/client.ts         apiGet, ApiError
      │    ├── api/places.ts         getPlace
      │    └── format.ts             formatDate
      └── test/render.tsx            문구 Provider로 감싸 렌더링하는 도우미
```

테스트 파일은 대상 파일 옆에 `*.test.ts(x)`로 둔다.

---

### Task 1: Workspaces와 `shared` 패키지

**Files:**
- Create: `package.json` (루트)
- Create: `shared/package.json`, `shared/tsconfig.json`
- Create: `shared/src/index.ts`, `shared/src/codes.ts`, `shared/src/geo.ts`, `shared/src/api.ts`
- Test: `shared/src/codes.test.ts`

**Interfaces:**
- Produces (모두 `@queenstown/shared`에서 export):
  - `CATEGORIES = ['food', 'cafe', 'bar', 'activity', 'shopping', 'facility'] as const`, `type Category`
  - `FACILITY_SUBTYPES = ['toilet', 'parking', 'information', 'library', 'medical', 'other'] as const`, `type FacilitySubtype`
  - `NOTICE_TYPES = ['road-work', 'road-closure', 'public-notice', 'emergency'] as const`, `type NoticeType`
  - `STATUSES = ['public', 'private'] as const`, `type Status`
  - `ERROR_CODES = ['VALIDATION_FAILED', 'INVALID_CREDENTIALS', 'INVALID_REFRESH_TOKEN', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'METHOD_NOT_ALLOWED', 'EMAIL_ALREADY_USED', 'INTERNAL_ERROR'] as const`, `type ErrorCode`
  - `SERVICE_CENTER = { latitude: -45.0312, longitude: 168.6626 } as const`, `SERVICE_RADIUS_KM = 50`
  - `interface PlaceDetail` — `slug`, `name`, `address`, `source`, `sourceUrl`, `updatedAt`는 `string`. `category`는 `Category`, `subtype`은 `FacilitySubtype | null`. `imageUrl`, `description`, `openingHours`, `phone`, `website`는 `string | null`. `latitude`, `longitude`는 `number`.
  - `interface FieldError { field: string; message: string }`
  - `interface ProblemDetail { title: string; status: number; detail: string; instance?: string; code: ErrorCode; errors?: FieldError[] }`

- [ ] **Step 1: 브랜치를 만들고 계획 문서를 커밋한다**

```bash
git checkout -b feat/web-foundation
git add docs/plans/2026-10-07-week4-web-foundation.md
git commit -m "Add week 4 web foundation plan"
```

- [ ] **Step 2: 루트와 `shared`의 `package.json`을 만든다**

루트 `package.json`

```json
{
  "name": "queenstown-local-platform",
  "private": true,
  "workspaces": ["shared", "web"],
  "scripts": {
    "test": "npm run test --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present"
  }
}
```

`shared/package.json`. 빌드 없이 TypeScript 소스를 그대로 내보낸다.

```json
{
  "name": "@queenstown/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  }
}
```

`typescript`와 `vitest`를 `shared`의 devDependency로 설치한다. `shared/tsconfig.json`은 `strict`, `module`과 `moduleResolution`은 `bundler` 계열, `noEmit`으로 둔다.

- [ ] **Step 3: 실패하는 테스트를 쓴다**

`shared/src/codes.test.ts`. 코드 값은 TypeScript, SQL, Java 세 곳에 있다. 한쪽만 바뀌는 것을 막는다.

```ts
// backend/src/main/resources/db/migration/V1__init_schema.sql 을 읽는다.
// "CONSTRAINT <name> CHECK (" 뒤의 첫 IN (...) 목록에서 따옴표 안의 값을 꺼낸다.
//   ck_place_category  -> CATEGORIES 와 같다
//   ck_place_subtype   -> FACILITY_SUBTYPES 와 같다
//   ck_notice_type     -> NOTICE_TYPES 와 같다
//   ck_place_status    -> STATUSES 와 같다
// backend/src/main/java/com/queenstownlocal/backend/common/error/ErrorCode.java 의
// enum 상수 이름(대문자와 밑줄, 뒤에 "(")이 ERROR_CODES 와 순서까지 같다.

test('categories match the place category constraint', ...)
test('facility subtypes match the place subtype constraint', ...)
test('notice types match the notice type constraint', ...)
test('statuses match the status constraint', ...)
test('error codes match the backend enum', ...)
test('service centre is the Queenstown centre from the API specification', () => {
  expect(SERVICE_CENTER).toEqual({ latitude: -45.0312, longitude: 168.6626 })
  expect(SERVICE_RADIUS_KM).toBe(50)
})
```

- [ ] **Step 4: 테스트가 실패하는지 확인한다**

Run: `npm test -w shared`
Expected: FAIL. `./codes`를 찾을 수 없다.

- [ ] **Step 5: `codes.ts`, `geo.ts`, `api.ts`, `index.ts`를 만든다**

- [ ] **Step 6: 테스트와 타입 검사가 통과하는지 확인한다**

Run: `npm test -w shared && npm run typecheck -w shared`
Expected: 테스트 6개 통과, 타입 오류 없음

- [ ] **Step 7: 커밋한다**

```bash
git add package.json package-lock.json shared
git commit -m "Add npm workspaces and the shared package"
```

---

### Task 2: Web 프로젝트와 상단 메뉴

**Files:**
- Create: `web/` (create-next-app 생성물)
- Modify: `web/package.json`, `web/next.config.ts`, `web/.gitignore`, `web/src/app/layout.tsx`, `web/src/app/page.tsx`, `web/src/app/globals.css`
- Create: `web/vitest.config.mts`, `web/vitest.setup.ts`, `web/.env.example`
- Create: `web/messages/en.json`, `web/src/i18n/request.ts`, `web/src/test/render.tsx`
- Create: `web/src/components/nav/menu.ts`, `web/src/components/nav/TopNav.tsx`
- Create: `web/src/app/explore/page.tsx`, `web/src/app/notices/page.tsx`, `web/src/app/more/page.tsx`
- Test: `web/src/components/nav/menu.test.ts`, `web/src/components/nav/TopNav.test.tsx`

**Interfaces:**
- Consumes: `@queenstown/shared` (Task 1)
- Produces: `type MenuKey = 'map' | 'explore' | 'local' | 'more'`
- Produces: `MENU: readonly { key: MenuKey; href: string }[]` — `map` → `/`, `explore` → `/explore`, `local` → `/notices`, `more` → `/more`
- Produces: `activeMenu(pathname: string): MenuKey | null`
- Produces: `TopNav` (Client Component, props 없음) — `usePathname()`으로 현재 경로를 읽는다.
- Produces: `renderWithMessages(ui: ReactElement)` — `messages/en.json`과 `locale="en"`의 `NextIntlClientProvider`로 감싸 렌더링한다.
- Produces: `messages/en.json`의 `Nav`(`brand`, `label`, `map`, `explore`, `local`, `more`), `Category`(코드 6개), `Pages`(`map`, `explore`, `local`, `more`)

- [ ] **Step 1: 프로젝트를 만든다**

저장소 루트에서 실행한다.

```bash
npx --yes create-next-app@16.4.0 web --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --skip-install --disable-git --no-react-compiler --no-cache-components --no-agents-md --no-agent-feedback --yes
```

이어서 아래를 맞춘다.

- `web/package.json`: `name`을 `@queenstown/web`으로, `dev`를 `next dev -p 3001`, `start`를 `next start -p 3001`, `test`를 `vitest run`으로 한다. `dependencies`에 `"@queenstown/shared": "*"`와 `next-intl`을 더한다.
- devDependency: `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`, `@testing-library/user-event`, `vite-tsconfig-paths`
- `web/next.config.ts`: 생성된 `turbopack` 설정을 유지하고 `transpilePackages: ['@queenstown/shared']`를 더한 뒤 `next-intl/plugin`의 `createNextIntlPlugin()`으로 감싼다.
- `web/.gitignore`: `.env*` 아래에 `!.env.example`을 더한다.
- `web/.env.example`: `API_BASE_URL=http://localhost:8080`
- `web/vitest.config.mts`: `vite-tsconfig-paths`와 `@vitejs/plugin-react` 플러그인, `environment: 'jsdom'`, `setupFiles: ['./vitest.setup.ts']`
- `web/vitest.setup.ts`: `@testing-library/jest-dom/vitest`를 import 한다.
- `web/src/i18n/request.ts`: `getRequestConfig`로 `locale: 'en'`과 `messages/en.json`을 돌려준다.

루트에서 `npm install`을 실행한다.

- [ ] **Step 2: 문구 파일을 만든다**

`web/messages/en.json`

```json
{
  "Nav": {
    "brand": "Queenstown Local",
    "label": "Main",
    "map": "Map",
    "explore": "Explore",
    "local": "Local",
    "more": "More"
  },
  "Category": {
    "food": "Food",
    "cafe": "Cafes",
    "bar": "Bars",
    "activity": "Activities",
    "shopping": "Shopping",
    "facility": "Facilities"
  },
  "Pages": {
    "map": "Map",
    "explore": "Explore",
    "local": "Local",
    "more": "More"
  }
}
```

- [ ] **Step 3: 실패하는 테스트를 쓴다**

`menu.test.ts`. `docs/02-information-architecture.md` 4장의 표다.

```ts
test.each([
  ['/', 'map'],
  ['/explore', 'explore'],
  ['/explore/food', 'explore'],
  ['/search', 'explore'],
  ['/places/lakeside-kitchen', 'explore'],
  ['/notices', 'local'],
  ['/notices/shotover-street-road-works', 'local'],
  ['/events', 'local'],
  ['/events/lakefront-night-market', 'local'],
  ['/more', 'more'],
  ['/about', 'more'],
  ['/privacy', 'more'],
  ['/terms', 'more'],
  ['/login', 'more'],
  ['/signup', 'more'],
  ['/favorites', 'more'],
])('%s activates %s', (pathname, key) => {
  expect(activeMenu(pathname)).toBe(key)
})

test.each(['/nope', '/explorer', '/placesx/a', '/eventsful', '/moreover'])(
  '%s activates nothing', (pathname) => {
    expect(activeMenu(pathname)).toBeNull()
  })

test('a trailing slash does not change the result', () => {
  expect(activeMenu('/explore/')).toBe('explore')
  expect(activeMenu('/notices/a/')).toBe('local')
})

test('the Local menu links to the notices list', () => {
  expect(MENU.find((m) => m.key === 'local')?.href).toBe('/notices')
})
```

`TopNav.test.tsx`. `next/navigation`의 `usePathname`을 `vi.mock`으로 바꿔 경로를 준다.

```tsx
test('shows the brand and the four menus in order with their links', () => {
  // usePathname -> '/'
  // navigation 랜드마크의 이름은 "Main"
  // 링크의 이름과 href: Map "/", Explore "/explore", Local "/notices", More "/more" (이 순서)
  // "Queenstown Local"이 보인다
})

test('marks only the active menu as the current page', () => {
  // usePathname -> '/places/lakeside-kitchen'
  // Explore 링크만 aria-current="page", 나머지 셋에는 aria-current 속성이 없다
})

test('marks nothing on a path outside every menu', () => {
  // usePathname -> '/nope' → aria-current 를 가진 링크가 없다
})
```

- [ ] **Step 4: 테스트가 실패하는지 확인한다**

Run: `npm test -w web`
Expected: FAIL. `./menu`와 `./TopNav`를 찾을 수 없다.

- [ ] **Step 5: `menu.ts`, `TopNav.tsx`, `test/render.tsx`를 만들고 화면에 붙인다**

- `layout.tsx`: `next/font/google` 사용을 지운다. `<html lang="en">`, `NextIntlClientProvider`, 그 안에 `TopNav`와 `<main>`을 둔다. `metadata`의 `title`은 `{ default: 'Queenstown Local', template: '%s | Queenstown Local' }`이다.
- `globals.css`: 생성된 다크 모드 블록과 글꼴 변수를 지우고 시스템 글꼴을 쓴다.
- `page.tsx`, `explore/page.tsx`, `notices/page.tsx`, `more/page.tsx`: `Pages`의 제목을 `<h1>`으로 보여주는 자리만 둔다. 생성된 예시 내용은 지운다.
- `TopNav`의 배치는 Wireframe `d-map`의 상단 메뉴를 따른다. 왼쪽에 브랜드, 이어서 메뉴 네 개다. 검색창은 7주차에 넣는다.

- [ ] **Step 6: 테스트, Lint, 빌드가 통과하는지 확인한다**

Run: `npm test -w web && npm run lint -w web && npm run build -w web`
Expected: 테스트 통과, Lint 오류 없음, 빌드 성공. 빌드 결과의 경로 목록에 `/`, `/explore`, `/notices`, `/more`가 있다.

- [ ] **Step 7: 브라우저에서 확인한다**

`npm run dev -w web`으로 서버를 띄우고 `http://localhost:3001`을 연다. 메뉴 네 개를 차례로 눌러 화면이 바뀌고 누른 메뉴만 활성으로 보이는지 확인한다.

- [ ] **Step 8: 커밋한다**

```bash
git add package.json package-lock.json web
git commit -m "Scaffold the Next.js web app with the top navigation"
```

---

### Task 3: API 클라이언트와 상태 안내 화면

**Files:**
- Create: `web/src/lib/api/client.ts`, `web/src/lib/api/places.ts`
- Create: `web/src/components/state/StateMessage.tsx`
- Create: `web/src/app/loading.tsx`, `web/src/app/error.tsx`, `web/src/app/not-found.tsx`
- Modify: `web/messages/en.json` (`State` 추가)
- Test: `web/src/lib/api/client.test.ts`, `web/src/lib/api/places.test.ts`, `web/src/components/state/StateMessage.test.tsx`

**Interfaces:**
- Consumes: `PlaceDetail`, `ErrorCode`, `FieldError` (Task 1), `renderWithMessages` (Task 2)
- Produces: `class ApiError extends Error` — `status: number`, `code: ErrorCode | 'NETWORK_ERROR' | 'UNKNOWN_ERROR'`, `detail: string`, `errors: FieldError[]`
- Produces: `apiGet<T>(path: string): Promise<T>` — `${API_BASE_URL}/api/v1${path}`를 `cache: 'no-store'`로 호출한다. `API_BASE_URL`이 없으면 `http://localhost:8080`이다.
- Produces: `getPlace(slug: string): Promise<PlaceDetail | null>`
- Produces: `StateMessage` — props `{ title: string; body?: string; children?: ReactNode }`. 제목은 `<h1>`, 본문은 문단, `children`은 그 아래 행동 영역에 둔다.
- Produces: `messages/en.json`의 `State`

- [ ] **Step 1: `State` 문구를 더한다**

```json
"State": {
  "loading": "Loading…",
  "errorTitle": "Something went wrong",
  "errorBody": "We couldn't load this page. Please try again.",
  "retry": "Try again",
  "notFoundTitle": "Page not found",
  "notFoundBody": "This page doesn't exist or is no longer available.",
  "goToMap": "Go to Map",
  "goToExplore": "Go to Explore"
}
```

- [ ] **Step 2: 실패하는 테스트를 쓴다**

`client.test.ts`. `fetch`는 `vi.stubGlobal`로 바꾼다.

| 테스트 | 조건 | 기대 |
|---|---|---|
| `requests the versioned path on the configured base URL` | `API_BASE_URL=http://api.test`, `apiGet('/places/x')` | `fetch`가 `http://api.test/api/v1/places/x`로 호출된다. 옵션에 `cache: 'no-store'`가 있다. |
| `falls back to localhost when no base URL is set` | `API_BASE_URL` 없음 | `http://localhost:8080/api/v1/places/x` |
| `returns the parsed body on success` | 200, `{"slug":"x"}` | `{ slug: 'x' }` |
| `turns a problem detail into an ApiError` | 404, `application/problem+json`, `{"title":"Not Found","status":404,"detail":"Place not found.","code":"NOT_FOUND"}` | `ApiError`. `status` 404, `code` `'NOT_FOUND'`, `detail` `'Place not found.'`, `errors` `[]` |
| `keeps field errors` | 400, `code` `VALIDATION_FAILED`, `errors: [{"field":"size","message":"is required"}]` | `errors`가 그 배열과 같다. |
| `handles an error body that is not JSON` | 400, `text/html`, `<!doctype html>...` | `ApiError`. `status` 400, `code` `'UNKNOWN_ERROR'`. `SyntaxError`가 아니다. |
| `handles a JSON error without a code` | 500, `{"timestamp":"...","status":999}` | `ApiError`. `status` 500, `code` `'UNKNOWN_ERROR'` |
| `turns a network failure into an ApiError` | `fetch`가 `TypeError('fetch failed')`로 거부 | `ApiError`. `status` 0, `code` `'NETWORK_ERROR'` |

`places.test.ts`. `./client`의 `apiGet`을 `vi.mock`으로 바꾼다.

| 테스트 | 조건 | 기대 |
|---|---|---|
| `returns the place` | `apiGet`이 Place를 돌려준다 | 그 Place. `apiGet`이 `/places/lakeside-kitchen`으로 호출된다. |
| `encodes the slug as one path segment` | `getPlace('a/b c 한글')` | `apiGet`이 `/places/a%2Fb%20c%20%ED%95%9C%EA%B8%80`으로 호출된다. |
| `returns null when the place is not found` | `apiGet`이 `ApiError` 404로 거부 | `null` |
| `returns null when the server rejects the slug` | `apiGet`이 `ApiError` 400으로 거부 | `null` |
| `passes other errors on` | `ApiError` 500, `ApiError` `NETWORK_ERROR` | 같은 오류로 거부한다. |

`StateMessage.test.tsx`

```tsx
test('shows the title as the page heading, the body, and the actions', () => {
  // <StateMessage title="Page not found" body="Gone."><a href="/">Go to Map</a></StateMessage>
  // level 1 heading "Page not found", 문단 "Gone.", 링크 "Go to Map"
})

test('renders without a body or actions', () => {
  // <StateMessage title="Loading…" /> → heading 만 있고 문단과 링크가 없다
})
```

- [ ] **Step 3: 테스트가 실패하는지 확인한다**

Run: `npm test -w web`
Expected: FAIL. `./client`, `./places`, `./StateMessage`를 찾을 수 없다.

- [ ] **Step 4: `client.ts`, `places.ts`, `StateMessage.tsx`를 만든다**

- [ ] **Step 5: `loading.tsx`, `error.tsx`, `not-found.tsx`를 만든다**

모두 `StateMessage`와 `State` 문구를 쓴다.

| 파일 | 내용 |
|---|---|
| `loading.tsx` | 제목 `loading` |
| `error.tsx` | Client Component. 제목 `errorTitle`, 본문 `errorBody`, `retry` 버튼은 `reset()`을 부른다. 오류의 메시지나 스택은 화면에 보여주지 않는다. |
| `not-found.tsx` | 제목 `notFoundTitle`, 본문 `notFoundBody`, 링크 `goToMap`(`/`)과 `goToExplore`(`/explore`). `docs/03-user-flow.md`의 "상태 안내"를 따른다. |

- [ ] **Step 6: 테스트, Lint, 빌드가 통과하는지 확인한다**

Run: `npm test -w web && npm run lint -w web && npm run build -w web`
Expected: 모두 통과

- [ ] **Step 7: 커밋한다**

```bash
git add web
git commit -m "Add the API client and the loading, error and not-found screens"
```

---

### Task 4: Place 상세 화면과 연동 확인

**Files:**
- Create: `web/src/lib/format.ts`
- Create: `web/src/components/place/PlaceDetailView.tsx`
- Create: `web/src/app/places/[slug]/page.tsx`
- Create: `web/README.md`
- Modify: `web/messages/en.json` (`Place` 추가), `README.md` (Current Status, Technology Stack)
- Test: `web/src/lib/format.test.ts`, `web/src/components/place/PlaceDetailView.test.tsx`

**Interfaces:**
- Consumes: `PlaceDetail` (Task 1), `renderWithMessages` (Task 2), `getPlace` (Task 3)
- Produces: `formatDate(iso: string): string`
- Produces: `PlaceDetailView` — props `{ place: PlaceDetail }`, 동기 컴포넌트
- Produces: `/places/[slug]` 화면. 없는 Place는 `notFound()`를 부른다.
- Produces: `messages/en.json`의 `Place`

- [ ] **Step 1: `Place` 문구를 더한다**

```json
"Place": {
  "breadcrumb": "Breadcrumb",
  "address": "Address",
  "openingHours": "Opening hours",
  "contact": "Contact",
  "source": "Source: <link>{source}</link>",
  "updated": "Updated {date}"
}
```

`source`는 next-intl의 `t.rich`로 렌더링해 `<link>` 자리에 출처 URL로 가는 링크를 넣는다.

- [ ] **Step 2: 실패하는 테스트를 쓴다**

`format.test.ts`

```ts
test('formats a date in New Zealand time', () => {
  expect(formatDate('2026-10-02T01:30:00Z')).toBe('2 Oct 2026')
})

test('uses the New Zealand day, not the UTC day', () => {
  // 12:30 UTC 는 뉴질랜드(UTC+13)에서 다음 날 01:30 이다
  expect(formatDate('2026-10-01T12:30:00Z')).toBe('2 Oct 2026')
})
```

`PlaceDetailView.test.tsx`. 화면의 순서는 `docs/04-wireframe.md`의 `d-place`와 `docs/02-information-architecture.md` 6장을 따른다. 이미지, 빠른 행동, "View on map", Favorite은 7주차 이후에 넣는다.

```tsx
const full: PlaceDetail = {
  slug: 'lakeside-kitchen', name: 'Lakeside Kitchen', category: 'food', subtype: null,
  address: '12 Beach Street, Queenstown', imageUrl: null, latitude: -45.0322, longitude: 168.661,
  description: 'Lakefront restaurant.', openingHours: 'Mon - Sun · 8:00 am - 10:00 pm',
  phone: '03 000 0000', website: 'https://lakesidekitchen.example',
  source: 'Business website', sourceUrl: 'https://lakesidekitchen.example',
  updatedAt: '2026-10-02T01:30:00Z',
}

test('shows every part of a complete place', () => {
  // level 1 heading "Lakeside Kitchen"
  // "Breadcrumb" navigation 안에 링크 Explore "/explore", Food "/explore/food"
  // 문단 "Lakefront restaurant."
  // 제목 "Address" 아래 "12 Beach Street, Queenstown"
  // 제목 "Opening hours" 아래 "Mon - Sun · 8:00 am - 10:00 pm"
  // 제목 "Contact" 아래 링크 "03 000 0000" href "tel:030000000",
  //   링크 "lakesidekitchen.example" href "https://lakesidekitchen.example"
  // "Source: Business website", 그 안의 링크 href "https://lakesidekitchen.example"
  // "Updated 2 Oct 2026"
})

test('uses the category label, not the code', () => {
  // category 'facility' → 경로 표시의 링크 이름 "Facilities", href "/explore/facility"
})

test('hides the rows a place does not have', () => {
  // description, openingHours, phone, website 가 모두 null
  // 제목 "Opening hours", "Contact" 가 없다. 화면에 "null" 이라는 글자가 없다.
  // "Address", "Source: ...", "Updated ..." 는 그대로 있다.
})

test('shows the contact heading when only one contact exists', () => {
  // phone 만 있음 → "Contact" 제목과 전화 링크가 있고 웹사이트 링크는 없다
})

test('opens external links safely', () => {
  // 웹사이트와 출처 링크는 rel 에 "noopener" 가 있다
})
```

- [ ] **Step 3: 테스트가 실패하는지 확인한다**

Run: `npm test -w web`
Expected: FAIL. `./format`과 `./PlaceDetailView`를 찾을 수 없다.

- [ ] **Step 4: `format.ts`와 `PlaceDetailView.tsx`를 만든다**

`formatDate`는 `Intl.DateTimeFormat('en-NZ', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Pacific/Auckland' })`를 쓴다. 웹사이트 링크의 글자는 URL에서 프로토콜과 끝의 `/`를 뗀 것이다. 전화 링크의 `href`는 공백을 뗀 번호다.

- [ ] **Step 5: 화면을 만든다**

`places/[slug]/page.tsx`. `params`는 `Promise`다.

- `getPlace(slug)`가 `null`이면 `notFound()`를 부른다. 있으면 `<PlaceDetailView place={place} />`를 돌려준다.
- `generateMetadata`: `title`은 Place의 이름, `description`은 `description`이 있으면 그것, 없으면 주소다. Place가 없으면 빈 객체를 돌려준다.
- 한 요청에서 `getPlace`가 두 번 실행되지 않도록 React의 `cache`로 감싼다.

- [ ] **Step 6: 테스트, Lint, 빌드가 통과하는지 확인한다**

Run: `npm test && npm run lint && npm run build -w web`
Expected: `shared`와 `web`의 테스트가 모두 통과한다. 빌드 결과에 `/places/[slug]`가 동적 경로로 나온다.

- [ ] **Step 7: Backend와 연동해 확인한다**

```bash
docker compose up -d db
cd backend && ./gradlew bootRun
```

다른 터미널에서 Place를 하나 넣는다.

```bash
docker compose exec db psql -U queenstown -d queenstown -c "insert into place (slug, name, category, description, address, location, opening_hours, phone, website, source, source_url, status) values ('lakeside-kitchen', 'Lakeside Kitchen', 'food', 'Lakefront restaurant.', '12 Beach Street, Queenstown', ST_SetSRID(ST_MakePoint(168.6610, -45.0322), 4326)::geography, 'Mon - Sun · 8:00 am - 10:00 pm', '03 000 0000', 'https://lakesidekitchen.example', 'Business website', 'https://lakesidekitchen.example', 'public')"
```

`npm run dev -w web`으로 Web을 띄우고 확인한다.

| 확인 | 기대 |
|---|---|
| `curl -s http://localhost:3001/places/lakeside-kitchen` | 응답 HTML에 `Lakeside Kitchen`과 `12 Beach Street, Queenstown`이 있다. 서버에서 렌더링한 것이다. `<title>`은 `Lakeside Kitchen \| Queenstown Local`이다. |
| `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/places/nope` | `404` |
| 브라우저에서 `/places/lakeside-kitchen` | Explore 메뉴가 활성이다. 경로 표시, 이름, 설명, 주소, 영업시간, 연락처, 출처와 수정일이 보인다. |
| 브라우저에서 `/places/nope` | "Page not found"와 Map, Explore 링크가 보인다. |
| Backend를 끄고 브라우저에서 `/places/lakeside-kitchen` | "Something went wrong"과 "Try again"이 보인다. 스택이 보이지 않는다. Backend를 다시 켜고 "Try again"을 누르면 Place가 보인다. |

확인한 뒤 넣은 행을 지우고 서버와 DB를 멈춘다.

```bash
docker compose exec db psql -U queenstown -d queenstown -c "delete from place where slug = 'lakeside-kitchen'"
docker compose stop db
```

- [ ] **Step 8: 문서를 쓴다**

`web/README.md`에 필요한 것(Node 24), 설치(`npm install`은 저장소 루트에서), 실행, 테스트, Lint, 빌드 명령과 포트(3001), `API_BASE_URL`, 폴더 구조를 적는다. 이 계획에서 확인한 명령만 적는다.

루트 `README.md`: Current Status의 Completed에 4주차 Web Foundation을 더한다. Technology Stack의 Web에 Tailwind CSS, next-intl, Vitest를 더한다.

- [ ] **Step 9: 커밋한다**

```bash
git add web README.md
git commit -m "Add the place detail page rendered from the API"
```

---

## 범위 밖

4주차에 하지 않는다.

| 항목 | 시점 |
|---|---|
| 모바일 하단 탭과 반응형 배치 | 5주차 |
| 지도, Filter 칩, 현재 위치 | 6주차 |
| CORS. 브라우저가 API를 직접 부르는 첫 기능은 지도의 Marker다. | 6주차 |
| Place 목록, 검색창, 이미지, 빠른 행동, "View on map", 공유, Sitemap | 7주차 |
| Notice와 Event 화면 | 8주차 |
| 브라우저 자동화 테스트(E2E) | 12주차 통합 테스트. 그때까지 비동기 페이지는 연동 확인 단계에서 본다. |
| Admin, App | 11주차, 9 ~ 10주차 |
