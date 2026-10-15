# Week 9 App Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Android 에뮬레이터에서 App을 열면 Map / Explore / More 탭이 있고, Map 탭에 Queenstown 지도가 뜨며, 보이는 영역의 Place가 Category별 Marker로 나오고, 내 위치를 보고 버튼으로 돌아온다. App은 Web과 같은 Backend API를 쓴다.

**Architecture:** 저장소 루트의 npm workspaces에 `mobile`(Expo SDK 57, expo-router)을 더한다. 지도는 `@rnmapbox/maps`라 Expo Go에서는 돌지 않고 Development Build가 필요하다. 지도 SDK 없이 정할 수 있는 지도 로직(GeoJSON 변환, 영역, 필터, 선택)은 지금 `web/src/lib/map`에 있는데, 이것을 `shared`로 옮겨 Web과 App이 함께 쓴다. App의 API 호출은 Backend를 바로 부른다(브라우저가 아니므로 CORS가 없다).

**Tech Stack:** Expo SDK 57 (React Native 0.86, React 19.2.3), expo-router, @rnmapbox/maps 10 (Mapbox Maps SDK v11), expo-location, use-intl, jest-expo, @testing-library/react-native

**Spec:** [docs/01-mvp-feature-definition.md](../01-mvp-feature-definition.md) (NAV-02, MAP-01 ~ MAP-03 App), [docs/02-information-architecture.md](../02-information-architecture.md) 2장 App, 4장 App, [docs/03-user-flow.md](../03-user-flow.md) "Web과 App의 차이", [docs/04-wireframe.md](../04-wireframe.md) (a-map, a-explore). 캘린더 9주차의 완료 기준은 "실기기/에뮬레이터에서 핵심 흐름 실행"이다.

## 사전 확인 (2026-10-15)

- `expo` 57.0.29, `@rnmapbox/maps` 10.3.8, `expo-router` 57.0.27, `expo-location` 57.0.21가 최신이다.
- `@rnmapbox/maps`는 Expo Go에서 쓸 수 없다. Mapbox의 다운로드용 비밀 토큰은 더 이상 필요 없다(plugin의 `RNMapboxMapsDownloadToken`은 deprecated). 공개 토큰(`pk.`)만 있으면 된다.
- **React 버전이 둘이다.** Web은 React 19.3.0, Expo SDK 57은 19.2.3이다. 저장소 복사본에 `mobile`을 workspace로 더해 시험했다: `react-native`는 루트로 올라가고 `mobile/node_modules/react`가 19.2.3으로 따로 생긴다. `expo export --platform android`의 번들에는 React가 19.2.3 하나만 들어가고 `@queenstown/shared`의 코드도 들어간다. JS 번들은 문제없다. **네이티브 빌드(autolinking)는 Android SDK가 있는 PC에서 Task 1에서 확인한다.**

## Global Constraints

- 이번 주의 확인은 Android 에뮬레이터로만 한다(실기기는 없다). Windows에서는 iOS Simulator를 쓸 수 없다(macOS 전용).
- App은 Web과 같은 API를 쓴다. 주소는 `EXPO_PUBLIC_API_BASE_URL`이고 기본값은 `http://10.0.2.2:8080`이다. 에뮬레이터 안의 `localhost`는 에뮬레이터 자신이고, `10.0.2.2`가 PC를 가리킨다.
- 개발 빌드에서만 http를 허용한다(Android는 기본으로 막는다). 배포 빌드는 https만 쓴다.
- Mapbox 공개 토큰은 `EXPO_PUBLIC_MAPBOX_TOKEN`이다. `mobile/.env.local`에 두고 커밋하지 않는다. 토큰이 없으면 지도 대신 안내를 보여준다.
- 위치 권한은 처음 실행할 때 묻는다(Web과 다르다, docs/03-user-flow.md). 거부하거나 서비스 지역 밖이면 Queenstown을 보여주고 이유를 알린다.
- 지도 로직은 `shared`에 있고 Web과 App이 같은 함수를 쓴다. 좌표의 순서를 바꾸는 곳은 `toFeatureCollection` 한 곳뿐이다.
- 문구는 `mobile/src/messages/en.json`에 둔다. 탭 이름 등 Web과 같은 문구는 같은 키를 쓴다.
- 누르는 대상은 44pt 이상이다.
- 검증과 커밋을 한 명령에 묶을 때는 테스트, Lint, 타입 검사가 모두 통과했을 때만 커밋되게 한다(`&&`).
- 커밋 메시지는 영어, 마지막 줄에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`를 붙인다.

## Review Focus

1. **React가 두 벌 들어간다.** 번들이나 네이티브 빌드에서 19.3.0이 섞이면 실행 즉시 오류가 난다. → Task 1
2. **에뮬레이터가 Backend에 닿지 않는다.** `localhost`는 에뮬레이터 자신이다. 주소가 틀렸거나 http가 막혔을 때 빈 지도가 아니라 다시 시도할 수 있는 안내가 나와야 한다. → Task 3, Task 6
3. **지도를 빠르게 움직인다.** Web과 같이 멈춘 뒤 한 번만 요청하고, 늦게 온 답이 새 답을 덮지 않아야 한다. → Task 6
4. **위치 권한을 거부했거나 한국에서 연다.** 지도가 엉뚱한 곳으로 가지 않고 Queenstown을 보여주며 이유를 알린다. → Task 5
5. **Web이 깨진다.** 지도 로직을 `shared`로 옮긴 뒤에도 Web의 테스트, 빌드, 화면이 그대로여야 한다. → Task 2

---

## File Structure

```text
shared/src/map
 ├── geojson.ts             toFeatureCollection, toLngLat (web/src/lib/map에서 옮긴다)
 ├── bounds.ts              toMapBounds, wrapLongitude
 ├── filter.ts              FILTER_KEYS, parseFilter, toggleFilter, filterHides
 └── selection.ts           keyOf, parseKey, readSelection, writeSelection

