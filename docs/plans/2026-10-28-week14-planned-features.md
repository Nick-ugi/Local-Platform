# Week 14 Planned Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App을 스토어에 올리기 전에, 처음 기획에 있었지만 아직 없는 기능을 채운다. App의 Local 탭(APP-01), 상세의 주변 장소(PLACE-08), 검색 결과 지도(SEARCH-03), 지도 카드의 영업 배지(PLACE-07의 남은 부분), App의 최근 본 장소(README "Later"의 Recent Place), 확대했을 때 Marker 겹침 정리.

**Architecture:** 판단은 `shared`에 둔다(주변 장소 고르기, 점들의 범위, 목록 장소를 Marker로 바꾸기). Backend는 `/map/markers`의 Place에 `openingHours`를 더하는 것뿐이다. 검색 결과 지도는 기존 `/places?q=&size=50`을 쓰고, 지도는 결과 모드에서 영역 갱신을 멈추고 결과에 맞춰 확대한다(`MapView`의 `fit`). App에 네이티브 모듈을 더하지 않는다. 최근 본 장소는 이미 있는 `expo-secure-store`에 둔다.

**Tech Stack:** 기존 그대로(Spring Boot · MyBatis, Next.js 16, Expo SDK 57 · expo-router, mapbox-gl, @rnmapbox/maps).

**Spec:** [docs/01-mvp-feature-definition.md](../01-mvp-feature-definition.md) (APP-01, PLACE-07, PLACE-08, SEARCH-03, EVENT-01 ~ 02, NOTICE-01 · 06), README "5. Initial Navigation"(Map / Explore / Local / More), "14. MVP Scope"의 Later(Recent Place), 13주차 에뮬레이터 확인(줌 16에서 시내 Marker 수백 개가 겹침). 대화에서 정한 설계: 주변 장소는 자기 자신과 Facility를 빼고 1km 안의 5곳, 없으면 숨김. 검색 지도는 최대 50곳, 결과 모드에서 칩과 영역 갱신을 끈다. 최근 본 장소는 10곳.

## Global Constraints

- App에 네이티브 모듈을 더하지 않는다(개발 빌드를 다시 만들지 않는다). 저장은 `expo-secure-store`.
- 공개 API는 필드를 더하기만 한다. 목록의 `size`는 50이 최대다(`Paging.MAX_SIZE`).
- 화면 문구는 English, Web과 App 각각의 `en.json`에 둔다. 같은 뜻이면 같은 키와 문구.
- 날짜와 시각은 뉴질랜드 시간(`Pacific/Auckland`).
- 묶음은 줌 17까지(`CLUSTER_MAX_ZOOM = 17`), 묶음 반경 44는 그대로.
- 커밋 메시지는 English, 작업마다 커밋. 끝나면 push, PR, main 병합(사용자가 미리 허락함).

## Review Focus

1. **검색어에 맞는 곳이 없다.** 지도는 "No places match “{q}”."를 보이고 확대하지 않으며, ✕로 평소 지도로 돌아간다. → Task 4, Task 5
2. **검색 결과가 50곳을 넘는다.** 처음 50곳만 보이고 "Showing the first 50 results."라고 말한다. → Task 4, Task 5
3. **주변 장소를 못 불러온다 / 1km 안에 없다.** 상세는 그대로 보이고 Nearby 칸만 없다. → Task 2, Task 3
4. **Local 탭에서 칩을 빠르게 바꾼다.** 앞 목록의 늦은 응답이 새 목록에 섞이지 않는다(요청 취소). → Task 6
5. **최근 본 장소 저장이 깨졌거나 읽을 수 없다.** 빈 목록으로 보이고 앱은 그대로 동작한다. → Task 7

---

## File Structure

