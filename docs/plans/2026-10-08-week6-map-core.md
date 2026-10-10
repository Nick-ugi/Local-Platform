# Week 6 Map Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Map 화면에 실제 지도가 뜨고, 보이는 영역의 Place가 Marker로 나오며, 칩으로 좁히고, Marker를 눌러 Preview에서 상세로 가고, 현재 위치를 볼 수 있다.

**Architecture:** Backend에 지도 영역의 Marker를 주는 API를 더한다. 브라우저는 Backend를 직접 부르지 않고 Web의 같은 주소(`/api/v1/...`)를 부르며, Next.js가 Backend로 전달한다. 지도는 Mapbox GL JS를 직접 쓰고, Marker는 GeoJSON source와 layer로 그린다. 지도 SDK를 다루는 컴포넌트 하나만 얇게 두고, 나머지 로직(영역, 필터, 거리, 위치 판단)은 지도 없이 테스트할 수 있는 함수와 훅에 둔다.

**Tech Stack:** Spring Boot 4.0, MyBatis, PostGIS / Next.js 16, mapbox-gl 3, Vitest

**Spec:** [docs/01-mvp-feature-definition.md](../01-mvp-feature-definition.md) (MAP-01 ~ MAP-05, MAP-08, COMMON-01, COMMON-02), [docs/02-information-architecture.md](../02-information-architecture.md) 3장 "Map의 상태", 5장, [docs/03-user-flow.md](../03-user-flow.md) (UF-01, UF-02, 상태 안내), [docs/04-wireframe.md](../04-wireframe.md) (m-map, m-map-place, d-map), [docs/06-api-specification.md](../06-api-specification.md) 1장, 3장. 캘린더 6주차의 완료 기준은 "지도에서 현재 위치와 주요 Marker 확인 가능"이다.

## Global Constraints

- Mapbox 공개 토큰은 `web/.env.local`의 `NEXT_PUBLIC_MAPBOX_TOKEN`에서 읽는다. 저장소에 커밋하지 않고, 명령의 출력이나 로그에 찍지 않는다. 토큰이 없으면 지도 대신 안내를 보여주고 다른 화면은 정상 동작한다.
- 브라우저는 Backend를 직접 부르지 않는다. 같은 주소의 `/api/v1/...`를 부르고 Next.js가 `API_BASE_URL`로 전달한다. CORS는 추가하지 않는다.
- 좌표의 순서: API와 TypeScript 타입은 `latitude`, `longitude`다. GeoJSON과 Mapbox는 `[longitude, latitude]`다. 바꾸는 곳은 `toFeatureCollection` 한 곳뿐이다.
- 기준 위치와 서비스 지역은 `shared`의 `SERVICE_CENTER`, `SERVICE_RADIUS_KM`을 쓴다.
- 이번 주의 Marker는 Place뿐이다. API는 `filter`의 `event`, `notice`를 받아들이지만 결과에는 넣지 않는다. 칩도 Category 6개만 보여준다. Events / Notices는 8주차다.
- Marker는 한 번에 500개까지 준다. 넘으면 `truncated`가 `true`다.
- Web은 처음 들어올 때 위치 권한을 묻지 않는다. 현재 위치 버튼을 누를 때 묻는다. 이전에 허용한 사용자는 다시 묻지 않고 사용한다.
- Map의 상태는 URL로 표현한다: `?filter=food,cafe`, `?place={slug}`. 상태를 바꿀 때 기록을 쌓지 않는다(`replace`).
- 문구는 `web/messages/en.json`에 둔다. 폭에 따른 배치는 768px 기준의 CSS로만 처리한다.
- 검증과 커밋을 한 명령에 묶을 때는 테스트, Lint, 빌드가 모두 통과했을 때만 커밋되게 한다. 파일은 Write 도구로 쓴다.
- 커밋 메시지는 영어, 마지막 줄에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`를 붙인다.

## Review Focus

1. **영역 값이 뒤집혔거나 숫자가 아니다.** `west`가 `east`보다 크거나, `NaN`, `Infinity`, 범위 밖의 값이 오면 500이나 빈 결과가 아니라 어느 값이 틀렸는지 알려주는 400이어야 한다. → Task 1
2. **지도를 빠르게 여러 번 움직인다.** 먼저 보낸 요청이 늦게 도착해 최신 결과를 덮어쓰면 안 된다. 움직일 때마다 요청이 나가도 안 된다. → Task 5
3. **위치 권한을 거부했거나, 서비스 지역 밖(한국)에서 연다.** 지도가 엉뚱한 곳으로 가거나 빈 화면이 되지 않고 Queenstown을 보여주며 이유를 알려야 한다. → Task 6
4. **Marker API가 실패한다.** 지도는 그대로 두고 다시 시도할 수 있는 안내를 보여야 한다. 결과가 없는 것과 실패를 구분해야 한다. → Task 5
5. **토큰이 없거나 WebGL을 쓸 수 없다.** 화면 전체가 깨지지 않고 지도 자리에 안내가 나와야 한다. → Task 5

---

## File Structure

```text
backend/src/main/java/com/queenstownlocal/backend
 ├── common/error/ApiException.java        필드별 오류를 담을 수 있게 한다
 └── map
      ├── MapController.java               GET /api/v1/map/markers
      ├── MapService.java                  영역과 filter 검증, 500개 제한
      ├── MapMapper.java
      ├── PlaceMarker.java
      └── MarkersResponse.java
