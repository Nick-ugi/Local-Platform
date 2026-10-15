# Mobile

Queenstown Local Platform의 App이다. Web과 같은 Backend API를 쓴다.

- Expo SDK 57 (React Native 0.86, React 19.2), TypeScript
- Expo Router (탭과 화면)
- @rnmapbox/maps (Mapbox 지도), expo-location (현재 위치)
- use-intl (화면 문구, Web의 next-intl과 같은 방식)
- Jest (jest-expo), React Native Testing Library 13

화면 구조는 [Information Architecture v1](../docs/02-information-architecture.md)의 App, 배치는 [Wireframe v1](../docs/04-wireframe.md)의 a-map, a-explore를 기준으로 한다.

## Expo Go로는 열 수 없다

지도(`@rnmapbox/maps`)에 네이티브 코드가 있어서 Expo Go 앱에서는 돌지 않는다. 이 앱의 **개발 빌드**(development build)를 에뮬레이터에 설치해서 쓴다. 한 번 설치하면 코드를 고칠 때마다 다시 빌드할 필요는 없다(JS는 Metro가 바로 보내준다). 네이티브 설정(`app.config.ts`, 네이티브 라이브러리)을 바꿨을 때만 다시 빌드한다.

## 필요한 것 (Windows)

- Node 24
- **Android Studio**: Android SDK와 에뮬레이터
  - Device Manager에서 에뮬레이터를 하나 만든다. Google Play가 있는 최근 API 이미지를 고른다.
- **JDK 17**: Android Studio에 들어 있는 JBR을 써도 된다(`C:\Program Files\Android\Android Studio\jbr`).
- 환경 변수
  - `JAVA_HOME`: JDK 경로
  - `ANDROID_HOME`: SDK 경로(보통 `%LOCALAPPDATA%\Android\Sdk`)
  - `PATH`에 `%ANDROID_HOME%\platform-tools`
- Backend가 떠 있어야 Marker가 나온다. [backend/README.md](../backend/README.md)를 본다.

iOS는 macOS에서만 빌드할 수 있다. Windows에서는 iOS Simulator도 쓸 수 없다.

## 설치

저장소 루트에서 한 번 실행한다. `shared`, `web`, `mobile`이 함께 설치된다.

```bash
npm install
```

새 Expo 라이브러리는 `mobile`에서 `npx expo install <이름>`으로 더한다. SDK 57과 맞는 버전을 고른다.

## 환경 변수

`mobile/.env.example`을 `mobile/.env.local`로 복사해 값을 넣는다. 이 파일은 커밋하지 않는다.

| 이름 | 기본값 | 뜻 |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | `http://10.0.2.2:8080` | Backend 주소. 에뮬레이터 안의 `localhost`는 에뮬레이터 자신이고, `10.0.2.2`가 PC다. |
| `EXPO_PUBLIC_MAPBOX_TOKEN` | 없음 | Mapbox 공개 토큰(`pk.`). Web과 같은 것을 쓴다. 없으면 지도 자리에 "The map isn't available right now."가 나온다. |
| `EXPO_PUBLIC_SITE_URL` | `http://localhost:3001` | Web의 주소. 상세의 Share는 App이 아니라 이 주소의 Web 페이지를 공유한다. |

- 값은 JS를 묶을 때 들어간다. 바꾸면 `npm start`를 다시 띄운다.
- `EXPO_PUBLIC_`으로 시작하는 값은 앱 안에 그대로 보인다. 비밀 값을 넣지 않는다.
- Mapbox의 다운로드용 비밀 토큰은 필요 없다.

## 실행

에뮬레이터를 먼저 켠다(Android Studio → Device Manager → ▶). 그다음 `mobile`에서:

```bash
# 처음, 그리고 네이티브 설정을 바꿨을 때: 개발 빌드를 만들어 에뮬레이터에 설치하고 연다
npm run android

# 그 뒤로는: Metro만 띄운다. 에뮬레이터의 앱이 여기에 붙는다
npm start
```

