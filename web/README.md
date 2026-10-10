# Web

Queenstown Local Platform의 Web이다. 데스크톱과 모바일 브라우저가 같은 코드를 쓴다.

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4
- next-intl (화면 문구)
- Vitest, Testing Library

화면 구조와 URL은 [Information Architecture v1](../docs/02-information-architecture.md), 배치는 [Wireframe v1](../docs/04-wireframe.md), API는 [API Specification v1](../docs/06-api-specification.md)을 기준으로 한다.

## 필요한 것

- Node 24
- Place 상세처럼 데이터를 쓰는 화면은 Backend가 떠 있어야 한다. [backend/README.md](../backend/README.md)를 본다.

## 설치

저장소 루트에서 한 번 실행한다. `shared`와 `web`이 함께 설치된다.

```bash
npm install
```

## 실행

```bash
npm run dev -w web
```

`http://localhost:3001`로 뜬다. 3000번이 아니라 3001번을 쓴다.

API 주소는 환경 변수 `API_BASE_URL`에서 읽는다. 없으면 `http://localhost:8080`을 쓴다. 값을 바꾸려면 `web/.env.example`을 `web/.env.local`로 복사해 수정한다.

### 지도 토큰

Map 화면의 지도는 Mapbox의 공개 토큰(`pk.`로 시작한다)이 있어야 뜬다. `web/.env.local`에 넣는다. 이 파일은 커밋하지 않는다.

```text
NEXT_PUBLIC_MAPBOX_TOKEN=pk.…
```

- 토큰이 없으면 Map 화면은 지도 자리에 "The map isn't available right now."를 보여준다. 다른 화면은 그대로 동작한다.
- 이 값은 빌드할 때 브라우저용 코드에 들어간다. 값을 바꾸면 `npm run dev`를 다시 띄우거나 다시 빌드한다.
- 브라우저에 그대로 보이는 값이다. Mapbox 계정에서 이 토큰을 쓸 수 있는 URL을 서비스 주소로 제한해 둔다.

배포 형태로 확인할 때:

```bash
npm run build -w web
npm run start -w web
```

## 테스트와 Lint

```bash
npm test -w web
npm run lint -w web
```

저장소 루트에서 `npm test`와 `npm run lint`를 실행하면 `shared`까지 함께 돈다.

## 구조

```text
messages/en.json          화면 문구. 컴포넌트에 문구를 직접 쓰지 않는다.
src/app                   화면 (URL과 같은 구조)
src/app/api/v1/[...path]  브라우저의 API 요청을 Backend로 전달한다.
src/components            화면 조각
src/components/map        Map 화면. MapView만 mapbox-gl을 다룬다.
src/lib/api               API 호출. 모든 실패를 ApiError로 바꾼다.
src/lib/map               Map의 로직: URL의 filter, 영역, Marker 요청, 지도 위치 저장
src/lib/geo               현재 위치 요청과 서비스 지역 판단
src/lib/format.ts         날짜, URL, 전화번호 표시
src/i18n/request.ts       next-intl 설정
src/test/render.tsx       테스트에서 문구와 함께 렌더링하는 도우미
```

테스트 파일은 대상 파일 옆에 `*.test.ts(x)`로 둔다. 비동기 페이지(`page.tsx`)는 얇게 두고, 내용은 테스트할 수 있는 동기 컴포넌트와 함수에 둔다.

## 알아 둘 것

