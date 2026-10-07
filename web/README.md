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
src/components            화면 조각
src/lib/api               API 호출. 모든 실패를 ApiError로 바꾼다.
src/lib/format.ts         날짜, URL, 전화번호 표시
src/i18n/request.ts       next-intl 설정
src/test/render.tsx       테스트에서 문구와 함께 렌더링하는 도우미
```

테스트 파일은 대상 파일 옆에 `*.test.ts(x)`로 둔다. 비동기 페이지(`page.tsx`)는 얇게 두고, 내용은 테스트할 수 있는 동기 컴포넌트와 함수에 둔다.

## 알아 둘 것

- **기준 폭은 768px 하나다.** 767px 이하는 하단 탭, 768px 이상은 상단 메뉴를 보여준다. 폭에 따른 표시는 CSS(`md:`)로만 처리한다. 서버가 만드는 HTML은 모든 기기에 같고, 숨긴 쪽은 `display: none`이라 키보드와 화면 낭독기에 잡히지 않는다. 메뉴 항목은 `components/nav/menu.ts` 한곳에서 정의한다.
- **화면 높이는 `dvh`를 쓰고 하단 탭은 safe area만큼 띄운다.** 모바일 브라우저의 주소창과 홈 표시줄에 가리지 않게 하기 위해서다.
- **상세 화면의 "Back"은 사이트 안에서만 움직인다.** 이 사이트의 이전 화면이 있으면 그곳으로 돌아가고, 검색 결과에서 바로 들어온 경우에는 Explore로 간다. 브라우저의 Navigation API로 판단하며, 지원하지 않는 브라우저에서는 항상 Explore로 간다.
- **날짜는 뉴질랜드 시간으로 표시한다.** 서버나 방문자의 시간대와 관계없이 `Pacific/Auckland` 기준이다.
- **루트에 `loading.tsx`를 두지 않는다.** 두면 응답이 먼저 시작되어 없는 Place가 404가 아니라 200으로 응답한다. 상세 화면은 검색에 노출되므로 상태 코드가 정확해야 한다. 로딩 안내가 필요한 화면에는 그 화면의 폴더에만 둔다.
- **오류 화면의 "Try again"은 `retry()`를 쓴다.** `reset()`은 오류 화면만 다시 그리고 서버에서 데이터를 다시 받지 않는다.
- **next-intl은 4.12에 고정하고 `@swc/core`를 1.15로 맞춘다.** 루트 `package.json`의 `overrides`에 있다. 더 새로운 next-intl은 `@swc/core` 1.16을 요구하는데, 1.16의 네이티브 모듈은 `AppData` 아래 캐시 폴더에 다른 계정의 쓰기 권한이 있으면 로딩을 거부한다. 개발 PC가 그 경우에 해당해 빌드가 실패했다. 올릴 때는 두 값을 함께 바꾸고 `npm run build -w web`으로 확인한다.