backend/src/main/resources/mapper/MapMapper.xml

shared/src
 ├── api.ts                                PlaceMarker, MapMarker, MarkersResponse, MapBounds
 └── geo.ts                                distanceMeters, isInServiceArea, formatDistance

web/src
 ├── app/api/v1/[...path]/route.ts         Backend로 전달
 ├── app/page.tsx                          MapScreen을 그린다
 ├── components/map
 │    ├── MapScreen.tsx                    상태를 모으는 컨테이너
 │    ├── MapView.tsx                      mapbox-gl을 다루는 유일한 곳
 │    ├── FilterChips.tsx
 │    ├── PlacePreview.tsx
 │    └── LocateButton.tsx
 └── lib
      ├── api/client.ts                    브라우저에서는 같은 주소를 부른다
      ├── api/map.ts                       getMarkers
      ├── map/filter.ts                    URL의 filter 읽기와 쓰기
      ├── map/geojson.ts                   toFeatureCollection
      ├── map/camera.ts                    지도 위치 저장과 복원
      ├── map/useMarkers.ts                영역이 바뀔 때 Marker를 받는 훅
      └── geo/location.ts                  현재 위치 요청과 판단
```

---

### Task 1: Marker API

**Files:**
- Create: `backend/src/main/java/com/queenstownlocal/backend/map/` 아래 다섯 파일, `backend/src/main/resources/mapper/MapMapper.xml`
- Modify: `backend/src/main/java/com/queenstownlocal/backend/common/error/ApiException.java`, `GlobalExceptionHandler.java`
- Test: `backend/src/test/java/com/queenstownlocal/backend/map/MapMarkersApiTest.java`, `common/error/ErrorResponseTest.java`

**Interfaces:**
- Produces: `ApiException.invalid(String field, String message)` — `VALIDATION_FAILED`이고 응답의 `errors`에 `{ field, message }` 하나가 담긴다. `detail`은 "Validation failed."다.
- Produces: `GET /api/v1/map/markers?west&south&east&north&filter`
- Produces: `record PlaceMarker(String kind, String slug, double latitude, double longitude, String name, String category, String subtype)` — `kind`는 항상 `"place"`
- Produces: `record MarkersResponse(List<PlaceMarker> markers, boolean truncated)`

- [ ] **Step 1: 브랜치를 만들고 계획 문서를 커밋한다**

```bash
git checkout -b feat/map-core
git add docs/plans/2026-10-08-week6-map-core.md
git commit -m "Add week 6 map core plan"
```

- [ ] **Step 2: 실패하는 테스트를 쓴다**

`ErrorResponseTest`에 더한다. `ErrorProbeController`에 `ApiException.invalid("west", "must be less than east")`를 던지는 `GET /probe/invalid`를 더한다.

| 테스트 | 기대 |
|---|---|
| `invalidArgumentNamesTheField` | 400. `code` "VALIDATION_FAILED", `detail` "Validation failed.", `errors[0].field` "west", `errors[0].message` "must be less than east" |

`MapMarkersApiTest`. `@SpringBootTest`, MockMvc, `@Transactional`. 기본 영역은 `west=168.65&south=-45.04&east=168.67&north=-45.02`다.

```java
// a: food, public, (-45.0312, 168.6626)      b: cafe, public, (-45.0322, 168.6610)
// c: shopping, public, Frankton (-45.0195, 168.7320)   d: bar, private, (-45.0313, 168.6627)
// e: facility/toilet, public, (-45.0331, 168.6597)
```

| 테스트 | 요청 | 기대 |
|---|---|---|
| `returnsPublicPlacesInsideTheBox` | 기본 영역 | 200. `markers`의 slug가 a, b, e다(순서 무관). `truncated`는 `false`. |
| `markerHasExactlyTheDocumentedFields` | 기본 영역 | b의 키는 정확히 `kind`, `slug`, `latitude`, `longitude`, `name`, `category`, `subtype`다. `kind` "place", `latitude` -45.0322, `longitude` 168.6610 (오차 1e-6), `subtype`은 키가 있고 `null`. e의 `subtype`은 "toilet". |
| `filterNarrowsByCategory` | `filter=cafe` | b만 |
| `filterAcceptsSeveralCategories` | `filter=food,cafe` | a, b |
| `filterIgnoresKindsWithoutMarkersYet` | `filter=event` / `filter=notice,food` | 빈 배열 / a만 |
| `emptyFilterMeansEverything` | `filter=` | a, b, e |
| `unknownFilterValueIsRejected` | `filter=food,hotel` | 400. `errors[0].field` "filter" |
| `missingEdgeIsRejected` | `west` 없음 | 400. `errors[0].field` "west" |
| `invertedBoxIsRejected` | `west=168.67&east=168.65` / `south=-45.02&north=-45.04` | 400. `errors[0].field`가 각각 "west", "south" |
| `outOfRangeEdgeIsRejected` | `north=91` / `west=-181` | 400. `errors[0].field`가 각각 "north", "west" |
| `nonFiniteEdgeIsRejected` | `west=NaN` / `east=Infinity` | 400. `errors[0].field`가 각각 "west", "east" |
| `truncatesAtFiveHundred` | 기본 영역 안에 Place 501개를 더 넣는다(`generate_series`) | `markers`가 500개, `truncated`는 `true` |

- [ ] **Step 3: 테스트가 실패하는지 확인한다**

Run: `cd backend && ./gradlew test`
Expected: FAIL. `ApiException.invalid`가 없어 컴파일되지 않는다.

- [ ] **Step 4: 구현한다**

- `ApiException`: 필드별 오류 목록을 가진다. `GlobalExceptionHandler`는 `ApiException`에 오류 목록이 있으면 `errors`로 내려준다.
- `MapService.findMarkers(double west, double south, double east, double north, String filter)`: 값이 유한한지, `-180 ≤ west < east ≤ 180`, `-90 ≤ south < north ≤ 90`인지 확인한다. 틀린 값은 `ApiException.invalid`로 알린다. `filter`를 쉼표로 나눠 Category 코드와 `event`, `notice`만 받아들인다. `filter`가 있는데 Category가 하나도 없으면 조회하지 않고 빈 결과를 준다.
- `MapMapper.findPlaceMarkers`: `status = 'public'`이고 영역과 겹치는 Place를 `id` 순으로 501개까지 조회한다. 영역 조건은 `docs/05-erd.md` 8장의 `ST_Intersects`를 쓴다. Category 조건은 목록이 있을 때만 건다.
- 501개가 오면 500개만 주고 `truncated`를 `true`로 한다.

- [ ] **Step 5: 테스트가 통과하는지 확인하고 커밋한다**

Run: `cd backend && ./gradlew test`
Expected: `BUILD SUCCESSFUL`

```bash
git add backend
git commit -m "Add the map markers endpoint"
```

---

### Task 2: 같은 주소로 API 부르기

**Files:**
- Create: `web/src/app/api/v1/[...path]/route.ts`, `web/src/lib/api/map.ts`
- Modify: `web/src/lib/api/client.ts`, `shared/src/api.ts`
- Test: `web/src/app/api/v1/[...path]/route.test.ts`, `web/src/lib/api/client.test.ts`, `web/src/lib/api/client.browser.test.ts`, `web/src/lib/api/map.test.ts`

**Interfaces:**
- Produces (`@queenstown/shared`): `interface MapBounds { west: number; south: number; east: number; north: number }`, `interface PlaceMarker { kind: 'place'; slug: string; latitude: number; longitude: number; name: string; category: Category; subtype: FacilitySubtype | null }`, `type MapMarker = PlaceMarker`, `interface MarkersResponse { markers: MapMarker[]; truncated: boolean }`
- Produces: `apiGet<T>(path: string, options?: { signal?: AbortSignal }): Promise<T>` — 서버에서는 `${API_BASE_URL}/api/v1${path}`, 브라우저에서는 `/api/v1${path}`를 부른다. 취소된 요청은 `ApiError`로 바꾸지 않고 `AbortError` 그대로 거부한다.
- Produces: `getMarkers(bounds: MapBounds, filter: readonly string[], options?: { signal?: AbortSignal }): Promise<MarkersResponse>`
- Produces: `GET /api/v1/{...path}` (Web) — Backend의 같은 경로로 전달한다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`route.test.ts` (`// @vitest-environment node`). `fetch`를 바꾼다.