mobile
 ├── app.config.ts          이름, package id, plugin, 개발 빌드에서만 http 허용 (android/는 생성물이라 커밋하지 않는다)
 ├── src/app/_layout.tsx    use-intl Provider, 탭
 ├── src/app/(tabs)/_layout.tsx Map / Explore / More 탭 (NAV-02)
 ├── src/app/(tabs)/index.tsx   Map
 ├── src/app/(tabs)/explore.tsx 10주차까지 자리만
 ├── src/app/(tabs)/more.tsx    About으로 가는 목록
 ├── src/messages/en.json
 ├── src/api/client.ts      apiGet (EXPO_PUBLIC_API_BASE_URL), ApiError
 ├── src/api/map.ts         getMarkers
 ├── src/map/MapScreen.tsx  상태를 모으는 컨테이너
 ├── src/map/MapView.tsx    @rnmapbox/maps를 다루는 유일한 곳
 ├── src/map/useMarkers.ts  영역이 바뀔 때 Marker를 받는 훅 (Web과 같은 규칙)
 ├── src/geo/location.ts    expo-location 권한과 현재 위치
 └── README.md              개발 빌드, 에뮬레이터 실행, 환경 변수
```

---

### Task 1: mobile workspace와 개발 빌드

- `create-expo-app`(blank-typescript)으로 `mobile`을 만들고 루트 `workspaces`에 더한다. 이름은 `@queenstown/mobile`, `@queenstown/shared`를 의존성으로 둔다.
- expo-router, @rnmapbox/maps, expo-location, expo-dev-client, expo-build-properties를 `npx expo install`로 더한다(SDK 57과 맞는 버전).
- `app.config.ts`: 이름 "Queenstown Local", `android.package` / `ios.bundleIdentifier` `com.queenstownlocal.app`, plugin 설정, 개발 빌드에서만 cleartext 허용(`APP_VARIANT=production`이면 막는다). `android/`, `ios/`는 생성물이라 커밋하지 않는다.
- jest-expo, @testing-library/react-native, ESLint(eslint-config-expo). 루트 `npm test`, `npm run lint`가 `mobile`까지 돈다.
- 확인: `npx expo export --platform android` 번들에 React 19.2.3 하나. **PC에서** `npx expo run:android`로 에뮬레이터에 빌드가 설치되고 빈 화면이 뜬다. Web의 `npm test`, `next build`가 그대로 통과한다.

### Task 2: 지도 로직을 shared로 옮긴다

- `web/src/lib/map`의 `geojson.ts`, `bounds.ts`, `filter.ts`, `selection.ts`와 그 테스트를 `shared/src/map`으로 옮기고 Web의 import를 바꾼다. 동작은 바꾸지 않는다.
- `useMarkers`는 React 훅이라 Web과 App이 각자 둔다(규칙은 같다: 0.3초 settle, 이전 요청 취소).
- 확인: shared, web의 테스트, lint, 타입 검사, `next build`.

### Task 3: App의 API client

| 테스트 | 기대 |
|---|---|
| `callsTheConfiguredBackend` | `EXPO_PUBLIC_API_BASE_URL` + `/api/v1/...` |
| `problemDetailsBecomeApiError` | Web의 `ApiError`와 같은 code, status, errors |
| `networkFailureIsNetworkError` | `NETWORK_ERROR`, status 0 |
| `abortedRequestIsNotAnError` | 취소는 abort error 그대로 |

Web의 `client.ts` 중 응답을 읽는 부분(Problem Details → `ApiError`)은 `shared`로 옮겨 함께 쓰는 것을 검토한다.

### Task 4: 탭 내비게이션 (NAV-02)

- Map / Explore / More 3개 탭(docs/02-information-architecture.md 4장 App, Local은 Should).
- Explore는 "Coming soon" 자리(10주차). More는 About 항목 하나와 About 화면(Web과 같은 문구).
- 테스트: 탭 3개가 순서대로 있고, 누르면 그 화면이 나온다.

### Task 5: 지도와 현재 위치 (MAP-01, MAP-02)

- Queenstown 중심(`SERVICE_CENTER`), zoom 14로 연다. Web과 같은 Mapbox 스타일(`mapbox://styles/mapbox/standard`).
- 처음 실행할 때 위치 권한을 묻는다. 허용하고 서비스 지역 안이면 내 위치(LocationPuck)를 보이고 그곳으로 간다. 거부, 지역 밖, 실패는 Web의 문구로 알린다.
- 오른쪽 아래 현재 위치 버튼(a-map).
- 테스트: `@rnmapbox/maps`와 `expo-location`을 바꿔 권한 결과마다 카메라와 안내를 확인한다. 토큰이 없으면 지도 대신 안내.