```text
backend   map/PlaceMarker.java, mapper/MapMapper.xml: Place Marker에 openingHours
shared/src
 ├── api.ts            PlaceMarker.openingHours
 ├── nearby.ts         pickNearby (+ test)
 └── map/bounds.ts     boundsOf · map/marker.ts placeMarkerOf (+ tests)
web/src
 ├── components/map    MarkerPreview 배지, MapView fit · 묶음 17, MapScreen 검색 모드
 ├── components/place  NearbyList, PlaceDetailView에 Nearby
 ├── components/search SearchResults에 "Show on map"
 └── lib/map           useSearchMarkers
mobile/src
 ├── app/(tabs)/local.tsx, local/  Local 탭(LocalScreen, EventRow, NoticeRow)
 ├── api/events.ts, notices.ts     목록 함수
 ├── ui/usePagedList.ts            페이지 목록 훅
 ├── detail/NearbyPlaces.tsx       상세의 주변 장소
 ├── map/                          MarkerPreview 배지, MapView fit · 묶음 17, 검색 모드, useSearchMarkers
 └── places/recentPlaces.ts        최근 본 장소
```

---

### Task 1: 지도 카드의 영업 배지 (PLACE-07, Backend · shared · Web · App)

**Files:**
- Modify: `backend/src/main/java/com/queenstownlocal/backend/map/PlaceMarker.java`, `backend/src/main/resources/mapper/MapMapper.xml`, 지도 API 테스트, `docs/06-api-specification.md`(markers의 Place 필드)
- Modify: `shared/src/api.ts`(`PlaceMarker.openingHours: string | null`), Marker를 만드는 테스트 fixture들
- Modify: `web/src/components/map/MarkerPreview.tsx`, `mobile/src/map/MarkerPreview.tsx` + 각 테스트

**Interfaces:**
- Produces: `PlaceMarker.openingHours: string | null` (Task 4 · 5의 `placeMarkerOf`가 채운다)

- [ ] **Step 1: 실패하는 테스트**: 지도 API 테스트가 Place Marker의 `openingHours`(값이 있는 곳과 null)를 확인. Web · App MarkerPreview 테스트: 10시(뉴질랜드)에 `Mo-Su 09:00-17:00`인 Place 카드에 "Open now · until 5:00 pm", 영업시간이 없으면 배지 없음, Event · Notice 카드에는 없음.
- [ ] **Step 2: 실패 확인**: `./gradlew test --tests '*Map*'`, `npx vitest run src/components/map/MarkerPreview.test.tsx`, `npx jest src/map/__tests__/MarkerPreview.test.tsx`(없으면 새로)
- [ ] **Step 3: 구현**: record와 SQL에 `opening_hours`, shared 타입, 두 카드에 `OpenBadge`(Web `components/place/OpenBadge`, App `ui/OpenBadge`)를 종류 줄 아래에.
- [ ] **Step 4: 통과 확인**: 위 명령 + `npm test -w shared`, typecheck
- [ ] **Step 5: 커밋** `Show whether a place is open now on the map's card`

### Task 2: 주변 장소 (PLACE-08, shared · Web)

**Files:**
- Create: `shared/src/nearby.ts` (+ `nearby.test.ts`), `web/src/components/place/NearbyList.tsx`
- Modify: `shared/src/index.ts`, `web/src/lib/api/places.ts`(이미 `size` 있음), `web/src/app/places/[slug]/page.tsx`, `web/src/components/place/PlaceDetailView.tsx`(+ 테스트), `web/messages/en.json`(`Place.nearby`: "Nearby")

**Interfaces:**
- Produces: `NEARBY_FETCH = 12`, `pickNearby(places: readonly PlaceSummary[], from: { slug: string }): PlaceSummary[]` — 자기 자신, `category === "facility"`, `distanceM`이 null이거나 1000 초과인 곳을 빼고 가까운 순 앞 5곳.
- Produces (Web): `PlaceDetailView`의 새 prop `nearby?: PlaceSummary[]`.

- [ ] **Step 1: 실패하는 테스트**: `pickNearby`가 자기 자신·Facility·1000m 초과·거리 없음을 빼고 5곳까지(7곳 입력 → 5곳, 순서 유지). Web 상세: `nearby` 두 곳이면 "Nearby" 제목 아래 이름, "Cafes · 120 m", `/places/<slug>` 링크. 빈 배열이면 칸이 없음.
- [ ] **Step 2: 실패 확인**: `npm test -w shared`, `npx vitest run src/components/place/PlaceDetailView.test.tsx`
- [ ] **Step 3: 구현**: 페이지가 `getPlaces({ position: place, size: NEARBY_FETCH })`를 상세와 함께 서버에서 부르고 실패하면 `[]`. `NearbyList`는 `PlaceCard`보다 작은 줄 목록(이름, 종류 · 거리).
- [ ] **Step 4: 통과 확인**: Web 전체 테스트, lint
- [ ] **Step 5: 커밋** `List nearby places at the foot of a place's page`