| 테스트 | 조건 | 기대 |
|---|---|---|
| `forwards the path and query to the backend` | `API_BASE_URL=http://api.test`, `GET /api/v1/map/markers?west=1&filter=food,cafe` | `fetch`가 `http://api.test/api/v1/map/markers?west=1&filter=food,cafe`로 호출된다. |
| `passes the status, body and content type through` | Backend가 404 `application/problem+json` | 응답도 404, 같은 본문, 같은 `Content-Type` |
| `encodes each path segment` | `path`가 `['places', 'a/b c']` | `.../api/v1/places/a%2Fb%20c` |
| `answers 502 when the backend cannot be reached` | `fetch`가 거부 | 502. `application/problem+json`, `code` "INTERNAL_ERROR". 본문에 Backend 주소가 없다. |
| `does not forward the visitor's cookies or authorization` | 요청에 `Cookie`, `Authorization` 헤더 | `fetch`에 넘긴 헤더에 둘 다 없다. |

`client.test.ts`는 맨 위에 `// @vitest-environment node`를 붙여 서버에서의 동작으로 유지한다. 아래를 더한다.

| 테스트 | 기대 |
|---|---|
| `passes the abort signal on` | `apiGet('/x', { signal })` → `fetch`의 옵션에 같은 `signal` |
| `lets an aborted request reject as it is` | `fetch`가 `AbortError`로 거부 → `ApiError`가 아니라 같은 오류로 거부 |