### Task 6: 영역의 Place Marker (MAP-03)

- 지도가 멈추면(`onMapIdle`) 보이는 영역으로 `GET /map/markers`를 부른다. 이번 주는 Place만(`filter`에 Category 6개를 넣는다).
- `ShapeSource` + `CircleLayer` + `SymbolLayer`. 모양과 글자는 Web과 같다(`shared`의 `toFeatureCollection`).
- 실패하면 지도는 그대로 두고 "Try again" 안내, 결과가 없으면 "No places in this area.", 500개를 넘으면 "Zoom in to see every place."
- Marker를 누르면 무엇이 일어나는지는 10주차(Preview, Event / Notice Marker)다.

### Task 7: 에뮬레이터에서 확인하고 문서를 쓴다

에뮬레이터의 위치는 Extended controls → Location에서 정한다.

| 확인 | 기대 |
|---|---|
| 처음 실행, 위치를 Queenstown(-45.0312, 168.6626)으로 두고 허용 | 내 위치가 보이고 지도가 그곳에 있다. |
| 위치를 서울로 바꾸고 현재 위치 버튼 | 지도는 Queenstown에 남고 지역 밖 안내가 나온다. |
| 앱 정보에서 위치 권한을 끄고 다시 연다 | Queenstown이 보이고 권한 안내가 나온다. |
| 지도를 움직인다 | 멈춘 뒤 Marker가 바뀐다. |
| Backend를 끈다 | 지도는 그대로, 다시 시도 안내. 켜고 누르면 Marker가 온다. |
| 탭 이동, More → About | 동작한다. |
| 화면 회전, 앱을 백그라운드로 보냈다가 돌아온다 | 지도와 Marker가 남아 있다. |

`mobile/README.md`: 필요한 것(Android Studio, JDK 17, 에뮬레이터 만들기), 환경 변수, 개발 빌드와 실행, 에뮬레이터의 위치 바꾸기, 자주 나는 오류(주소, http, Metro 연결). 루트 README의 Current Status에 9주차.

---

## 범위 밖

| 항목 | 시점 |
|---|---|
| Explore 목록, Place 상세, 검색, Preview, Event / Notice Marker | 10주차 (App Core) |
| 실기기 확인 | 12주차 App 테스트 배포 전에 한다. Android는 USB 로컬 빌드나 EAS Build의 APK로 된다. |
| iOS 빌드, iOS Simulator | Windows에서는 안 된다. macOS나 EAS Build와 Apple Developer 계정이 필요하다. |
| Local 탭 (APP-01) | Should |
| 스토어 배포 | 12주차 |

## PC에서 준비할 것

- **Android Studio**: Android SDK와 에뮬레이터. Device Manager에서 에뮬레이터를 하나 만든다(Google Play가 있는 최근 API 이미지).
- **JDK 17**: Android Studio에 들어 있는 JBR을 `JAVA_HOME`으로 써도 된다.
- **환경 변수**: `ANDROID_HOME`(SDK 경로)과 `platform-tools`를 `PATH`에.
- 네이티브 빌드(`npx expo run:android`)는 PC에서만 된다. 이 클라우드 환경에는 Android SDK가 없어서, 코드와 테스트, JS 번들(`expo export`)까지는 여기서 확인하고 에뮬레이터 실행은 PC에서 한다.
