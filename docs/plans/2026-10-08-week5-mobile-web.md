# Week 5 Mobile Web Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 지금까지 만든 Web 화면을 모바일 브라우저에서 쓸 수 있게 한다. 모바일은 하단 탭으로, 데스크톱은 상단 메뉴로 이동하고, 상세 화면에는 뒤로 가기가 있다.

**Architecture:** 화면을 따로 만들지 않고 같은 컴포넌트를 폭에 따라 다르게 배치한다. 기준 폭은 768px 하나다. 메뉴 정의(`MENU`, `activeMenu`)는 상단 메뉴와 하단 탭이 함께 쓴다. 폭에 따른 표시는 CSS로만 처리해서 서버에서 렌더링한 HTML이 모든 기기에 같다.

**Tech Stack:** Next.js 16, Tailwind CSS 4, next-intl, Vitest, Testing Library

**Spec:** [docs/01-mvp-feature-definition.md](../01-mvp-feature-definition.md) (NAV-01, COMMON-03), [docs/02-information-architecture.md](../02-information-architecture.md) 4장, [docs/04-wireframe.md](../04-wireframe.md) (m-map, m-place, m-more). 캘린더 5주차의 완료 기준은 "주요 화면이 모바일 환경에서 사용 가능"이다.

## Global Constraints

- 기준 폭은 768px(Tailwind의 `md`)이다. 767px 이하는 하단 탭, 768px 이상은 상단 메뉴다. 둘이 함께 보이거나 둘 다 안 보이는 폭이 없어야 한다.
- 폭에 따라 숨기는 요소는 `display: none`으로 숨긴다. 숨긴 메뉴는 키보드와 화면 낭독기에도 잡히지 않아야 한다.
- 하단 탭은 Map / Explore / Local / More 순서이고 `MENU`를 그대로 쓴다. 메뉴를 따로 정의하지 않는다.
- 누르는 요소의 높이는 44px 이상이다.
- 화면 높이는 `dvh`를 쓴다. `vh`는 모바일 브라우저의 주소창 때문에 실제보다 크다.
- 하단 탭은 `env(safe-area-inset-bottom)`만큼 아래 여백을 둔다. 이를 위해 viewport에 `viewport-fit=cover`를 지정한다.
- 가로 스크롤이 생기지 않아야 한다. 가장 좁은 기준은 320px이다.
- 문구는 `web/messages/en.json`에 둔다.
- 아이콘은 디자인 단계에서 정한다. 이번 주의 탭은 글자만 쓴다.
- Web은 3001번 포트, 커밋 메시지는 영어, 마지막 줄에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`를 붙인다.
- 검증 단계와 커밋을 한 명령에 묶을 때는 테스트, Lint, 빌드가 모두 통과했을 때만 커밋되게 한다.

## Review Focus

1. **검색 결과에서 상세 화면으로 바로 들어온 사람이 뒤로 가기를 누른다.** 사이트 밖으로 나가지 않고 Explore로 가야 한다. → Task 2
2. **Explore에서 상세로 갔다가 브라우저의 뒤로 가기로 돌아온 뒤 다시 상세로 간다.** 화면의 뒤로 가기는 여전히 사이트 안에서 움직여야 한다. → Task 2
3. **폭이 정확히 767px, 768px이다.** 메뉴가 둘 다 보이거나 둘 다 사라지지 않아야 한다. → Task 1
4. **320px 폭에서 이름이 아주 긴 Place를 본다.** 글자가 화면 밖으로 나가 가로 스크롤이 생기지 않아야 한다. → Task 2
5. **내용이 화면보다 짧다.** 하단 탭이 화면 중간에 떠 있지 않고 바닥에 붙어야 한다. 내용이 길 때는 스크롤해도 탭이 보여야 한다. → Task 1

---

## File Structure

```text
web/
 ├── messages/en.json                       Nav.back 추가
 └── src
      ├── app
      │    ├── layout.tsx                    viewport, 상단 메뉴와 하단 탭 배치
      │    └── page.tsx                      Map 자리: 남는 높이를 채운다
      ├── components
      │    ├── nav/TopNav.tsx                768px 이상에서만 보인다
      │    ├── nav/BottomNav.tsx             767px 이하에서만 보인다
      │    ├── nav/BackLink.tsx              상세 화면의 뒤로 가기
      │    └── place/PlaceDetailView.tsx     모바일은 뒤로 가기, 데스크톱은 경로 표시
      └── lib/history.ts                     사이트 안에서 뒤로 갈 수 있는지 판단
