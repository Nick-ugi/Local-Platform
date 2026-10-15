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

검색엔진과 공유 링크에 쓰는 canonical 주소와 `og:url`은 `SITE_URL`(사이트의 공개 주소)을 기준으로 만든다. 없으면 `http://localhost:3001`이다. 배포할 때는 반드시 넣는다.

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
src/components/place      Explore 목록, Place 카드와 상세, 빠른 행동과 공유
src/components/local      Notices / Events 목록과 상세
src/components/search     검색창과 검색 결과
src/lib/api               API 호출. 모든 실패를 ApiError로 바꾼다.
src/lib/map               Marker 요청 훅과 지도 위치 저장. 지도 SDK 없는 로직(GeoJSON, 영역, filter, 선택)은 shared/src/map에 있다.
src/lib/geo               현재 위치 요청과 서비스 지역 판단, 방문자의 위치(Map과 목록이 함께 쓴다)
src/lib/places            목록의 URL(Category, 검색어, 쪽)과 목록 읽기
src/lib/local             Notices / Events 목록의 URL(type, when)과 목록 읽기
src/lib/dates.ts          Event의 일시, Notice의 기간 (뉴질랜드 시간)
src/lib/seo               상세 화면의 metadata (검색엔진, 공유 링크), sitemap.xml의 항목
src/lib/share.ts          공유 또는 링크 복사
src/lib/site.ts           사이트의 공개 주소 (SITE_URL)
src/lib/format.ts         날짜, URL, 전화번호, 길찾기 링크
src/i18n/request.ts       next-intl 설정
src/test/render.tsx       테스트에서 문구와 함께 렌더링하는 도우미
```

테스트 파일은 대상 파일 옆에 `*.test.ts(x)`로 둔다. 비동기 페이지(`page.tsx`)는 얇게 두고, 내용은 테스트할 수 있는 동기 컴포넌트와 함수에 둔다.

## 알아 둘 것

- **브라우저는 Backend를 직접 부르지 않는다.** 서버에서 그리는 화면(Place 상세)은 `API_BASE_URL`의 Backend를 바로 부른다. 브라우저에서 부르는 API(지도의 Marker)는 이 사이트의 `/api/v1/...`를 부르고, `app/api/v1/[...path]/route.ts`가 같은 경로와 query를 Backend로 전달한다. 그래서 Backend에 CORS 설정이 없고, Backend의 주소가 브라우저에 드러나지 않는다. `apiGet`이 어느 쪽인지 알아서 고른다. 전달하는 것은 GET뿐이고 방문자의 쿠키와 `Authorization`은 넘기지 않는다. 로그인이 필요한 API가 생기면(11주차) 이 부분을 다시 정한다.
- **`mapbox-gl`은 `components/map/MapView.tsx`만 다룬다.** 지도 SDK는 테스트 환경에서 돌지 않으므로, SDK 없이 정할 수 있는 것은 모두 `shared/src/map`의 함수와 `lib/map`의 훅에 두고 테스트한다. `shared/src/map`은 App도 쓴다. `MapView`의 테스트는 SDK를 가짜 지도로 바꿔 무엇을 요청하는지만 본다. 실제 지도는 브라우저에서 확인한다. SDK는 지도를 그릴 때 따로 내려받으므로 다른 화면의 첫 로딩에 들어가지 않는다.
- **좌표의 순서는 `shared/src/map/geojson.ts`에서만 바꾼다.** API와 화면의 타입은 `latitude`, `longitude`이고 GeoJSON과 Mapbox는 `[longitude, latitude]`다.
- **Map의 상태는 URL에 있다.** 선택한 칩과 Place는 `/?filter=food,cafe&place={slug}`로 표현한다. 바꿀 때는 `history.replaceState`를 쓴다. 기록이 쌓이지 않고 서버에 요청이 가지 않으며, Next.js가 `useSearchParams`를 맞춰 준다. 지도의 위치는 URL이 아니라 탭의 `sessionStorage`에 둔다. 상세 화면에서 돌아오면 같은 위치가 보인다.
- **지도를 움직이면 멈춘 뒤 0.3초 후에 Marker를 한 번 요청한다.** 필요 없어진 요청은 취소한다. 실패하면 화면의 Marker는 그대로 두고 다시 시도할 수 있게 한다. Marker는 한 번에 500개까지 온다.
- **위치 권한은 현재 위치 버튼을 누를 때 묻는다.** 이전에 허용한 방문자는 들어오자마자 자기 위치와 거리를 보지만, 지도는 버튼을 눌러야 그 위치로 움직인다. 공유받은 링크나 상세에서 돌아온 화면이 보던 곳을 벗어나지 않게 하기 위해서다. 목록(Explore, Search)도 "Use my location"을 누를 때 묻는다.
- **목록의 상태는 URL에 있고 위치는 없다.** Category는 경로(`/explore/cafe`), 검색어와 쪽은 query(`/search?q=pizza`, `?page=2`)다. 서버가 Queenstown 중심 기준으로 목록을 먼저 그리고, 위치를 쓸 수 있는 브라우저에서만 같은 쪽을 위치 기준으로 다시 받아 바꾼다. 늦게 온 답은 버리고, 실패하면 서버가 그린 목록을 그대로 둔다.
- **방문자의 위치는 반올림해 API에만 보낸다.** 소수 넷째 자리(약 11m)로 반올림하고, 서비스 지역 밖이면 보내지 않는다. 화면의 URL과 로그에는 넣지 않는다.
- **"View on map"은 지도의 위치를 미리 저장한다.** 누르면 그 Place의 좌표를 지도 위치로 저장하고 `/?place={slug}`로 간다. 지도는 그 위치에서 열려 Preview가 뜬다. 공유받은 링크처럼 저장 없이 들어오면 Map 화면이 Place를 찾아 그곳으로 옮긴다.
- **지도의 Marker는 `kind`와 `slug`로 구분한다.** slug는 종류마다 따로 고유해서 Place와 Event가 같은 slug를 가질 수 있다. 지도는 `place:market`, `event:market` 같은 key로 Marker를 고르고(`shared/src/map/selection.ts`), URL에는 `?place=`, `?event=`, `?notice=` 중 하나만 둔다. 필터는 Category와 `event`, `notice`다(`shared/src/map/filter.ts`).
- **링크가 가리키는 Event와 Notice가 지도에 없으면 따로 찾는다.** Place와 같은 규칙이다. 끝난 Event와 Notice, 위치가 없는 Notice는 지도에 그릴 수 없으므로 URL에서 지운다.
- **Event와 Notice의 시각은 뉴질랜드 시간으로 표시한다.** `lib/dates.ts`가 하루짜리, 여러 날, 끝이 없는 경우를 나눈다. 자정에 끝나는 Event는 그날 저녁의 것으로 본다.
- **끝난 Event와 Notice의 상세는 200이다.** 종료 안내를 보여주고 `robots`를 `noindex`로 한다. 목록, 지도, sitemap.xml에서는 빠진다.
- **sitemap.xml과 robots.txt는 요청할 때마다 만든다.** 빌드할 때 Backend가 없어도 되고, Backend가 실패하면 sitemap.xml은 고정 페이지만 준다.
- **Place의 값은 믿지 않는다.** 웹사이트와 이미지는 `http(s)`만 링크와 그림이 된다. 숫자로 걸 수 없는 전화번호는 글자로만 보인다. 열리지 않는 이미지는 자리를 남기지 않는다. 서버가 그린 이미지가 hydration 전에 실패하면 `onError`가 오지 않으므로 `PlaceImage`가 처음 그릴 때 한 번 더 확인한다.
- **`@types/geojson`은 `mapbox-gl`의 타입 때문에 있다.** `mapbox-gl`의 타입이 이 패키지를 전제로 하면서 의존성으로 두지 않는다. 지우면 지도의 Feature에 `properties`가 없다는 타입 오류가 난다.
- **기준 폭은 768px 하나다.** 767px 이하는 하단 탭, 768px 이상은 상단 메뉴를 보여준다. 폭에 따른 표시는 CSS(`md:`)로만 처리한다. 서버가 만드는 HTML은 모든 기기에 같고, 숨긴 쪽은 `display: none`이라 키보드와 화면 낭독기에 잡히지 않는다. 메뉴 항목은 `components/nav/menu.ts` 한곳에서 정의한다.
- **화면 높이는 `dvh`를 쓰고 하단 탭은 safe area만큼 띄운다.** 모바일 브라우저의 주소창과 홈 표시줄에 가리지 않게 하기 위해서다.
- **상세 화면의 "Back"은 사이트 안에서만 움직인다.** 이 사이트의 이전 화면이 있으면 그곳으로 돌아가고, 검색 결과에서 바로 들어온 경우에는 Explore로 간다. 브라우저의 Navigation API로 판단하며, 지원하지 않는 브라우저에서는 항상 Explore로 간다.
- **날짜는 뉴질랜드 시간으로 표시한다.** 서버나 방문자의 시간대와 관계없이 `Pacific/Auckland` 기준이다.
- **루트에 `loading.tsx`를 두지 않는다.** 두면 응답이 먼저 시작되어 없는 Place가 404가 아니라 200으로 응답한다. 상세 화면은 검색에 노출되므로 상태 코드가 정확해야 한다. 로딩 안내가 필요한 화면에는 그 화면의 폴더에만 둔다.
- **오류 화면의 "Try again"은 `retry()`를 쓴다.** `reset()`은 오류 화면만 다시 그리고 서버에서 데이터를 다시 받지 않는다.
- **next-intl은 4.12에 고정하고 `@swc/core`를 1.15로 맞춘다.** 루트 `package.json`의 `overrides`에 있다. 더 새로운 next-intl은 `@swc/core` 1.16을 요구하는데, 1.16의 네이티브 모듈은 `AppData` 아래 캐시 폴더에 다른 계정의 쓰기 권한이 있으면 로딩을 거부한다. 개발 PC가 그 경우에 해당해 빌드가 실패했다. 올릴 때는 두 값을 함께 바꾸고 `npm run build -w web`으로 확인한다.
