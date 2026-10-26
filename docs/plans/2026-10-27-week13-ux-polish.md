# Week 13 UX Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 첫 데이터(OpenStreetMap 498곳)가 들어간 지금, 방문자가 Web과 App에서 바로 느끼는 불편을 줄인다. 영업시간을 읽기 쉽게 하고 "지금 영업 중"을 보여 주며(PLACE-07), 사진이 없는 곳도 알아보기 쉽게, 주소를 채우고, 지도의 Marker를 색과 묶음으로 정리하고(MAP-09), 무료 서버가 깨는 동안 안내하고, App에도 Privacy · Terms · 정보 수정 요청을 넣는다(MORE-02, MORE-03).

**Architecture:** 해석과 판단은 `shared`에 한 번만 둔다(영업시간 해석, 지금 열려 있는지, Category의 색과 이모지, Marker의 GeoJSON 속성). Web과 App은 그것을 그린다. Backend는 Place 목록에 `openingHours`를 더한다. 주소 보완은 seed 스크립트가 한 번 하고 결과를 CSV에 남긴다. App에 새 네이티브 모듈을 넣지 않는다(개발 빌드를 다시 만들 필요가 없다).

**Tech Stack:** 기존 그대로. 지도 묶음은 Mapbox GeoJSON source의 `cluster`(mapbox-gl, @rnmapbox/maps 모두). 주소 보완은 OpenStreetMap Nominatim reverse API.

**Spec:** [docs/01-mvp-feature-definition.md](../01-mvp-feature-definition.md) (PLACE-07, MAP-09, MORE-02, MORE-03), [docs/06-api-specification.md](../06-api-specification.md) Place 필드 표, [docs/04-wireframe.md](../04-wireframe.md) (m-map-place의 Open now, m-place), 12주차에 확인한 데이터: 498곳 중 영업시간 110, 사진 0, 주소가 "Queenstown"뿐인 곳 369.

## Global Constraints

- 시각은 뉴질랜드 시간(`Pacific/Auckland`) 기준이다. 기기의 시간대와 상관없다(지금까지의 Event · Notice와 같다).
- 해석하지 못한 영업시간은 원문 그대로 보이고 배지는 없다. 틀린 "Open now"를 보이는 것보다 안 보이는 쪽이 낫다.
- App에 네이티브 모듈을 더하지 않는다. 문구는 `en.json`(Web, App 각각)에 둔다.
- Nominatim은 초당 1건, User-Agent에 저장소 주소, 결과는 캐시해서 다시 묻지 않는다(사용 정책). 결과도 ODbL이다.
- 공개 API에 필드를 더하는 것만 한다(빼거나 바꾸지 않는다). 커밋 메시지는 영어.

## Review Focus

1. **자정을 넘는 영업과 요일 경계.** `Fr,Sa 16:00-00:00`, `Mo-Th 17:00-02:00`은 다음 날 새벽까지 열려 있다. 토요일 01:00에 금요일 영업이 "Open"이어야 한다. → Task 1
2. **나중 규칙이 앞 규칙을 덮는다.** `Mo-Su 10:00-20:00; Su off`의 일요일은 닫힘이다. → Task 1
3. **기기 시간대가 뉴질랜드가 아닐 때.** 에뮬레이터(GMT)와 한국 시간 PC에서도 뉴질랜드 기준으로 판단한다. → Task 1, Task 6
4. **묶음 속에 고른 장소가 숨는다.** URL로 고른 장소(`/?place=`)는 16단계로 확대되어 묶이지 않고, 묶음을 누르면 그 묶음이 풀리는 단계로 확대된다. → Task 5, Task 6
5. **Nominatim이 엉뚱한 주소를 준다.** 장소와 50m 넘게 떨어진 주소이거나 도로 이름이 없으면 쓰지 않고 "Queenstown"으로 둔다. → Task 8

---

## File Structure