`npm run android`는 `android/` 폴더를 `app.config.ts`에서 만들어 빌드한다. 처음에는 Gradle이 내려받는 것이 많아 오래 걸린다. `android/`는 생성물이라 커밋하지 않고, 손으로 고치지 않는다(설정은 `app.config.ts`에).

개발 빌드에서만 Backend를 http로 부를 수 있다(`usesCleartextTraffic`). 배포용 빌드는 `APP_VARIANT=production`으로 만들고 https만 쓴다.

### 에뮬레이터의 위치 바꾸기

에뮬레이터 옆의 `⋯`(Extended controls) → Location에서 위도와 경도를 넣고 **Set location**을 누른다.

- Queenstown 중심: `-45.0312`, `168.6626`
- 서비스 지역 밖을 볼 때: 서울 `37.5665`, `126.9780`

위치를 바꿨는데 앱이 "We couldn't find your location."이라고 하면 에뮬레이터가 아직 새 위치를 내주지 않은 것이다. 에뮬레이터의 Google 지도를 한 번 열어 위치가 잡히는 것을 보고 돌아와 위치 버튼을 누른다. 빠른 설정의 Location이 켜져 있는지도 본다.

### 자주 나는 문제 (Windows)

| 보이는 것 | 이유와 할 일 |
|---|---|
| `Missing script: "android"` | 저장소 루트에서 실행했다. `mobile`에서 실행한다. |
| `SDK location not found`, `adb`를 찾지 못함 | `ANDROID_HOME`이 없다. 시스템 환경 변수에 `%LOCALAPPDATA%\Android\Sdk`를 넣고 터미널(VS Code는 VS Code 자체)을 다시 연다. 지금 창에서만 쓰려면 PowerShell에서 `$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"`. |
| PowerShell에서 `&&`가 안 된다 | Windows PowerShell 5는 `&&`를 모른다. 명령을 한 줄씩 실행한다. |
| "The map isn't available right now." | `mobile/.env.local`에 `EXPO_PUBLIC_MAPBOX_TOKEN`이 없다. 넣고 `npx expo start --dev-client --clear`. |
| "We couldn't load the map data." | 앱이 Backend에 닿지 못했다. DB(`docker compose up -d db`)와 Backend(`gradlew.bat bootRun`)를 켠다. `bootRun`은 서버가 도는 동안 `80% EXECUTING`에 머문다. 정상이다. |
| "No places in this area." | Backend는 응답했고 그 영역에 공개된 Place가 없다. `backend/seed`의 CSV를 채워 올린다([backend/README.md](../backend/README.md)). |
| 공유한 주소가 `localhost:3001`이다 | `EXPO_PUBLIC_SITE_URL`이 없다. 배포 전에는 그대로 둔다. |

## 테스트와 Lint

```bash
npm test -w mobile
npm run lint -w mobile
npm run typecheck -w mobile
```

저장소 루트에서 `npm test`와 `npm run lint`를 실행하면 `shared`, `web`과 함께 돈다.

## 구조

```text
app.config.ts             이름, package id(com.queenstownlocal.app), plugin, 개발 빌드의 http 허용
src/app                   화면 (Expo Router: 파일이 곧 화면이다. 테스트를 여기에 두지 않는다)
src/app/(tabs)            Map / Explore / More 탭
src/app/search.tsx        Search (?q=), 탭 위에 쌓인다
src/app/places, events, notices   상세 ([slug].tsx), 탭 위에 쌓인다
src/api                   API 호출 (Backend를 바로 부른다)
src/map                   Map 탭: 칩, Marker, 요약 카드, "View on map". MapView만 @rnmapbox/maps를 다룬다.
src/places                Explore와 Search의 가까운 순 목록 (usePlaceList)
src/detail                Place / Event / Notice 상세와 그 상태(로딩, 다시 시도, 없음)
src/links                 전화, 웹사이트, 길찾기, 공유 (Linking, Share)
src/geo                   위치 권한과 현재 위치. App 전체가 VisitorPositionProvider로 같은 답을 쓴다.
src/auth                  로그인, 가입, Favorite. Refresh Token은 expo-secure-store에 둔다.
src/local                 Notice의 유형, Official, 기간
src/ui                    칩, 검색창, 상태 안내, 이미지, 색
src/i18n, src/messages    화면 문구
```