### Task 3: App 상세의 주변 장소 (PLACE-08)

**Files:**
- Create: `mobile/src/detail/NearbyPlaces.tsx` (+ 테스트)
- Modify: `mobile/src/api/places.ts`(`size?: number`), 장소 상세 라우트(`mobile/src/app/places/[slug].tsx` 또는 그 화면), `mobile/src/detail/PlaceDetailView.tsx`(`nearby?: ReactNode`를 출처 줄 위에), `mobile/src/messages/en.json`(`Place.nearby`)

**Interfaces:**
- Consumes: `pickNearby`, `NEARBY_FETCH` (Task 2)
- Produces: `NearbyPlaces({ place, onOpen }: { place: PlaceDetail; onOpen: (slug: string) => void })`

- [ ] **Step 1: 실패하는 테스트**: getPlaces를 흉내 내 근처 3곳(그중 하나는 자기 자신) → 두 줄과 "Nearby", 누르면 `onOpen(slug)`. 요청이 실패하거나 고를 곳이 없으면 아무것도 그리지 않음.
- [ ] **Step 2: 실패 확인**: `npx jest src/detail`
- [ ] **Step 3: 구현**: 장소가 바뀌면 이전 요청을 취소하고 다시 부른다. 줄은 이름과 "종류 · 거리", 높이 44pt 이상.
- [ ] **Step 4: 통과 확인**: `npm test -w mobile`, typecheck
- [ ] **Step 5: 커밋** `List nearby places on the app's place screen`

### Task 4: 검색 결과 지도, 결과에 맞춘 확대, 묶음 17 (SEARCH-03, shared · Web)

**Files:**
- Modify: `shared/src/map/bounds.ts`(`boundsOf`), Create: `shared/src/map/marker.ts`(`placeMarkerOf`) + 테스트
- Create: `web/src/lib/map/useSearchMarkers.ts` (+ 테스트)
- Modify: `web/src/components/map/MapView.tsx`(`fit` prop, `CLUSTER_MAX_ZOOM = 17`), `MapScreen.tsx`(검색 모드), `web/src/components/search/SearchResults.tsx`("Show on map"), `web/messages/en.json`, 각 테스트

**Interfaces:**
- Produces: `boundsOf(points: readonly LatLng[]): MapBounds | null`(빈 배열은 null), `placeMarkerOf(place: PlaceSummary): PlaceMarker`
- Produces (Web): `useSearchMarkers(q: string | null): { status: "idle" | "loading" | "ready" | "error"; markers: PlaceMarker[]; total: number; retry: () => void }` — `getPlaces({ q, size: 50 })`
- Produces (Web): `MapView`의 `fit?: MapBounds | null` — 값이 바뀌면 `fitBounds`(여백 64, 최대 줌 16)
- 문구: `Map.searchResults` "Results for “{q}”", `Map.clearSearch` "Clear search", `Map.searchEmpty` "No places match “{q}”.", `Map.searchTruncated` "Showing the first 50 results.", `Search.showOnMap` "Show on map"

- [ ] **Step 1: 실패하는 테스트**: `boundsOf`(빈 배열 null, 점 하나, 여러 점), `placeMarkerOf`. MapView: `fit`이 바뀌면 `fitBounds`가 한 번, 같은 값이면 다시 안 부름, 묶음 `clusterMaxZoom: 17`. MapScreen `/?q=coffee`: 결과 Marker만 지도에, 영역 Marker 요청 없음(`useMarkers`에 null), 칩 없음, 띠 "Results for “coffee”", ✕ → `q`가 URL에서 빠짐, 결과 0이면 "No places match “coffee”.", total 60이면 "Showing the first 50 results.", 결과 Marker를 눌러 카드. SearchResults에 `/?q=coffee` 링크.
- [ ] **Step 2: 실패 확인**: `npm test -w shared`, `npx vitest run src/components/map src/components/search src/lib/map`
- [ ] **Step 3: 구현**: 검색 모드는 URL의 `q`(normalizeQuery). 결과가 오면 `fit = boundsOf(markers)`를 검색어마다 한 번. 선택(`?place=`)은 평소처럼 쓴다.
- [ ] **Step 4: 통과 확인**: Web 전체 테스트, lint, typecheck
- [ ] **Step 5: 커밋** `Show search results on the web map, and cluster up to zoom 17`