```text
shared/src
 ├── hours.ts            parseOpeningHours, formatWeeklyHours, openStatus (+ hours.test.ts)
 ├── categoryStyle.ts    Category · Event · Notice의 색과 이모지 (+ test)
 └── map/geojson.ts      Marker 속성에 color 추가

backend   PlaceSummary에 openingHours (목록, 검색, Favorites)
web/src
 ├── components/place    PlaceCard · PlaceDetailView: 영업시간 줄과 OpenBadge, 사진 대체
 ├── components/local    Event 카드의 사진 대체
 ├── components/map      MapView: 색 Marker와 묶음, FilterChips: 색 점
 ├── instrumentation.ts  서버가 뜰 때 API를 깨운다
 └── lib/useSlow.ts      오래 걸리는 로딩에 "깨우는 중" 안내
mobile/src
 ├── detail, places      같은 표시(영업시간, 배지, 사진 대체)
 ├── map                 색 Marker와 묶음, 칩의 색 점
 └── app/(tabs)/more     Privacy Policy, Terms. 상세에 Suggest an edit
backend/seed/osm         reverse.mjs(주소 보완) + reverse-cache.json
```

---

### Task 1: 영업시간 해석과 지금 열려 있는지 (shared)

**Interfaces — Produces:**
- `parseOpeningHours(text: string | null): WeeklyHours | null` — `WeeklyHours = { kind: 'always' } | { kind: 'weekly'; days: Interval[][] }`(월=0 … 일=6, 분 단위 `[start, end)`, `end`가 1440을 넘으면 다음 날 새벽까지).
- `formatWeeklyHours(hours: WeeklyHours): string[]` — 같은 시간인 연속 요일(월요일부터)을 묶은 줄: `"Mon - Fri · 9:00 am - 5:00 pm"`, `"Sat · 10:00 am - 2:00 pm, 5:00 pm - 9:00 pm"`, `"Sun · Closed"`. `always`는 `["Open 24 hours"]`.
- `openStatus(hours: WeeklyHours, now: Date): OpenStatus` — `{ state: 'open'; closesAt: string | null; soon: boolean } | { state: 'closed'; opensAt: { day: string | null; time: string } | null }`. `soon`은 30분 안에 닫힘. `day`는 오늘이면 null, 아니면 `"Tue"`.

지원하는 표기: `;`(규칙), 규칙 사이의 `, 요일`, 요일 목록과 범위(`Mo-Fr`, `Mo,We-Su`, `We-Mo`), `off`, 한 규칙의 여러 시간(`11:00-14:00,17:00-21:00`), 요일 없는 시간(매일), `24/7`, 목록 속 `PH`(무시, `PH`뿐인 규칙은 건너뜀). 그 밖(달 `Jun-Oct:`, `17:00+`, 날짜, `sunrise`)은 null.

| 테스트 | 기대 |
|---|---|
| `Mo-Su 10:00-20:30` | 7일 모두 600–1230, 줄 `["Mon - Sun · 10:00 am - 8:30 pm"]` |
| `Mo-Fr 08:00-17:00; Sa-Su 09:00-15:00` | 두 줄 |
| `Mo-Su 10:00-20:00; Su off` | 일요일 닫힘, `"Sun · Closed"` |
| `Fr,Sa 16:00-00:00` | 금 960–1440, 토 01:00은 닫힘(00:00 끝) |
| `Mo-Th 17:00-02:00` | 금요일 01:00(목요일 밤부터)은 open, closesAt `"2:00 am"` |
| `We-Mo 09:00-17:00` | 화요일만 닫힘 |
| `11:00-14:00,17:00-21:00` | 매일 두 구간 |
| `Mo-Fr 08:00-17:00, Sa 09:00-12:00` | 쉼표 뒤 요일은 새 규칙 |
| `PH,Mo-Su 09:00-17:00` | PH 무시 |
| `24/7` | always, 줄 `["Open 24 hours"]`, 항상 open |
| `Jun-Oct: Mo-Su 10:00-16:00`, `Tu-Su 17:00+`, `Mon - Sun · 8:00 am - 10:00 pm`, 빈 값 | null |
| `openStatus`, 뉴질랜드 화 16:45 (NZDT), `Mo-Su 09:00-17:00` | open, soon true, closesAt `"5:00 pm"` |
| 같은 순간을 UTC로 만든 `Date` | 같은 답(기기 시간대 무관) |
| 일 20:00, `Mo-Fr 09:00-17:00` | closed, opensAt `{ day: "Mon", time: "9:00 am" }` |

- [ ] 테스트 → 실패 → 구현(`dates.ts`의 뉴질랜드 시각 함수를 쓴다) → `npm test -w shared` → 커밋

### Task 2: 목록에 영업시간 (Backend, shared 타입, 명세)