`client.browser.test.ts` (jsdom)

| 테스트 | 기대 |
|---|---|
| `calls the same origin in the browser` | `API_BASE_URL`이 있어도 `fetch`가 `/api/v1/places/x`로 호출된다. |

`map.test.ts`. `apiGet`을 바꾼다.

| 테스트 | 기대 |
|---|---|
| `asks for the box` | `getMarkers({ west: 168.65, south: -45.04, east: 168.67, north: -45.02 }, [])` → `apiGet('/map/markers?west=168.65&south=-45.04&east=168.67&north=-45.02', ...)` |
| `adds the filter when one is chosen` | `['food', 'cafe']` → 끝에 `&filter=food%2Ccafe` |
| `passes the signal on` | 옵션의 `signal`이 `apiGet`에 전달된다. |

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm test -w web`
Expected: FAIL. `./route`와 `./map`을 찾을 수 없고, 브라우저 테스트가 `http://localhost:8080/...`로 호출되어 실패한다.

- [ ] **Step 3: 구현한다**

`route.ts`의 `GET`은 요청의 헤더를 전달하지 않는다. 이번 주의 API는 모두 공개 조회다.

- [ ] **Step 4: 테스트, Lint, 빌드가 통과하는지 확인하고 커밋한다**

Run: `npm test && npm run lint && npm run build -w web`

```bash
git add shared web
git commit -m "Call the API through the web app's own origin"
```

---

### Task 3: 거리와 서비스 지역

**Files:**
- Modify: `shared/src/geo.ts`
- Test: `shared/src/geo.test.ts`

**Interfaces:**
- Produces: `interface LatLng { latitude: number; longitude: number }`
- Produces: `distanceMeters(a: LatLng, b: LatLng): number` — 구면 거리(haversine)
- Produces: `isInServiceArea(point: LatLng): boolean` — `SERVICE_CENTER`에서 `SERVICE_RADIUS_KM` 이내
- Produces: `formatDistance(meters: number): string` — 1km 미만은 10m 단위(`"350 m"`), 10km 미만은 소수 한 자리(`"1.2 km"`), 그 이상은 정수(`"12 km"`)

- [ ] **Step 1: 실패하는 테스트를 쓴다**

```ts
const centre = { latitude: -45.0312, longitude: 168.6626 }
const nearby = { latitude: -45.0322, longitude: 168.661 }     // 약 170m
const frankton = { latitude: -45.0195, longitude: 168.732 }   // 약 5.6km
const seoul = { latitude: 37.5665, longitude: 126.978 }

test('distance matches the values PostGIS gave for the same points', () => {
  expect(distanceMeters(centre, centre)).toBe(0)
  expect(distanceMeters(centre, nearby)).toBeGreaterThan(150)
  expect(distanceMeters(centre, nearby)).toBeLessThan(190)
  expect(distanceMeters(centre, frankton)).toBeGreaterThan(5400)
  expect(distanceMeters(centre, frankton)).toBeLessThan(5800)
})

test('distance is the same in both directions', ...)

test('the service area is 50 km around the centre', () => {
  expect(isInServiceArea(centre)).toBe(true)
  expect(isInServiceArea(frankton)).toBe(true)
  expect(isInServiceArea({ latitude: -45.0312 + 0.44, longitude: 168.6626 })).toBe(true)   // 약 49km
  expect(isInServiceArea({ latitude: -45.0312 + 0.46, longitude: 168.6626 })).toBe(false)  // 약 51km
  expect(isInServiceArea(seoul)).toBe(false)
})

test.each([
  [0, '0 m'], [4, '0 m'], [349.6, '350 m'], [994, '990 m'], [995, '1.0 km'],
  [1234, '1.2 km'], [6449, '6.4 km'], [9949, '9.9 km'], [9950, '10 km'], [12345, '12 km'],
])('formats %d m as %s', (meters, text) => {
  expect(formatDistance(meters)).toBe(text)
})
```

- [ ] **Step 2: 실패를 확인하고, 구현하고, 통과를 확인한 뒤 커밋한다**

Run: `npm test -w shared && npm run typecheck -w shared`

```bash
git add shared
git commit -m "Add distance and service area helpers to shared"
```

---

### Task 4: Filter 칩과 URL

**Files:**
- Create: `web/src/lib/map/filter.ts`, `web/src/components/map/FilterChips.tsx`
- Modify: `web/messages/en.json` (`Map` 추가)
- Test: `web/src/lib/map/filter.test.ts`, `web/src/components/map/FilterChips.test.tsx`