## 알아 둘 것

- **11주차에 네이티브 모듈(`expo-secure-store`)이 들어왔다.** 그 전의 개발 빌드에는 없으므로 `npm run android`로 한 번 다시 빌드한다. 그 뒤로는 Metro만 띄우면 된다.
- **로그인은 기기에 남는다.** Refresh Token은 기기의 보안 저장소에, Access Token은 메모리에만 둔다. 앱을 껐다 켜도 로그인되어 있다. Log out은 서버의 Refresh Token도 무효로 만든다.
- **하트를 누르다 로그인하러 가면** 로그인한 뒤 돌아와 저장까지 끝난다(m-login 1번).

- **React가 두 벌이다.** App은 Expo SDK 57의 React 19.2.3, Web은 19.3.0을 쓴다. npm은 App의 것을 `mobile/node_modules`에, Web의 것을 루트에 둔다. Metro는 App의 것을 고르고 번들에는 하나만 들어간다. Jest는 Node처럼 찾으므로 `jest.config.js`에서 `react`를 App의 것으로 보낸다. React Native는 React의 버전이 정확히 맞아야 하므로 `react-test-renderer`도 `19.2.3`에 고정한다.
- **지도 SDK 없이 정할 수 있는 것은 `shared`에 있다.** GeoJSON 변환, 영역, Marker의 key는 Web과 같은 함수(`shared/src/map`)를 쓴다. Marker 요청 훅(`src/map/useMarkers.ts`)은 Web의 것과 규칙이 같다.
- **위치 권한은 App이 시작할 때 한 번 묻는다.** Web은 버튼을 누를 때 묻는다(docs/03-user-flow.md, "Web과 App의 차이"). Map과 Explore는 같은 답을 쓴다(`VisitorPositionProvider`). 서비스 지역 밖이거나 거부했으면 지도는 Queenstown에 남고, Explore는 Queenstown 중심에서 가까운 순이며 거리가 없다.
- **Map의 상태는 URL이 아니라 화면에 있다.** Web은 필터와 선택을 URL에 두지만, App의 Map 탭은 상세가 위에 쌓여도 살아 있으므로 그대로 남는다. "View on map"만 `/?place=`(`event`, `notice`)로 Map 탭에 와서 그 Marker를 고르고 파라미터를 지운다.
- **Local 탭은 없다(Should).** Notice와 Event는 지도의 칩과 Marker로 들어간다.
- **날짜와 링크 규칙은 `shared`에 있다.** 일시와 기간(`formatEventWhen`, `noticePeriod`), 걸 수 있는 전화번호와 열 수 있는 URL(`telHref`, `httpUrl`), 검색어(`normalizeQuery`)는 Web과 같은 함수다.
- **React Native의 `URLSearchParams`는 브라우저의 것과 다르다.** 일부 메서드가 없다. 쿼리는 손으로 만든다(`src/api/map.ts`).
- **테스트는 React Native Testing Library 13이다.** Expo Router의 `renderRouter`가 13의 동기 `render`를 전제로 한다. npm이 Expo Router용으로 루트에 14를 깔지만, `jest.config.js`가 App의 13으로 보낸다.
- **이 환경의 프록시에서는 `npx expo install`이 Expo 서버에 닿지 못할 수 있다.** 그때는 `node_modules/expo/bundledNativeModules.json`의 버전으로 `npm install -w mobile`한다.