- `PlaceSummary`(Java, shared)에 `openingHours: string | null`. `/places`(목록, 검색), `/me/favorites`가 준다. API 명세 Place 필드 표의 `openingHours` 목록 칸을 O로.
- 테스트: `PlaceListApiTest`에 목록 항목의 `openingHours`, `FavoriteApiTest`에 같은 필드.
- [ ] 테스트 → 실패 → 구현 → `./gradlew test`, `npm test -w shared` → 커밋

### Task 3: Web — 영업시간 줄과 배지

- `OpenBadge`(`components/place/OpenBadge.tsx`, client): `openStatus`를 1분마다 다시 계산. 문구: `Open now · until {time}`, `Closes soon · {time}`, `Closed · opens {time}` / `Closed · opens {day} {time}`, `Open 24 hours`. 색: 열림 초록, 곧 닫힘 주황, 닫힘 회색. 서버에서 그린 HTML과 시각이 어긋나지 않게 처음 그릴 때는 비우고 브라우저에서 채운다.
- 상세: Opening hours 칸에 `formatWeeklyHours` 줄들과 배지. 해석 못 하면 원문 한 줄.
- `PlaceCard`(Explore, Search, Favorites): 카테고리 줄 옆에 배지(해석된 곳만).

| 테스트 | 기대 |
|---|---|
| 상세, `Mo-Fr 08:00-17:00; Sa off` | 줄 `Mon - Fri · 8:00 am - 5:00 pm`, `Sat - Sun · Closed`(규칙에 없는 날은 닫힘. 같은 시간인 연속 요일만 묶는다) |
| 상세, 해석 못 하는 값 | 원문 그대로, 배지 없음 |
| `OpenBadge`, 시각을 고정(`vi.setSystemTime`) | 네 가지 문구 |
| 카드 | 해석된 곳만 배지 |

- [ ] 테스트 → 실패 → 구현 → `npm test -w web`, lint, build → 브라우저(375px, 데스크톱) → 커밋

### Task 4: Category 색과 사진 대체 (shared, Web)

- `categoryStyle(kind: { category: Category; subtype: FacilitySubtype | null } | 'event' | 'notice'): { color: string; emoji: string }`. 색: food `#c2410c`, cafe `#92400e`, bar `#7c3aed`, activity `#15803d`, shopping `#be185d`, facility `#1d4ed8`, event `#0e7490`, notice `#b45309`(모두 흰 글자와 대비 4.5:1 이상). 이모지: 🍽️ ☕ 🍸 🏞️ 🛍️, facility는 하위 유형별 🚻 🅿️ ℹ️ 📚 ⚕️ 📍, event 🎉, notice ⚠️.
- Web: 사진이 없거나 못 불러오면 회색 대신 그 색의 옅은 배경(10%)에 이모지(카드는 크게, 상세는 사진 칸을 낮게). Event 카드도 같게. 필터 칩(지도, Explore)에 색 점.
- 테스트: `categoryStyle` 표, 대비 4.5:1 이상 확인(상대 휘도 계산), 카드의 대체 이미지(이모지와 `aria-hidden`), 칩의 색 점.
- [ ] 테스트 → 실패 → 구현 → 테스트, lint → 브라우저 → 커밋

### Task 5: Web 지도 — 색 Marker와 묶음 (MAP-09)

- `toFeatureCollection`의 속성에 `color`. Marker는 그 색으로 채우고 흰 글자, 흰 테두리. 고른 Marker는 크게, 검은 테두리.
- source에 `cluster: true`, `clusterRadius: 44`, `clusterMaxZoom: 15`. 묶음은 검은 원에 흰 숫자(개수에 따라 18 / 22 / 26px). 누르면 `getClusterExpansionZoom`의 단계로 이동. 묶음은 Place, Event, Notice를 모두 센다.
- 테스트: `toFeatureCollection`의 `color`(shared). 지도는 브라우저에서 확인: 시내가 묶음으로, 묶음을 누르면 풀림, `/?place=`로 고른 곳은 묶이지 않음.
- [ ] 테스트 → 실패 → 구현 → 브라우저 확인 → 커밋

### Task 6: App — 영업시간, 배지, 사진 대체, 색 Marker와 묶음

- Task 3 ~ 5를 App에: 상세의 영업시간 줄과 배지, `PlaceRow`의 배지와 사진 대체, Event 행, 칩의 색 점, `ShapeSource`의 `cluster`와 묶음 레이어, 묶음을 누르면 `getClusterExpansionZoom`으로 확대.
- 테스트(Jest): 상세와 행의 배지, 대체 이미지, 칩의 색 점. 에뮬레이터(GMT)에서: 시내 묶음과 풀림, 고른 장소, 배지가 뉴질랜드 시각 기준.
- [ ] 테스트 → 실패 → 구현 → `npm test -w mobile`, typecheck, lint → 에뮬레이터 → 커밋