```

---

### Task 1: 하단 탭과 반응형 틀

**Files:**
- Create: `web/src/components/nav/BottomNav.tsx`
- Modify: `web/src/components/nav/TopNav.tsx`, `web/src/app/layout.tsx`, `web/src/app/page.tsx`
- Test: `web/src/components/nav/BottomNav.test.tsx`

**Interfaces:**
- Consumes: `MENU`, `activeMenu` (`web/src/components/nav/menu.ts`), `renderWithMessages`
- Produces: `BottomNav` (Client Component, props 없음) — `<nav aria-label="Main">` 안에 링크 네 개
- Produces: `layout.tsx`의 `export const viewport` — `width: 'device-width'`, `initialScale: 1`, `viewportFit: 'cover'`

- [ ] **Step 1: 브랜치를 만들고 계획 문서를 커밋한다**

```bash
git checkout -b feat/mobile-web
git add docs/plans/2026-10-08-week5-mobile-web.md
git commit -m "Add week 5 mobile web plan"
```

- [ ] **Step 2: 실패하는 테스트를 쓴다**

`BottomNav.test.tsx`. `next/navigation`의 `usePathname`을 `vi.mock`으로 바꾼다.

```tsx
test('shows the four tabs in order with their links', () => {
  // usePathname -> '/'
  // "Main" navigation 안의 링크: Map "/", Explore "/explore", Local "/notices", More "/more" (이 순서)
})

test('marks only the active tab as the current page', () => {
  // usePathname -> '/places/lakeside-kitchen'
  // Explore 만 aria-current="page"
})

test('marks nothing on a path outside every tab', () => {
  // usePathname -> '/nope' → aria-current 를 가진 링크가 없다
})
```

- [ ] **Step 3: 테스트가 실패하는지 확인한다**

Run: `npm test -w web`
Expected: FAIL. `./BottomNav`를 찾을 수 없다.

- [ ] **Step 4: `BottomNav`를 만들고 틀에 붙인다**

- `BottomNav`: 767px 이하에서만 보인다(`md:hidden`). 화면 바닥에 붙는다(`sticky bottom-0`). 탭 네 개가 폭을 똑같이 나눈다. 탭의 높이는 56px이고, 그 아래에 `env(safe-area-inset-bottom)`만큼 여백을 둔다. 활성 탭은 굵은 글자와 위쪽 선으로 표시한다.
- `TopNav`: 768px 이상에서만 보인다(`hidden md:flex`).
- `layout.tsx`: `viewport`를 export 한다. `<body>`는 `min-h-dvh`의 세로 flex이고 순서는 `TopNav`, `<main>`(`flex-1`), `BottomNav`다.
- `page.tsx`(Map): 제목 아래에 남는 높이를 모두 채우는 영역을 둔다. 6주차에 지도가 들어갈 자리다. `data-testid="map-area"`를 붙인다.

- [ ] **Step 5: 테스트, Lint, 빌드가 통과하는지 확인한다**

Run: `npm test && npm run lint && npm run build -w web`
Expected: 모두 통과

- [ ] **Step 6: 브라우저에서 폭을 바꿔 확인한다**

`npm run dev -w web`으로 띄우고 `http://localhost:3001`을 연다. 각 폭에서 상단 메뉴와 하단 탭의 `display`를 확인한다.

| 폭 × 높이 | 상단 메뉴 | 하단 탭 | 그 밖에 |
|---|---|---|---|
| 375 × 812 | 숨김 | 보임 | 탭 네 개가 한 줄이고 높이가 56px 이상이다. 탭의 바닥이 화면 바닥과 같다. 지도 자리의 높이가 화면 높이에서 제목과 탭을 뺀 만큼이다. 가로 스크롤이 없다. |
| 320 × 640 | 숨김 | 보임 | 가로 스크롤이 없다. 탭의 글자가 줄바꿈되지 않는다. |
| 767 × 800 | 숨김 | 보임 | |
| 768 × 800 | 보임 | 숨김 | |
| 1200 × 800 | 보임 | 숨김 | |