- **브라우저는 Backend를 직접 부르지 않는다.** 서버에서 그리는 화면(Place 상세)은 `API_BASE_URL`의 Backend를 바로 부른다. 브라우저에서 부르는 API(지도의 Marker)는 이 사이트의 `/api/v1/...`를 부르고, `app/api/v1/[...path]/route.ts`가 같은 경로와 query를 Backend로 전달한다. 그래서 Backend에 CORS 설정이 없고, Backend의 주소가 브라우저에 드러나지 않는다. `apiGet`이 어느 쪽인지 알아서 고른다. 전달하는 것은 GET뿐이고 방문자의 쿠키와 `Authorization`은 넘기지 않는다. 로그인이 필요한 API가 생기면(11주차) 이 부분을 다시 정한다.
- **`mapbox-gl`은 `components/map/MapView.tsx`만 다룬다.** 지도 SDK는 테스트 환경에서 돌지 않으므로, SDK 없이 정할 수 있는 것은 모두 `lib/map`의 함수와 훅에 두고 테스트한다. `MapView`의 테스트는 SDK를 가짜 지도로 바꿔 무엇을 요청하는지만 본다. 실제 지도는 브라우저에서 확인한다. SDK는 지도를 그릴 때 따로 내려받으므로 다른 화면의 첫 로딩에 들어가지 않는다.
- **좌표의 순서는 `lib/map/geojson.ts`에서만 바꾼다.** API와 화면의 타입은 `latitude`, `longitude`이고 GeoJSON과 Mapbox는 `[longitude, latitude]`다.
- **Map의 상태는 URL에 있다.** 선택한 칩과 Place는 `/?filter=food,cafe&place={slug}`로 표현한다. 바꿀 때는 `history.replaceState`를 쓴다. 기록이 쌓이지 않고 서버에 요청이 가지 않으며, Next.js가 `useSearchParams`를 맞춰 준다. 지도의 위치는 URL이 아니라 탭의 `sessionStorage`에 둔다. 상세 화면에서 돌아오면 같은 위치가 보인다.
- **지도를 움직이면 멈춘 뒤 0.3초 후에 Marker를 한 번 요청한다.** 필요 없어진 요청은 취소한다. 실패하면 화면의 Marker는 그대로 두고 다시 시도할 수 있게 한다. Marker는 한 번에 500개까지 온다.
- **위치 권한은 현재 위치 버튼을 누를 때 묻는다.** 이전에 허용한 방문자는 들어오자마자 자기 위치와 거리를 보지만, 지도는 버튼을 눌러야 그 위치로 움직인다. 공유받은 링크나 상세에서 돌아온 화면이 보던 곳을 벗어나지 않게 하기 위해서다. 위치는 서버로 보내지 않는다.
- **`@types/geojson`은 `mapbox-gl`의 타입 때문에 있다.** `mapbox-gl`의 타입이 이 패키지를 전제로 하면서 의존성으로 두지 않는다. 지우면 지도의 Feature에 `properties`가 없다는 타입 오류가 난다.
- **기준 폭은 768px 하나다.** 767px 이하는 하단 탭, 768px 이상은 상단 메뉴를 보여준다. 폭에 따른 표시는 CSS(`md:`)로만 처리한다. 서버가 만드는 HTML은 모든 기기에 같고, 숨긴 쪽은 `display: none`이라 키보드와 화면 낭독기에 잡히지 않는다. 메뉴 항목은 `components/nav/menu.ts` 한곳에서 정의한다.
- **화면 높이는 `dvh`를 쓰고 하단 탭은 safe area만큼 띄운다.** 모바일 브라우저의 주소창과 홈 표시줄에 가리지 않게 하기 위해서다.
- **상세 화면의 "Back"은 사이트 안에서만 움직인다.** 이 사이트의 이전 화면이 있으면 그곳으로 돌아가고, 검색 결과에서 바로 들어온 경우에는 Explore로 간다. 브라우저의 Navigation API로 판단하며, 지원하지 않는 브라우저에서는 항상 Explore로 간다.
- **날짜는 뉴질랜드 시간으로 표시한다.** 서버나 방문자의 시간대와 관계없이 `Pacific/Auckland` 기준이다.
- **루트에 `loading.tsx`를 두지 않는다.** 두면 응답이 먼저 시작되어 없는 Place가 404가 아니라 200으로 응답한다. 상세 화면은 검색에 노출되므로 상태 코드가 정확해야 한다. 로딩 안내가 필요한 화면에는 그 화면의 폴더에만 둔다.
- **오류 화면의 "Try again"은 `retry()`를 쓴다.** `reset()`은 오류 화면만 다시 그리고 서버에서 데이터를 다시 받지 않는다.
- **next-intl은 4.12에 고정하고 `@swc/core`를 1.15로 맞춘다.** 루트 `package.json`의 `overrides`에 있다. 더 새로운 next-intl은 `@swc/core` 1.16을 요구하는데, 1.16의 네이티브 모듈은 `AppData` 아래 캐시 폴더에 다른 계정의 쓰기 권한이 있으면 로딩을 거부한다. 개발 PC가 그 경우에 해당해 빌드가 실패했다. 올릴 때는 두 값을 함께 바꾸고 `npm run build -w web`으로 확인한다.