### Task 7: App — Privacy Policy, Terms, Suggest an edit (MORE-02, MORE-03)

- More: Favorites 아래에 Privacy Policy, Terms(IA 순서). 누르면 Web의 `/privacy`, `/terms`를 브라우저로(`webUrl`).
- Place 상세: 출처 줄 아래 Suggest an edit(`mailto:`, Web과 같은 제목과 본문). 주소는 `EXPO_PUBLIC_CONTACT_EMAIL`, 없으면 숨김. `mobile/.env.example`에 추가.
- 테스트: More의 두 줄과 열리는 주소, 상세의 링크(있을 때, 없을 때).
- [ ] 테스트 → 실패 → 구현 → 에뮬레이터 → 커밋

### Task 8: 주소 보완 (seed, Nominatim)

- `backend/seed/osm/reverse.mjs`: `places.csv`에서 주소가 `Queenstown`인 OpenStreetMap 장소마다 `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=..&lon=..&zoom=18&addressdetails=1`. 초당 1건, 결과는 `reverse-cache.json`(source_url → 응답의 필요한 부분)에 두고 다시 묻지 않는다. 주소를 바꾼 CSV를 쓴다.
- `addressFromReverse(result, place): string | null`(mapping.mjs): `house_number road, suburb|town|city`. 도로 이름이 없거나 결과 좌표가 장소와 50m 넘게 떨어지면 null.
- `fetch-places.mjs`가 다시 가져올 때도 캐시로 주소를 채운다.
- 테스트(`node --test`): 번지가 있는 결과, 도로만 있는 결과, 도로 없음, 60m 떨어진 결과. `SeedDataTest`가 새 CSV를 그대로 적재.
- [ ] 테스트 → 실패 → 구현 → 실행(약 6분) → 남은 "Queenstown" 개수를 커밋 메시지에 → 로컬 적재 → 커밋

### Task 9: 서버가 깨는 동안 (Web, App)

- Web `instrumentation.ts`의 `register()`: Node 서버가 뜰 때 `API_BASE_URL/actuator/health`를 기다리지 않고 한 번 부른다(Render에서 Web이 깨면 API도 같이 깨기 시작). `wakeBackend(fetch, base)`로 분리해 테스트.
- `useSlow(active: boolean, afterMs = 5000): boolean`(Web, App 각각): 로딩이 5초를 넘으면 true. 지도(Marker 로딩), Explore 목록, App 상세의 로딩 화면에 "Waking up the server… This can take up to a minute." 실패하면 지금처럼 다시 시도 버튼.
- 테스트: `wakeBackend`가 health를 부르고 실패를 삼킨다, `useSlow`가 5초 뒤 true(가짜 타이머), 지도와 목록의 안내 문구.
- [ ] 테스트 → 실패 → 구현 → 테스트 → 커밋

### Task 10: 확인과 문서

- [ ] 전체 테스트(Backend, shared, web, admin, mobile, seed), lint, typecheck, build.
- [ ] 로컬 서버 구성으로 `test:local`, `test:smoke`(S1의 지도 링크가 묶음과 함께 동작).
- [ ] 브라우저(375px, 데스크톱)와 에뮬레이터 화면을 비교 캡처: 지도, Explore, 상세.
- [ ] 문서: README Current Status 13주차, 기능 정의의 PLACE-07 · MAP-09 · MORE-02/03(App) 구현 표시, web · mobile README의 새 환경 변수(`EXPO_PUBLIC_CONTACT_EMAIL`).
- [ ] 커밋 → (묻고) push, PR, 병합.

---

## 범위 밖

| 항목 | 시점 |
|---|---|
| App Local 탭(APP-01), 계정 삭제 | App 테스트 배포 준비 때 |
| 주변 장소(PLACE-08), 검색 결과 지도(SEARCH-03), "영업 중" 필터 | 다음 |
| Marker의 그림 아이콘(이미지), 장소 사진 | 사진 저장소를 정할 때 |
| 공휴일(PH)을 반영한 영업 판단 | 뉴질랜드 공휴일 자료를 넣을 때 |