375 × 812에서 탭을 차례로 눌러 화면이 바뀌고 누른 탭만 활성인지 확인한다.

- [ ] **Step 7: 커밋한다**

```bash
git add web
git commit -m "Add the mobile bottom navigation and the responsive shell"
```

---

### Task 2: 상세 화면의 뒤로 가기와 모바일 배치

**Files:**
- Create: `web/src/lib/history.ts`, `web/src/components/nav/BackLink.tsx`
- Modify: `web/src/components/place/PlaceDetailView.tsx`, `web/messages/en.json`
- Modify: `web/README.md`, `README.md`, `docs/02-information-architecture.md`
- Test: `web/src/lib/history.test.ts`, `web/src/components/nav/BackLink.test.tsx`, `web/src/components/place/PlaceDetailView.test.tsx`

**Interfaces:**
- Consumes: `renderWithMessages`, `PlaceDetailView`
- Produces: `canGoBackInApp(): boolean` — 브라우저의 Navigation API에서 현재 항목의 `index`가 0보다 크면 `true`. Navigation API가 없으면 `false`.
- Produces: `BackLink` (Client Component) — props `{ fallbackHref: string }`. `fallbackHref`로 가는 링크이고 이름은 `Nav.back`("Back")이다. 누를 때 `canGoBackInApp()`이 `true`면 기본 이동을 막고 `router.back()`을 부른다.
- Produces: `messages/en.json`의 `Nav.back`: `"Back"`

Navigation API의 항목 목록에는 같은 사이트의 연속된 기록만 들어 있다. 그래서 `index`가 0이면 이전 화면이 이 사이트가 아니다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`history.test.ts`. `window.navigation`을 바꿔 가며 확인한다.

```ts
test('can go back when an earlier entry of this site exists', () => {
  // window.navigation = { currentEntry: { index: 2 } } → true
})

test('cannot go back on the first entry of this site', () => {
  // window.navigation = { currentEntry: { index: 0 } } → false
})

test('cannot go back when the browser has no Navigation API', () => {
  // window.navigation 이 없다 → false
  // window.navigation = { currentEntry: null } → false
})
```

`BackLink.test.tsx`. `next/navigation`의 `useRouter`를 `{ back: vi.fn() }`으로 바꾼다.

```tsx
test('is a link to the fallback page named Back', () => {
  // <BackLink fallbackHref="/explore" /> → 링크 이름 "Back", href "/explore"
})

test('goes back in history when this site has an earlier entry', async () => {
  // window.navigation.currentEntry.index = 1, 링크를 누른다
  // router.back 이 한 번 호출된다. 클릭 이벤트의 기본 동작이 막혔다.
})

test('follows the link when there is nowhere to go back to', async () => {
  // index = 0, 링크를 누른다
  // router.back 이 호출되지 않는다. 클릭 이벤트의 기본 동작이 막히지 않았다.
})
```

`PlaceDetailView.test.tsx`에 더한다.

```tsx
test('offers a way back to Explore', () => {
  // 링크 "Back" 의 href 가 "/explore"
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm test -w web`
Expected: FAIL. `./history`와 `./BackLink`를 찾을 수 없고, `PlaceDetailView`에 "Back" 링크가 없다.

- [ ] **Step 3: `history.ts`, `BackLink.tsx`를 만들고 `PlaceDetailView`를 고친다**

`PlaceDetailView`

- 맨 위에 `BackLink`(`fallbackHref="/explore"`)를 둔다. 767px 이하에서만 보인다. 높이는 44px 이상이다.
- 경로 표시(Explore / Category)는 768px 이상에서만 보인다.
- 좌우 여백은 767px 이하에서 16px, 768px 이상에서 32px이다.
- 이름, 설명, 주소, 링크의 글자는 단어가 없어도 줄바꿈된다(`break-words`).

- [ ] **Step 4: 테스트, Lint, 빌드가 통과하는지 확인한다**

Run: `npm test && npm run lint && npm run build -w web`
Expected: 모두 통과

- [ ] **Step 5: Backend와 함께 띄워 모바일 폭에서 확인한다**

```bash
docker compose up -d db
cd backend && ./gradlew bootRun
```

Place를 두 개 넣는다. 하나는 이름이 아주 길다.