**Interfaces:**
- Consumes: `CATEGORIES`, `Category` (`@queenstown/shared`)
- Produces: `parseFilter(value: string | null): Category[]` — 아는 값만, 중복 없이, `CATEGORIES`의 순서로
- Produces: `serializeFilter(filter: readonly Category[]): string | null` — 비어 있으면 `null`
- Produces: `toggleFilter(filter: readonly Category[], key: Category): Category[]`
- Produces: `FilterChips` — props `{ selected: readonly Category[]; onToggle: (key: Category) => void }`. 칩은 `aria-pressed`를 가진 버튼이고 이름은 `Category` 문구다.
- Produces: `messages/en.json`의 `Map`: `filters` "Filters", `locate` "Show my location", `empty` "No places in this area.", `clearFilters` "Clear filters", `loadFailed` "We couldn't load the map data.", `retry` "Try again", `outsideArea` "You're outside the Queenstown area, so the map stays on Queenstown.", `locationDenied` "Location is turned off for this site. Turn it on in your browser settings to see your position.", `locationUnavailable` "We couldn't find your location.", `notConfigured` "The map isn't available right now.", `viewDetails` "View details", `closePreview` "Close", `truncated` "Zoom in to see every place."

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`filter.test.ts`

| 테스트 | 기대 |
|---|---|
| `reads the filter from the URL value` | `'food,cafe'` → `['food', 'cafe']` |
| `keeps the category order whatever the URL order` | `'cafe,food'` → `['food', 'cafe']` |
| `drops unknown values and repeats` | `'food,hotel,food,,event'` → `['food']` |
| `reads nothing from a missing or empty value` | `null`, `''` → `[]` |
| `writes the filter for the URL` | `['food', 'cafe']` → `'food,cafe'`, `[]` → `null` |
| `toggling adds and removes` | `toggleFilter(['food'], 'cafe')` → `['food', 'cafe']`, `toggleFilter(['food', 'cafe'], 'food')` → `['cafe']` |

`FilterChips.test.tsx`

| 테스트 | 기대 |
|---|---|
| `shows the six category chips in order` | 버튼의 이름이 Food, Cafes, Bars, Activities, Shopping, Facilities 순서다. "Filters"라는 이름의 그룹 안에 있다. |
| `marks the selected chips as pressed` | `selected=['food', 'bar']` → Food와 Bars만 `aria-pressed="true"`, 나머지는 `"false"` |
| `reports the chip that was pressed` | Cafes를 누르면 `onToggle('cafe')`가 한 번 호출된다. |

- [ ] **Step 2: 실패를 확인하고, 구현하고, 통과를 확인한 뒤 커밋한다**

`FilterChips`: 모바일에서는 한 줄로 두고 가로로 넘긴다. 칩의 높이는 44px 이상이다. 배치는 Wireframe `m-map`과 `d-map`을 따른다.

Run: `npm test -w web && npm run lint -w web`

```bash
git add web
git commit -m "Add the map filter chips and their URL form"
```

---

### Task 5: 지도와 Marker, Preview

**Files:**
- Create: `web/src/lib/map/geojson.ts`, `web/src/lib/map/camera.ts`, `web/src/lib/map/useMarkers.ts`
- Create: `web/src/components/map/MapView.tsx`, `PlacePreview.tsx`, `MapScreen.tsx`
- Modify: `web/src/app/page.tsx`, `web/package.json` (`mapbox-gl`), `web/.env.example`
- Test: 각 파일 옆의 `*.test.ts(x)`

**Interfaces:**
- Consumes: `getMarkers` (Task 2), `distanceMeters`, `formatDistance`, `SERVICE_CENTER` (Task 3), `parseFilter`, `serializeFilter`, `toggleFilter`, `FilterChips` (Task 4)
- Produces: `toFeatureCollection(markers: readonly MapMarker[])` — GeoJSON `FeatureCollection`. 좌표는 `[longitude, latitude]`, `properties`는 `slug`, `category`, `subtype`, `label`(Category의 첫 글자를 대문자로, `facility`는 `P`)
- Produces: `interface Camera { latitude: number; longitude: number; zoom: number }`, `DEFAULT_CAMERA`(`SERVICE_CENTER`, `zoom` 14), `loadCamera(): Camera`, `saveCamera(camera: Camera): void` — `sessionStorage`의 `map.camera`. 값이 없거나 깨졌으면 `DEFAULT_CAMERA`
- Produces: `useMarkers(bounds: MapBounds | null, filter: readonly Category[])` → `{ status: 'idle' | 'loading' | 'ready' | 'error'; markers: MapMarker[]; truncated: boolean; retry: () => void }`. 영역이나 필터가 바뀌면 300ms 뒤에 요청하고, 그 사이에 또 바뀌면 앞의 것을 버린다. 진행 중인 요청은 취소한다. 실패해도 직전의 `markers`는 남긴다.
- Produces: `MapView` — props `{ token: string; camera: Camera; markers: readonly MapMarker[]; selectedSlug: string | null; userLocation: LatLng | null; onMove: (bounds: MapBounds, camera: Camera) => void; onSelect: (slug: string | null) => void; onUnavailable: () => void }`. `mapbox-gl`을 import 하는 유일한 파일이다.
- Produces: `PlacePreview` — props `{ marker: PlaceMarker; distanceText: string | null; onClose: () => void }`. 이름, Category 문구, 거리, `/places/{slug}`로 가는 "View details" 링크, "Close" 버튼
- Produces: `MapScreen` (Client Component, props 없음)

- [ ] **Step 1: `mapbox-gl`을 설치하고 `.env.example`에 더한다**

```bash
npm install mapbox-gl -w web
```