### Task 5: App 검색 결과 지도와 묶음 17 (SEARCH-03)

**Files:**
- Create: `mobile/src/map/useSearchMarkers.ts` (+ 테스트)
- Modify: `mobile/src/map/MapView.tsx`(`fit`, `CLUSTER_MAX_ZOOM = 17`), `mobile/src/map/MapScreen.tsx`(`search`, `onSearchClear`), `mobile/src/app/(tabs)/index.tsx`(`?q=`), `mobile/src/places/SearchScreen.tsx` + `mobile/src/app/search.tsx`("Show on map"), `mobile/src/api/places.ts`(`size`, Task 3), `mobile/src/messages/en.json`, 각 테스트

**Interfaces:**
- Consumes: `boundsOf`, `placeMarkerOf` (Task 4), 같은 문구 키
- Produces: `MapScreen` props `search: string | null`, `onSearchClear: () => void`; `SearchScreen` prop `onShowOnMap: (q: string) => void`; `MapView` prop `fit?: MapBounds | null` → `Camera.fitBounds([east, north], [west, south], 64, MOVE_MS)`

- [ ] **Step 1: 실패하는 테스트**: MapView: `fit`이 바뀌면 카메라의 `fitBounds`, 묶음 `clusterMaxZoomLevel: 17`. MapScreen `search="coffee"`: Task 4와 같은 다섯 가지(결과만, 칩 없음, 띠와 ✕ → `onSearchClear`, 0곳, 50곳 넘음). "View on map" 대상이 오면 검색 모드를 끈다(`onSearchClear`). SearchScreen: 결과가 있을 때 "Show on map" → `onShowOnMap("coffee")`.
- [ ] **Step 2: 실패 확인**: `npx jest src/map src/places`
- [ ] **Step 3: 구현**: 라우트는 `router.navigate({ pathname: "/", params: { q } })`, ✕는 `router.setParams({ q: undefined })`.
- [ ] **Step 4: 통과 확인**: `npm test -w mobile`, typecheck, lint
- [ ] **Step 5: 커밋** `Show search results on the app's map, and cluster up to zoom 17`

### Task 6: App Local 탭 (APP-01, EVENT-01 ~ 02, NOTICE-01 · 06)

**Files:**
- Create: `mobile/src/ui/usePagedList.ts`, `mobile/src/local/LocalScreen.tsx`, `EventRow.tsx`, `NoticeRow.tsx`, `mobile/src/app/(tabs)/local.tsx` + 테스트
- Modify: `mobile/src/api/events.ts`(`getEvents`), `notices.ts`(`getNotices`), `mobile/src/app/(tabs)/_layout.tsx`(Map, Explore, Local, More), `mobile/src/messages/en.json`(`Nav.local`, `Local`의 Web과 같은 키), `src/__tests__/navigation.test.tsx`

**Interfaces:**
- Produces: `getEvents(query: { when?: EventPeriod | null; page?: number }, options?)`, `getNotices(query: { type?: NoticeType | null; page?: number }, options?)` → `Page<…>`
- Produces: `usePagedList<T>(key: string, load: (page: number, signal: AbortSignal) => Promise<Page<T>>): { status: "loading" | "ready" | "error"; items: T[]; total: number; more: "idle" | "loading" | "error"; loadMore(): void; retry(): void }` — key가 바뀌면 앞 요청을 취소하고 처음부터.
- Produces: `LocalScreen({ onOpen }: { onOpen: (path: string) => void })`

