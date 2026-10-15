# Week 10 App Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App에서 S1 ~ S3 시나리오가 끝까지 된다. 지도에서 칩을 골라 Marker → 요약 카드 → 상세 → 전화 / 웹사이트 / 길찾기 / 공유에 닿고, Explore와 검색에서 가까운 순 목록으로 상세에 들어가며, Event와 Notice의 Marker와 상세를 보고 "View on map"으로 지도에 돌아온다. 위치 권한을 거부해도 같은 흐름이 Queenstown 중심으로 동작한다.

**Architecture:** 9주차의 `mobile` 위에 쌓는다. 화면 규칙은 Web(8주차까지)과 같고, 플랫폼과 상관없는 것(날짜와 기간 표시, 링크로 쓸 수 있는 URL과 전화번호, 지도의 필터와 선택)은 `shared`에 두어 Web과 App이 같은 함수를 쓴다. 상세 화면은 탭 위에 쌓이는 Stack 화면이다(docs/02-information-architecture.md 4장 App). 위치는 App이 처음 실행할 때 한 번 묻고, Map과 Explore가 같은 결과를 쓴다.

**Tech Stack:** Expo SDK 57 (React Native 0.86, React 19.2.3), expo-router, @rnmapbox/maps 10, expo-location, use-intl, jest-expo, @testing-library/react-native 13. 새 의존성은 없다(공유는 React Native의 `Share`, 외부 앱은 `Linking`).

**Spec:** [docs/01-mvp-feature-definition.md](../01-mvp-feature-definition.md) 8장 10주차 (MAP-04 ~ MAP-08, PLACE-01 ~ PLACE-06, SEARCH-01 ~ SEARCH-02, EVENT-03 ~ EVENT-05, NOTICE-02 ~ NOTICE-05, COMMON-01 ~ COMMON-02, COMMON-04 ~ COMMON-05, MORE-01 App), [docs/02-information-architecture.md](../02-information-architecture.md) 2장 App, 4장 "화면 간 이동", [docs/03-user-flow.md](../03-user-flow.md) "Web과 App의 차이", 상태 안내 표, [docs/04-wireframe.md](../04-wireframe.md) (a-map, a-explore, 상세는 m-place, m-event, m-notice).

## Global Constraints

- 9주차의 제약을 그대로 따른다: Android 에뮬레이터로만 확인한다, API는 `EXPO_PUBLIC_API_BASE_URL`, 문구는 `mobile/src/messages/en.json`(Web과 같은 문구는 같은 키), 누르는 대상은 44pt 이상, 커밋 메시지는 영어.
- **Local 탭(APP-01)은 Should라 만들지 않는다.** App에서 Notice와 Event는 지도의 칩과 Marker로 들어간다(a-map 3번).
- 날짜와 기간은 언제나 뉴질랜드 시간이다. Web과 같은 함수(`shared`)로 만든다.
- 외부로 나가는 링크는 http(s)만 연다. 전화번호는 걸 수 있는 모양일 때만 Call이 생긴다(Web과 같은 규칙).
- 공유는 기기의 공유 화면으로 **Web의 URL**을 보낸다(docs/03-user-flow.md "Web과 App의 차이"). Web의 주소는 `EXPO_PUBLIC_SITE_URL`이다.
- 길찾기는 기기의 지도 앱을 연다. Android는 `geo:`, iOS는 Apple 지도, 열 수 없으면 Google Maps 웹 주소.
- 거리는 위치가 서비스 지역 안일 때만 보인다. 지역 밖이거나 거부했으면 목록은 Queenstown 중심에서 가까운 순이고 거리는 숨긴다(COMMON-01).

## Review Focus

1. **지도의 선택이 꼬인다.** 칩을 바꿔 선택한 Marker가 가려지면 카드가 닫혀야 하고, 상세에서 "View on map"으로 오면 그 Marker가 영역 밖이어도 지도가 그곳으로 가서 카드를 연다. 끝난 Event나 위치 없는 Notice는 카드를 열지 않는다. → Task 3, Task 4
2. **목록을 끝까지 내린다.** 다음 쪽을 두 번 부르거나, 이전 조건의 답이 새 목록에 붙으면 안 된다. 위치가 늦게 와도 목록이 한 번만 바뀐다. → Task 5
3. **위치를 거부했거나 한국에서 연다.** Map은 Queenstown에 있고, Explore는 Queenstown 중심 순이며 거리가 없다. 안내는 한 번만 나온다. → Task 2, Task 5
4. **Backend가 꺼졌거나 없는 slug.** 모든 화면이 빈 화면이 아니라 다시 시도 안내를, 상세는 없는 항목 안내와 Map / Explore로 가는 길을 보인다(COMMON-02). → Task 5 ~ Task 8
5. **Web이 깨진다.** 날짜와 URL 함수를 `shared`로 옮긴 뒤에도 Web의 테스트, 빌드, 화면이 그대로다. → Task 1

---

## File Structure