`web/.env.example`에 `NEXT_PUBLIC_MAPBOX_TOKEN=`을 더한다. 값은 비워 둔다.

- [ ] **Step 2: 실패하는 테스트를 쓴다**

`geojson.test.ts`

| 테스트 | 기대 |
|---|---|
| `puts longitude first` | `latitude` -45.0322, `longitude` 168.661 → `coordinates`가 `[168.661, -45.0322]` |
| `carries what the layers need` | `properties`가 `{ slug, category, subtype, label }`. `food` → `F`, `cafe` → `C`, `bar` → `B`, `activity` → `A`, `shopping` → `S`, `facility` → `P` |
| `an empty list is an empty collection` | `features`가 `[]` |

`camera.test.ts`

| 테스트 | 기대 |
|---|---|
| `starts on Queenstown` | 저장한 값이 없으면 `{ latitude: -45.0312, longitude: 168.6626, zoom: 14 }` |
| `returns what was saved` | 저장한 값과 같다. |
| `ignores a damaged value` | `sessionStorage`에 `'{"latitude":"x"'` 또는 범위 밖의 값 → `DEFAULT_CAMERA` |

`useMarkers.test.ts`. `getMarkers`를 바꾸고 가짜 타이머를 쓴다.

| 테스트 | 기대 |
|---|---|
| `does nothing without bounds` | `status` "idle", 요청 없음 |
| `waits 300 ms before asking` | 299ms까지 요청이 없고 300ms에 한 번 |
| `asks once after several quick moves` | 100ms 간격으로 영역을 세 번 바꾸면 마지막 영역으로 한 번만 요청한다. |
| `cancels the request it no longer needs` | 요청이 진행 중일 때 영역이 바뀌면 앞 요청의 `signal`이 취소된다. |
| `a late answer does not replace a newer one` | 첫 요청이 두 번째보다 늦게 끝나도 `markers`는 두 번째 결과다. |
| `keeps the markers on screen when a request fails` | 성공 뒤 실패 → `status` "error", `markers`는 직전 결과 |
| `retry asks again for the same box` | `retry()` → 같은 영역으로 다시 요청하고 성공하면 "ready" |
| `asks again when the filter changes` | 필터가 바뀌면 새 필터로 요청한다. |

`PlacePreview.test.tsx`

| 테스트 | 기대 |
|---|---|
| `shows the name, category label and distance` | "Lakeside Kitchen", "Food", "350 m" |
| `links to the place` | "View details" 링크의 `href`가 `/places/lakeside-kitchen` |
| `leaves the distance out when it is unknown` | `distanceText`가 `null`이면 거리 글자가 없다. |
| `Close reports back` | "Close"를 누르면 `onClose`가 호출된다. |

`MapView.test.tsx`. `mapbox-gl`을 가짜 `Map` 클래스로 바꾼다. 가짜는 받은 옵션과 `on`, `addSource`, `addLayer`, `getSource().setData`, `flyTo`, `remove` 호출을 기록한다.

| 테스트 | 기대 |
|---|---|
| `creates the map with the token and the camera` | `accessToken`이 받은 토큰, `center`가 `[longitude, latitude]`, `zoom`이 받은 값 |
| `draws the markers once the map has loaded` | `load` 뒤에 source가 추가되고, 그 데이터가 `toFeatureCollection(markers)`와 같다. |
| `updates the data when the markers change` | `setData`가 새 데이터로 호출된다. |
| `reports the box and camera after a move` | `moveend` → `onMove`가 가짜 `getBounds`의 값으로 호출된다. |
| `reports the marker that was clicked` | Marker layer의 클릭 → `onSelect('lakeside-kitchen')` |
| `clears the selection on a click elsewhere` | 지도의 빈 곳 클릭 → `onSelect(null)` |
| `removes the map when it goes away` | unmount → `remove()` |
| `reports when the map cannot start` | `Map` 생성자가 던지면 `onUnavailable`이 호출되고 오류가 밖으로 나가지 않는다. |

`MapScreen.test.tsx`. `MapView`, `useMarkers`, `next/navigation`을 바꾼다.

| 테스트 | 기대 |
|---|---|
| `shows a notice instead of the map without a token` | 토큰이 없으면 "The map isn't available right now."가 보이고 `MapView`를 그리지 않는다. |
| `reads the filter from the URL` | `?filter=food,cafe` → Food와 Cafes가 눌린 상태이고 `useMarkers`가 `['food', 'cafe']`로 호출된다. |
| `pressing a chip rewrites the URL without adding history` | Bars를 누르면 `router.replace`가 `/?filter=food%2Ccafe%2Cbar` 또는 같은 뜻의 URL로 호출된다. |
| `selecting a marker shows its preview and puts it in the URL` | `onSelect('lakeside-kitchen')` → Preview에 이름이 보이고 URL에 `place=lakeside-kitchen`이 들어간다. |
| `reads the selection from the URL` | `?place=lakeside-kitchen`이고 그 Marker가 결과에 있으면 Preview가 보이고 `MapView`의 `selectedSlug`가 그 값이다. 결과에 없으면 Preview를 그리지 않는다. |
| `closing the preview clears the selection` | "Close" → Preview가 사라지고 URL에서 `place`가 빠진다. |
| `explains an empty area and offers to clear the filters` | `ready`이고 `markers`가 비었고 필터가 있으면 "No places in this area."와 "Clear filters"가 보인다. 누르면 필터가 비워진다. |
| `explains a failed load and offers a retry` | `error` → "We couldn't load the map data."와 "Try again". 누르면 `retry`가 호출된다. |
| `says when not everything is shown` | `truncated` → "Zoom in to see every place." |