- [ ] **Step 1: 실패하는 테스트**: 탭이 "Map, Explore, Local, More" 순서(1 of 4 …). LocalScreen: 처음엔 Events(All), 칩 All · Today · This Week · This Month → `getEvents({ when: "week" })`, 행에 제목 · 뉴질랜드 날짜 · 장소, 누르면 `/events/<slug>`. Notices로 바꾸면 칩 All types와 네 유형, 행에 유형 · Official · 제목 · 기간, 누르면 `/notices/<slug>`. 빈 목록 문구(Web과 같음), 오류와 "Try again", 5초 넘으면 깨우는 중 안내. `usePagedList`: 칩을 바꾸는 사이 앞 응답이 늦게 와도 새 목록에 안 섞임, 다음 페이지.
- [ ] **Step 2: 실패 확인**: `npx jest src/local src/ui src/__tests__/navigation.test.tsx`
- [ ] **Step 3: 구현**: Events | Notices 전환은 두 칸 버튼(선택 상태 `accessibilityState.selected`), 칩은 `Chips`, 목록은 `FlatList` + `onEndReached`, 로딩은 `LoadingMessage`. Event 행 사진 자리는 `KindPlaceholder`(event), Notice 행은 `NoticeBadges`.
- [ ] **Step 4: 통과 확인**: `npm test -w mobile`, typecheck, lint
- [ ] **Step 5: 커밋** `Add the Local tab to the app with events and notices`

### Task 7: App 최근 본 장소 (Recent Place)

**Files:**
- Create: `mobile/src/places/recentPlaces.ts` (+ 테스트)
- Modify: 장소 상세 라우트(장소가 보이면 기록), `mobile/src/places/SearchScreen.tsx`(검색어가 없을 때 목록), `mobile/src/messages/en.json`(`Search.recent` "Recently viewed", `Search.clearRecent` "Clear")

**Interfaces:**
- Produces: `type RecentPlace = Pick<PlaceSummary, "slug" | "name" | "category" | "subtype">`, `MAX_RECENT = 10`, `addRecent(list: readonly RecentPlace[], place: RecentPlace): RecentPlace[]`(맨 앞에, 같은 slug는 하나, 10개까지), `loadRecentPlaces(): Promise<RecentPlace[]>`(읽기 실패나 모양이 틀리면 `[]`), `rememberPlace(place: RecentPlace): Promise<void>`, `clearRecentPlaces(): Promise<void>`; SecureStore 키 `recentPlaces`

- [ ] **Step 1: 실패하는 테스트**: `addRecent` 순서 · 중복 · 10개. 저장소가 throw하거나 JSON이 깨졌으면 `[]`. SearchScreen(q ""): 저장된 두 곳이 "Recently viewed" 아래에, 누르면 `onOpen`, "Clear" → 목록이 사라짐. 상세가 열리면 `rememberPlace` 호출.
- [ ] **Step 2: 실패 확인**: `npx jest src/places src/detail`
- [ ] **Step 3: 구현**: SecureStore 값은 JSON 배열 하나(10곳이면 약 1KB).
- [ ] **Step 4: 통과 확인**: `npm test -w mobile`, typecheck, lint
- [ ] **Step 5: 커밋** `Remember recently viewed places in the app`

### Task 8: 확인, 문서, 배포

- [ ] 전체 테스트(Backend, shared, web, admin, mobile, seed), lint, typecheck, admin 빌드.
- [ ] 로컬 서버 구성을 다시 빌드해 `test:local`, `test:smoke`. Web을 375px · 데스크톱으로 캡처(검색 지도, 상세의 Nearby, 지도 카드 배지).
- [ ] 에뮬레이터: Local 탭(Events · Notices, 칩), 상세의 Nearby, 검색 → Show on map → ✕, 최근 본 장소, 줌 17까지 묶음.
- [ ] 문서: README Current Status 14주차, 기능 정의 주차표(14: APP-01, PLACE-07 Preview, PLACE-08, SEARCH-03, Recent Place), `docs/02-information-architecture.md`의 App 탭이 Map / Explore / More로 적혀 있으면 Local을 더한다.
- [ ] 커밋 → push → PR → main 병합.

---

## 범위 밖

| 항목 | 시점 |
|---|---|
| 계정 삭제, 앱 아이콘 · 스플래시, 릴리스 빌드(eas.json) | Render 배포 뒤, 스토어 등록 준비 |
| Web의 최근 본 장소, 탭 아이콘 | 다음 |
| 장소 사진 · 설명 보강 | 사진 출처를 정할 때 |
| 푸시 알림 | Later |