```text
shared/src
 ├── dates.ts               formatEventWhen, noticePeriod (web/src/lib/dates.ts에서 옮긴다)
 └── format.ts              formatDate, displayUrl, httpUrl, telHref (web/src/lib/format.ts에서)

mobile/src
 ├── app/_layout.tsx        Provider(문구, 위치), Stack: (tabs), search, places/[slug], events/[slug], notices/[slug], about
 ├── app/(tabs)/index.tsx   Map (?place= ?event= ?notice=)
 ├── app/(tabs)/explore.tsx Explore
 ├── app/search.tsx         Search (?q=)
 ├── app/places/[slug].tsx  Place Detail
 ├── app/events/[slug].tsx  Event Detail
 ├── app/notices/[slug].tsx Notice Detail
 ├── api/places.ts, events.ts, notices.ts, detail.ts
 ├── geo/VisitorPosition.tsx  처음 실행할 때 위치를 묻고 Map과 Explore에 나눠 준다
 ├── map/FilterChips.tsx, MarkerPreview.tsx, SearchBar.tsx(Map과 Explore가 같이 쓴다)
 ├── places/PlaceList.tsx, PlaceRow.tsx, usePlaceList.ts, CategoryChips.tsx
 ├── detail/useDetail.ts, DetailState.tsx, PlaceDetailView.tsx, EventDetailView.tsx, NoticeDetailView.tsx
 └── links/actions.ts       전화, 웹사이트, 길찾기, 공유 (Linking, Share)
```

---

### Task 1: 날짜와 링크 함수를 shared로 옮긴다

- `web/src/lib/dates.ts`, `web/src/lib/format.ts`(`directionsUrl` 포함)와 그 테스트를 `shared/src`로 옮기고 Web의 import를 바꾼다. 동작은 바꾸지 않는다.
- 확인: shared, web의 테스트, lint, 타입 검사, `next build`. App의 Jest에서 같은 함수가 뉴질랜드 시간으로 나온다.

### Task 2: 위치를 App 전체가 함께 쓴다, 상세 API

- `VisitorPositionProvider`: 처음 실행할 때 한 번 `locate()`. `position`(서비스 지역 안일 때만), `problem`(outside, denied, unavailable), `locating`, `request()`. Map의 현재 위치 버튼과 Explore가 같은 값을 쓴다.
- Map은 9주차와 같이 동작한다(안이면 그곳으로, 아니면 Queenstown과 안내).
- API: `getPlaces({ category, q, position, page })`, `getPlace`, `getEvent`, `getNotice`. 상세는 404와 400을 "없음"(null)으로 돌려준다(Web의 `getDetail`과 같다). 쿼리는 손으로 만든다.

| 테스트 | 기대 |
|---|---|
| 처음 열 때 한 번만 묻는다 | 탭을 오가도 `locate`는 한 번 |
| 지역 밖 | `position`은 null, `problem`은 outside |
| `request()`가 다시 묻는다 | 새 결과로 바뀐다. 실패하면 이전 위치를 버린다 |
| `getPlaces` | `category`, `q`, `lat`/`lng`(소수 넷째 자리), `page`가 쿼리에 |
| `getPlace` 404 | null |

### Task 3: 칩, 모든 종류의 Marker, 선택과 요약 카드 (MAP-04 ~ MAP-07)

- `FilterChips`: Category 6개, Events, Notices. 가로로 스크롤. 아무것도 고르지 않으면 모두(Web과 같은 `toggleFilter`).
- Marker는 Place, Event, Notice 모두(필터가 비면 `filter` 없이 요청). 선택한 Marker는 채운 원으로 크게(Web과 같은 모양).
- Marker를 누르면 아래에서 카드가 올라온다(a-map 2번): Place는 이름, Category, 거리. Event는 제목, 일시, 장소. Notice는 유형, Official, 제목, 기간. "View details"로 상세. 닫기 버튼과 아래로 끌어내리기로 닫는다. 지도의 빈 곳을 눌러도 닫힌다.
- 칩을 바꿔 선택한 Marker가 가려지면 카드를 닫는다. 결과가 없고 칩이 켜져 있으면 "Clear filters".
- 테스트: MapView를 바꿔 `onSelect`를 부르고 카드의 내용, 상세로 가는 링크, 닫기, 칩이 가렸을 때 닫힘, 거리(위치가 있을 때만).

### Task 4: 지도의 검색창과 "View on map" (MAP-08, PLACE-06, EVENT-04, NOTICE-04)

- 지도 위의 검색창(a-map)을 누르면 Search 화면.
- `/?place=slug`(`event`, `notice`)로 오면 그 Marker를 고르고 지도가 그곳(zoom 16)으로 간다. 지도의 답에 없으면 상세 API로 따로 찾는다(Web의 `lookUp`과 같은 규칙: 없거나 끝났거나 위치가 없으면 카드를 열지 않는다). 칩이 그것을 가리면 칩을 푼다. 처리한 뒤 파라미터를 지운다.
- 테스트: 파라미터로 열면 카메라와 카드, 끝난 Event는 카드 없음, 칩이 풀림.