- [ ] **Step 3: 테스트가 실패하는지 확인한다**

Run: `npm test -w web`
Expected: FAIL. 새 모듈들을 찾을 수 없다.

- [ ] **Step 4: 구현한다**

- `MapView`: 지도의 스타일은 `mapbox://styles/mapbox/standard`다. `mapbox-gl`은 `useEffect` 안에서 동적으로 import 해서 서버 렌더링에 들어가지 않게 한다. Marker는 GeoJSON source 하나와 layer 세 개(원, 글자, 선택된 Marker의 큰 원)로 그린다. 지도를 움직인 뒤(`moveend`) `onMove`를 부른다.
- `MapScreen`: 배치는 Wireframe을 따른다. 칩은 지도 위, Preview는 767px 이하에서 지도 아래(하단 탭 바로 위), 768px 이상에서 지도의 왼쪽 위에 띄운다. 지도 위치는 `onMove`마다 `saveCamera`로 저장하고 처음 그릴 때 `loadCamera`로 복원한다. Preview의 거리는 현재 위치가 있을 때만 `distanceMeters`와 `formatDistance`로 만든다.
- `page.tsx`: 5주차의 자리 표시(`data-testid="map-area"`)를 `MapScreen`으로 바꾼다. 화면의 제목(`<h1>`)은 화면 낭독기용으로만 남긴다(`sr-only`).

- [ ] **Step 5: 테스트, Lint, 빌드가 통과하는지 확인하고 커밋한다**

Run: `npm test && npm run lint && npm run build -w web`

```bash
git add shared web package.json package-lock.json
git commit -m "Add the map with place markers and the preview card"
```

---

### Task 6: 현재 위치

**Files:**
- Create: `web/src/lib/geo/location.ts`, `web/src/components/map/LocateButton.tsx`
- Modify: `web/src/components/map/MapScreen.tsx`, `web/src/components/map/MapView.tsx`
- Test: `web/src/lib/geo/location.test.ts`, `LocateButton.test.tsx`, `MapScreen.test.tsx`, `MapView.test.tsx`

**Interfaces:**
- Consumes: `isInServiceArea`, `LatLng` (Task 3)
- Produces: `type LocationResult = { status: 'inside'; position: LatLng } | { status: 'outside'; position: LatLng } | { status: 'denied' } | { status: 'unavailable' }`
- Produces: `locate(): Promise<LocationResult>` — `navigator.geolocation.getCurrentPosition`을 `timeout` 10초, `maximumAge` 60초로 부른다.
- Produces: `wasLocationGranted(): Promise<boolean>` — Permissions API가 `granted`일 때만 `true`. API가 없거나 실패하면 `false`.
- Produces: `LocateButton` — props `{ onClick: () => void; busy: boolean }`. 이름은 "Show my location"이고 `busy`이면 `aria-busy`와 `disabled`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`location.test.ts`. `navigator.geolocation`과 `navigator.permissions`를 바꾼다.

| 테스트 | 조건 | 기대 |
|---|---|---|
| `a position in Queenstown is inside` | (-45.0322, 168.661) | `{ status: 'inside', position }` |
| `a position in Seoul is outside` | (37.5665, 126.978) | `{ status: 'outside', position }` |
| `a refused permission is denied` | 오류 코드 1 | `{ status: 'denied' }` |
| `any other failure is unavailable` | 오류 코드 2, 3 | `{ status: 'unavailable' }` |
| `a browser without geolocation is unavailable` | `navigator.geolocation` 없음 | `{ status: 'unavailable' }` |
| `knows when permission was already granted` | `permissions.query` → `granted` / `prompt` / 거부 / API 없음 | `true` / `false` / `false` / `false` |

`MapScreen.test.tsx`에 더한다. `locate`, `wasLocationGranted`를 바꾼다.

| 테스트 | 기대 |
|---|---|
| `does not ask for the location on arrival` | 권한을 허용한 적이 없으면 `locate`가 호출되지 않는다. |
| `uses the location straight away when it was granted before` | `wasLocationGranted` → `true`이면 `locate`가 한 번 호출된다. |
| `the button moves the map to a position inside the area` | `inside` → `MapView`의 `camera`가 그 위치가 되고 `userLocation`이 전달된다. |
| `outside the area the map stays and says why` | `outside` → `camera`가 바뀌지 않고 "You're outside the Queenstown area, so the map stays on Queenstown."가 보인다. `userLocation`은 `null`이다. |
| `a denied permission explains how to turn it on` | `denied` → "Location is turned off for this site. ..."가 보인다. |
| `an unavailable location says so` | `unavailable` → "We couldn't find your location." |
| `the preview shows the distance once the location is known` | `inside`이고 Marker를 선택 → Preview에 거리 글자가 있다. |