```bash
docker compose exec db psql -U queenstown -d queenstown -c "insert into place (slug, name, category, description, address, location, opening_hours, phone, website, source, source_url, status) values ('lakeside-kitchen', 'Lakeside Kitchen', 'food', 'Lakefront restaurant.', '12 Beach Street, Queenstown', ST_SetSRID(ST_MakePoint(168.6610, -45.0322), 4326)::geography, 'Mon - Sun · 8:00 am - 10:00 pm', '03 000 0000', 'https://lakesidekitchen.example', 'Business website', 'https://lakesidekitchen.example', 'public'), ('long-name', 'Wakatipuwhakatipuwhakatipuwhakatipuwhakatipuwhakatipu Adventures', 'activity', 'Averyveryveryveryveryveryveryveryveryveryverylongwordwithoutanyspaces.', '1 Averyveryveryveryveryveryveryverylongstreetname Road, Queenstown', ST_SetSRID(ST_MakePoint(168.6626, -45.0312), 4326)::geography, null, null, 'https://averyveryveryveryveryveryveryverylongdomainname.example/with/a/long/path', 'Business website', 'https://example.com', 'public')"
```

`npm run dev -w web`으로 Web을 띄우고 확인한다.

| 폭 | 화면 | 기대 |
|---|---|---|
| 375 | `/places/lakeside-kitchen` | "Back"이 보이고 경로 표시는 숨겨져 있다. 하단 탭의 Explore가 활성이다. 가로 스크롤이 없다. |
| 320 | `/places/long-name` | 가로 스크롤이 없다. 긴 이름, 주소, 웹사이트가 줄바꿈된다. |
| 375 × 480 | `/places/lakeside-kitchen`을 끝까지 스크롤 | 내용이 화면보다 길다. 스크롤하는 동안 하단 탭이 계속 화면 바닥에 보인다. |
| 1200 | `/places/lakeside-kitchen` | "Back"이 숨겨져 있고 경로 표시가 보인다. |
| 375 | `/more`를 연 뒤 주소창으로 `/places/lakeside-kitchen`에 가서 "Back"을 누른다 | `/more`로 돌아간다. |
| 375 | 새 탭에서 `/places/lakeside-kitchen`을 바로 열고 "Back"을 누른다 | `/explore`로 간다. |
| 375 | `/explore` → 주소창으로 상세 → 브라우저 뒤로 가기 → 브라우저 앞으로 가기 → "Back" | `/explore`로 돌아간다. 사이트 밖으로 나가지 않는다. |

확인한 뒤 넣은 행을 지우고 서버와 DB를 멈춘다.

```bash
docker compose exec db psql -U queenstown -d queenstown -c "delete from place where slug in ('lakeside-kitchen', 'long-name')"
docker compose stop db
```

- [ ] **Step 6: 문서를 고친다**

- `web/README.md`: "알아 둘 것"에 기준 폭 768px, 폭에 따른 표시는 CSS로만 한다는 점, 뒤로 가기의 동작을 적는다.
- `README.md`: Current Status의 Completed에 5주차 Mobile Web을 더한다.
- `docs/02-information-architecture.md` 4장: "데스크톱의 More는 펼침 메뉴로 표시한다"를 "데스크톱의 More도 `/more`로 이동한다"로 고친다. 항목이 About 하나뿐이라 펼침 메뉴를 따로 만들지 않는다.

- [ ] **Step 7: 커밋한다**

```bash
git add web README.md docs/02-information-architecture.md
git commit -m "Add the back link and the mobile layout of the place detail page"
```

---

## 범위 밖

5주차에 하지 않는다.

| 항목 | 시점 |
|---|---|
| 지도, Filter 칩, 현재 위치 버튼, 선택 카드 | 6주차 |
| 검색창, Place 목록, 상세의 이미지와 빠른 행동, 데스크톱 상세의 2열 배치 | 7주차 |
| Notices / Events 탭 | 8주차 |
| About 화면 | 8주차 |
| 탭 아이콘과 색, 글꼴 | 디자인 단계 |
| 실제 기기 확인 | 브라우저에서 폭을 바꿔 확인한다. iPhone의 safe area는 실제 기기나 시뮬레이터에서만 보이므로 9주차 App Prototype 때 함께 본다. |