### Task 5: Explore (PLACE-01 ~ PLACE-03, COMMON-01, COMMON-02)

- a-explore: 검색창, 칩(All + Category 6개), "Nearest first", 목록(이미지, 이름, Category · 거리, 주소). 행을 누르면 Place Detail.
- 위치가 있으면 그곳에서 가까운 순과 거리, 없으면 Queenstown 중심 순이고 거리가 없다. 위치의 안내(지역 밖, 거부)는 목록 위에 한 줄.
- 끝까지 내리면 다음 쪽(20개씩). 첫 쪽은 로딩 표시, 실패하면 "Try again", 결과가 없으면 Category에 맞는 문구.
- `usePlaceList(query, position)`: 조건이나 위치가 바뀌면 처음부터, 이전 요청은 취소, 다음 쪽은 한 번에 하나.
- 이미지가 없거나 열리지 않으면 회색 자리.

| 테스트 | 기대 |
|---|---|
| 위치 없음 | `lat`/`lng` 없이 요청, 거리 없음 |
| 위치 있음 | 그 위치로 요청, 거리 "350 m" |
| 칩 Cafes | `category=cafe`로 처음부터 |
| 끝에서 다음 쪽 | 2쪽이 붙는다, 두 번 불러도 한 번 |
| 늦게 온 이전 답 | 버린다 |
| 실패 | 안내와 다시 시도 |

### Task 6: Search (SEARCH-01 ~ SEARCH-02)

- Stack 화면 `search`. 위에 입력창(들어오면 바로 입력), 제출하면 `?q=`로 결과. 결과 수와 Explore와 같은 목록. 결과가 없으면 "No places match “q”."와 Explore로 가는 버튼.
- 검색어는 Web과 같이 다듬는다(`normalizeQuery`를 shared로 옮기는 것을 검토).

### Task 7: Place Detail (PLACE-04 ~ PLACE-06, COMMON-05)

- m-place의 순서: 이미지, 이름과 Category(시설은 subtype), 빠른 행동(Call, Website, Directions, Share), 설명, 주소와 "View on map", 영업시간, 연락처, 출처와 수정일. 값이 없는 줄은 빠진다.
- 로딩, 실패와 다시 시도, 없는 Place는 "Page not found"와 Map / Explore.
- 헤더의 제목은 Place 이름, 뒤로 가기는 Stack의 것.

### Task 8: Event / Notice Detail (EVENT-03 ~ EVENT-05, NOTICE-02 ~ NOTICE-05)

- Event: 이미지, 제목, 끝났으면 안내, When, Where와 "View on map", 설명, 출처와 "Official event page", 수정일, Share.
- Notice: 유형과 Official, 제목, 끝났으면 안내, Period, 요약, Location과 "View on map"(위치가 있을 때), 출처와 "Open original", 수정일, Share.
- 끝난 항목의 상세는 남아 있지만 지도에는 없다(EVENT-05, NOTICE-05). "View on map"은 끝난 항목에 두지 않는다.

### Task 9: 에뮬레이터에서 확인하고 문서를 쓴다

에뮬레이터의 위치는 Queenstown(-45.0312, 168.6626)으로 둔다. Place, Event, Notice가 하나씩 이상 있어야 한다.

| 확인 | 기대 |
|---|---|
| 칩 Cafes → Marker → 카드 → View details → Call / Website / Directions / Share | 카드에 거리, 상세의 행동이 기기의 앱을 연다. 공유에 Web 주소 |
| 상세의 View on map | 지도로 돌아와 그 Marker가 골라져 있다 |
| 칩 Events, Notices → Marker → 카드 → 상세 | 일시와 기간이 뉴질랜드 시간, Notice는 Official과 Open original |
| Explore → 칩 → 목록 끝까지 → 행 → 상세 → 뒤로 | 가까운 순과 거리, 뒤로 가면 목록 그대로 |
| 검색창 → 단어 → 결과 → 상세, 없는 단어 | 결과 수, 없으면 Explore로 가는 버튼 |
| 위치 권한을 끄고 다시 연다 | Map은 Queenstown, Explore는 거리 없이 Queenstown 중심 순, 흐름은 같다 |
| Backend를 끈다 | Map, Explore, Search, 상세 모두 다시 시도 안내 |

`mobile/README.md`의 구조와 알아 둘 것, 루트 README의 Current Status에 10주차.

---

## 범위 밖

| 항목 | 시점 |
|---|---|
| Local 탭과 App의 Notice / Event 목록 (APP-01) | Should |
| 영업 중 표시, 주변 장소, 검색 결과를 지도에서 보기, Marker Clustering (PLACE-07, PLACE-08, SEARCH-03, MAP-09) | Should |
| 링크로 App 열기(딥 링크, App Links) | 12주차에 배포 주소가 정해진 뒤 |
| 실기기, iOS | 12주차 |