`MapView.test.tsx`에 더한다.

| 테스트 | 기대 |
|---|---|
| `shows the visitor's position` | `userLocation`이 있으면 그 좌표(`[longitude, latitude]`)에 표시가 추가되고, `null`이 되면 사라진다. |
| `moves when the camera changes` | `camera` prop이 바뀌면 `flyTo`가 새 위치로 호출된다. |

- [ ] **Step 2: 실패를 확인하고, 구현하고, 통과를 확인한 뒤 커밋한다**

`LocateButton`은 Wireframe대로 지도의 오른쪽 아래에 둔다. 크기는 44px 이상이다.

Run: `npm test && npm run lint && npm run build -w web`

```bash
git add web
git commit -m "Add the current location button and its failure states"
```

---

### Task 7: 실제 지도로 확인하고 문서를 쓴다

**Files:**
- Modify: `web/README.md`, `README.md`, `docs/01-mvp-feature-definition.md` (필요할 때만)

이 작업은 `web/.env.local`에 `NEXT_PUBLIC_MAPBOX_TOKEN`이 있어야 한다. 없으면 여기서 멈추고 요청한다.

- [ ] **Step 1: Backend, DB, Web을 띄우고 Place를 넣는다**

Place 다섯 개를 넣는다: Queenstown 중심 근처에 `food`, `cafe`, `bar` 하나씩, `facility`(`toilet`) 하나, Frankton에 `shopping` 하나.

- [ ] **Step 2: 브라우저에서 확인한다**

| 폭 | 확인 | 기대 |
|---|---|---|
| 375 | `/`을 연다 | 지도가 Queenstown을 보여준다. 위치 권한을 묻지 않는다. Marker 네 개가 보인다(Frankton은 화면 밖). 칩 여섯 개가 지도 위에 있다. 하단 탭이 보인다. 가로 스크롤이 없다. |
| 375 | Cafes 칩을 누른다 | URL이 `?filter=cafe`가 되고 Marker가 하나만 남는다. 네트워크에 `/api/v1/map/markers?...&filter=cafe` 요청이 한 번 나간다. |
| 375 | 칩을 풀고 Marker를 누른다 | Preview가 하단 탭 위에 뜨고 URL에 `place=`가 들어간다. "View details"를 누르면 상세로 간다. 뒤로 가면 같은 위치와 같은 선택으로 돌아온다. |
| 375 | 지도를 Frankton 쪽으로 옮긴다 | 요청이 움직임마다가 아니라 멈춘 뒤 한 번 나가고 Frankton의 Marker가 보인다. |
| 375 | Bars만 켜고 Place가 없는 곳으로 옮긴다 | "No places in this area."와 "Clear filters"가 보인다. |
| 375 | 현재 위치 버튼을 누른다 | 이때 권한을 묻는다. 한국에서는 지도가 움직이지 않고 지역 밖 안내가 보인다. |
| 1200 | `/`을 연다 | 상단 메뉴, 칩 한 줄, 지도. Marker를 누르면 Preview가 지도 왼쪽 위에 뜬다. |
| 375 | Backend를 끄고 지도를 옮긴다 | 지도와 기존 Marker는 그대로이고 "We couldn't load the map data."와 "Try again"이 보인다. Backend를 켜고 누르면 Marker가 다시 온다. |
| 375 | `.env.local`의 토큰을 지우고 다시 띄운다 | 지도 자리에 "The map isn't available right now."가 보이고 탭과 다른 화면은 동작한다. 확인한 뒤 토큰을 되돌린다. |

콘솔에 오류가 없는지 확인한다.

- [ ] **Step 3: 정리하고 문서를 쓴다**

넣은 Place를 지우고 서버와 DB를 멈춘다.

- `web/README.md`: 토큰 설정 방법, 같은 주소로 API를 부르는 구조, `MapView`만 `mapbox-gl`을 다룬다는 점을 적는다.
- `README.md`: Current Status의 Completed에 6주차 Map Core를 더한다.

- [ ] **Step 4: 커밋한다**

```bash
git add web README.md docs
git commit -m "Document the map setup"
```

---

## 범위 밖

6주차에 하지 않는다.

| 항목 | 시점 |
|---|---|
| 검색창과 Search | 7주차. 캘린더는 6주차에 "Search 진입"을 적었지만 갈 화면이 없어 검색과 함께 만든다. |
| Explore 목록, 상세의 "View on map" | 7주차 |
| Event / Notice의 Marker와 칩, Marker의 모양 구분 | 8주차 |
| Marker Clustering (MAP-09), 영업 중 표시 (PLACE-07) | Should. 일정이 남을 때 |
| Category별 아이콘과 지도 색 | 디자인 단계. 이번 주는 글자 한 자로 구분한다. |
| 날짜 변경선을 넘는 영역 | 다루지 않는다. Queenstown은 동경 168도다. |
