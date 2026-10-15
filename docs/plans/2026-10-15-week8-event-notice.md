# Week 8 Event / Notice / Public Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 방문자가 Local에서 유효한 Notice를 최신순으로, 예정되었거나 진행 중인 Event를 날짜순으로 보고, 상세에서 기간 · 장소 · 출처 · Official 표시를 확인한 뒤 "View on map"으로 지도의 그 위치로 간다. 지도에는 Place와 함께 Event와 Notice의 Marker가 나오고, 칩으로 좁히고, 눌러서 요약 카드를 거쳐 상세로 간다. 종료된 항목은 목록과 지도에서 빠지고, 상세 URL은 남아 종료되었다고 알린다. 검색엔진은 Sitemap으로 상세 페이지를 찾는다.

**Architecture:** Backend에 `GET /events`, `GET /events/{slug}`, `GET /notices`, `GET /notices/{slug}`, `GET /sitemap`을 더하고 `GET /map/markers`가 Event와 Notice도 준다. "지금"은 SQL의 `now()`가 아니라 `Clock` Bean에서 읽어 Query에 넘긴다(테스트가 시각을 고정할 수 있다). 날짜 필터의 기간은 `Pacific/Auckland` 기준으로 Java에서 계산한다. Web의 목록과 상세는 서버가 그린다(위치를 쓰지 않는다). 지도의 선택은 `kind`와 `slug`의 쌍이다(테이블마다 slug가 따로 고유하므로 Place와 Event의 slug가 같을 수 있다).

**Tech Stack:** Spring Boot 4.0, MyBatis, PostGIS / Next.js 16, next-intl, mapbox-gl 3, Vitest

**Spec:** [docs/01-mvp-feature-definition.md](../01-mvp-feature-definition.md) (EVENT-01 ~ EVENT-05, NOTICE-01 ~ NOTICE-06, MAP-06 ~ MAP-07, SEO-01의 Event / Notice, SEO-02, MORE-01), [docs/02-information-architecture.md](../02-information-architecture.md) 3장, 4장, 5장, 6장, [docs/03-user-flow.md](../03-user-flow.md) (UF-05, UF-06, 상태 안내), [docs/04-wireframe.md](../04-wireframe.md) (m-map-notice, m-notices, m-notice, m-events, m-event, d-notices, m-more), [docs/05-erd.md](../05-erd.md) 5장, 8장, [docs/06-api-specification.md](../06-api-specification.md) 3장, 5장, 6장, 7장. 캘린더 8주차의 완료 기준은 "Notice/Event가 상세정보와 위치정보를 함께 제공"이다.

## Global Constraints

- 노출 규칙은 [docs/05-erd.md](../05-erd.md) 5장이다. Event는 `ends_at`이 없으면 시작한 날(뉴질랜드 날짜)이 끝날 때까지 진행 중이다. Notice는 `ends_at`이 없으면 계속 유효하다. 위치가 없는 Notice는 지도에 나오지 않는다.
- "지금"은 `Clock` Bean 하나에서 읽는다. Query에 `now`로 넘기고 SQL에서 `now()`를 쓰지 않는다.
- `when`의 기간(오늘, 이번 주 월 ~ 일, 이번 달)은 `Pacific/Auckland`의 날짜로 계산하고, 기간과 하루라도 겹치는 Event를 준다. 지난 Event는 기간에 걸쳐도 나오지 않는다.
- 상세는 `status`가 `public`이면 종료된 뒤에도 200이고 `ended`가 `true`다. Web은 종료되었다고 표시하고 `robots`를 `noindex`로 한다.
- 정렬: Events는 `starts_at` 오름차순, Notices는 `starts_at` 내림차순. 같으면 `id`로 이어서 정렬해 한 항목이 두 쪽에 나오지 않게 한다.
- 지도의 Marker는 모두 합쳐 500개까지다. Notice, Event, Place 순으로 채운다(수가 적고 기간이 있는 것이 잘리지 않게).
- 지도의 URL: `?filter=food,event,notice`, 선택은 `?place=`, `?event=`, `?notice=` 중 하나. 하나를 고르면 다른 둘은 지운다.
- 시각은 API에서 UTC ISO 8601이고, 화면에서는 항상 `Pacific/Auckland`로 표시한다.
- 목록의 공통 모양 `{ items, page, size, total }`과 `?page=` 규칙(잘못된 값, 끝을 넘는 값은 404)은 7주차의 것을 그대로 쓴다.
- 문구는 `web/messages/en.json`에 둔다. 폭에 따른 배치는 768px 기준의 CSS(`md:`)로만 처리한다. 누르는 대상은 44px 이상이다.
- 404가 나올 수 있는 경로(`/notices`, `/events`)에는 `loading.tsx`를 두지 않는다.
- Seed 데이터는 출처가 있는 실제 정보만 넣는다. 확인하지 않은 공지나 행사를 지어내지 않는다.
- 검증과 커밋을 한 명령에 묶을 때는 테스트, Lint, 타입 검사가 모두 통과했을 때만 커밋되게 한다(`&&`).
- 커밋 메시지는 영어, 마지막 줄에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`를 붙인다.

## Review Focus

1. **시각의 경계.** 뉴질랜드의 자정 직전 · 직후, 일광 절약 시간이 바뀌는 날, 월요일 0시, 말일. `ends_at`이 없는 Event가 다음 날 0시에 빠져야 한다. → Task 1
2. **같은 slug의 다른 종류.** Place `market`과 Event `market`이 함께 지도에 있을 때 하나를 고르면 그것만 선택되어야 한다. → Task 3, Task 8
3. **위치가 없는 Notice.** 목록과 상세에는 나오고, 지도와 "View on map"에는 없다. `/?notice={그 slug}`로 들어와도 오류가 없다. → Task 2, Task 3, Task 7, Task 8
4. **종료된 항목.** 목록, 지도, Sitemap에서 빠지고 상세는 200으로 열리며 종료 안내와 `noindex`가 있다. → Task 1, Task 2, Task 4, Task 7
5. **필터의 값이 이상하다.** `?when=year`, `?type=fire`는 API에서 400, Web에서 404여야 한다. → Task 1, Task 2, Task 6

---

## File Structure

```text
backend/src/main/java/com/queenstownlocal/backend
 ├── common/time/TimeConfiguration.java     Clock Bean
 ├── common/time/NzDates.java               Pacific/Auckland의 날짜 경계
 ├── event                                  EventController, EventService, EventMapper, EventSummary, EventDetail, EventPeriod
 ├── notice                                 NoticeController, NoticeService, NoticeMapper, NoticeSummary, NoticeDetail, NoticeType
 ├── map                                    EventMarker, NoticeMarker 추가, MarkersResponse는 Marker 목록
 └── sitemap                                SitemapController, SitemapMapper, SitemapResponse
backend/src/main/resources/mapper           EventMapper.xml, NoticeMapper.xml, SitemapMapper.xml, MapMapper.xml
backend/seed                                events.csv, notices.csv와 그 SQL, load-seed.sh (load-places.sh를 대신한다)

shared/src
 ├── api.ts                                 EventSummary, EventDetail, NoticeSummary, NoticeDetail, EventMarker, NoticeMarker, SitemapResponse
 └── codes.ts                               EVENT_PERIODS, isNoticeType, isEventPeriod

web/src
 ├── app/notices/page.tsx, app/notices/[slug]/page.tsx
 ├── app/events/page.tsx, app/events/[slug]/page.tsx
 ├── app/about/page.tsx, app/more/page.tsx
 ├── app/sitemap.ts, app/robots.ts
 ├── components/local                       LocalTabs, FilterLinks, NoticeCard, NoticeList, EventCard, EventList, NoticeDetailView, EventDetailView, TypeBadges, EndedNotice
 ├── components/map                         MarkerPreview (PlacePreview를 대신한다), FilterChips, MapScreen, MapView
 ├── components/place/ViewOnMapLink.tsx     kind를 받는다
 └── lib
      ├── api/events.ts, api/notices.ts
      ├── dates.ts                          Event의 일시, Notice의 기간
      ├── local/listUrl.ts                  when, type, 쪽
      ├── map/filter.ts                     Category와 event, notice
      ├── map/selection.ts                  URL의 선택(kind, slug)
      └── seo/localMetadata.ts              Event, Notice 상세의 metadata
```

---

### Task 1: Event API (EVENT-01, EVENT-02, EVENT-05)

**Interfaces:**
- Produces: `GET /api/v1/events?when&page&size` → `PageResponse<EventSummary>`, `GET /api/v1/events/{slug}` → `EventDetail`
- Produces: `record EventSummary(String slug, String title, Instant startsAt, Instant endsAt, String venueName, String imageUrl, double latitude, double longitude)`
- Produces: `NzDates.ZONE`, `NzDates.window(String when, Instant now)` — `[from, to)`

| 테스트 | 기대 |
|---|---|
| `listsUpcomingAndOngoingByStart` | 지난 것, `private`은 없고 시작 순 |
| `anEventWithoutAnEndLastsItsDay` | `ends_at` 없음: NZ 23:59에는 나오고 다음 날 00:00에는 없다 |
| `todayWeekMonthOverlap` | 기간에 하루라도 겹치면 나온다. 월요일 시작, 일요일 끝, 말일 |
| `daylightSavingDay` | 4월 첫 일요일(25시간)과 9월 마지막 일요일(23시간)의 `today` |
| `unknownWhenIsRejected` | `when=year` → 400, `errors[0].field` "when" |
| `detailOfAnEndedEvent` | 200, `ended` true. `private` → 404 |

### Task 2: Notice API (NOTICE-01 ~ NOTICE-03, NOTICE-05, NOTICE-06)

| 테스트 | 기대 |
|---|---|
| `listsValidNoticesNewestFirst` | 끝난 것, `private`은 없고 시작의 내림차순. 아직 시작하지 않은 것은 나온다 |
| `typeNarrows` / `unknownTypeIsRejected` | `type=road-work` / `type=fire` → 400 |
| `aNoticeWithoutALocation` | 목록과 상세에 나오고 상세의 `latitude`, `longitude`, `locationName`이 `null` |
| `detailOfAnEndedNotice` | 200, `ended` true |

### Task 3: Event와 Notice의 Marker (MAP-06, MAP-07)

`MarkersResponse(List<Marker> markers, boolean truncated)`. `Marker`는 `PlaceMarker`, `EventMarker`, `NoticeMarker`가 구현하는 sealed interface다.

| 테스트 | 기대 |
|---|---|
| `everyKindInTheBox` | filter 없음 → 세 종류. 끝난 Event와 Notice, 위치 없는 Notice는 없다 |
| `filterChoosesKinds` | `filter=event` → Event만. `filter=food,notice` → food Place와 Notice |
| `markerFieldsByKind` | Event: `title`, `startsAt`, `endsAt`, `venueName`. Notice: `title`, `type`, `isOfficial`, `startsAt`, `endsAt` |
| `truncatesAcrossKinds` | 합쳐 500개, Notice와 Event가 먼저 |

### Task 4: Sitemap API (SEO-02)

`GET /api/v1/sitemap` → `{ places, events, notices }`, 각 항목 `{ slug, updatedAt }`. Event와 Notice는 목록에 나오는 것만.

### Task 5: Seed 데이터에 Event와 Notice

`events.csv`, `notices.csv`와 각 staging, upsert SQL. `load-seed.sh`가 세 파일을 한 트랜잭션으로 올린다. Notice는 위도와 경도가 둘 다 있거나 둘 다 없어야 한다. `SeedDataTest`에 같은 규칙(두 번 올려도 그대로, 바뀐 줄만 수정, 서비스 지역, slug)을 Event와 Notice로 더한다.

### Task 6: 목록 화면 — Notices, Events (NOTICE-01, NOTICE-06, EVENT-01, EVENT-02)

- `/notices?type=`, `/events?when=`. 위에 Notices / Events 탭, 그 아래 필터 링크(하나만 고른다, "All"이 해제), 카드 목록, 쪽.
- Notice 카드: 유형과 Official 표시 → 제목 → 기간. Event 카드: 이미지 → 제목 → 일시 → 장소.
- 결과 없음: Notices "There are no current notices." / 유형을 고른 경우 해제 링크. Events "No events in this period." / 해제 링크.
- 모르는 `type`, `when`, 잘못된 `page`, 끝을 넘는 `page`는 404.

`lib/dates.ts` (모두 `Pacific/Auckland`):

| 함수 | 입력 | 결과 |
|---|---|---|
| `formatEventWhen` | 같은 날 | `Fri 9 Oct · 5:00 pm - 9:00 pm` |
| | 끝 없음 | `Sat 17 Oct · 8:00 am` |
| | 여러 날 | `23 Oct - 25 Oct` |
| `formatNoticePeriod` | 여러 날 | `6 Oct - 20 Oct 2026` (해가 다르면 `28 Dec 2026 - 4 Jan 2027`) |
| | 같은 날 | `17 Oct 2026 · 8:00 am - 6:00 pm` |
| | 끝 없음 | `From 12 Oct 2026` |

상세 화면은 같은 함수에 `{ year: true }`를 넘겨 해를 붙인다(`Fri 9 Oct 2026 · 5:00 pm - 9:00 pm`).

### Task 7: 상세 화면 — Notice, Event (NOTICE-02 ~ NOTICE-04, EVENT-03, EVENT-04, COMMON-05, SEO-01)

- Notice(m-notice): Back → 유형, Official → 제목 → Period → 요약 → Location과 "View on map"(위치가 있을 때) → Source와 "Open original" → Updated → Share.
- Event(m-event): Back → 이미지 → 제목 → When → Where와 "View on map" → 설명 → Source 링크 → Updated → Share.
- 종료되었으면 기간 자리 위에 "This notice has ended." / "This event has ended."를 표시하고 metadata의 `robots`를 `noindex`로 한다.
- metadata: title, description(요약이나 설명, 없으면 일시와 장소), canonical, Open Graph, Twitter card. 7주차의 `placeMetadata`와 같은 규칙.
- `ViewOnMapLink`는 `kind`를 받아 `/?event=`, `/?notice=`로 간다.

### Task 8: 지도의 Event와 Notice (MAP-06, MAP-07)

- 칩: Category 6개 뒤에 Events, Notices.
- Marker: Event는 "E", Notice는 "!". 선택은 `kind:slug`로 구분한다.
- 요약 카드(`MarkerPreview`): Place는 지금과 같다. Event는 제목, 일시, 장소. Notice는 유형과 Official, 제목, 기간. 모두 "View details"로 상세에 간다.
- URL의 `event`, `notice`가 Marker의 답에 없으면 `getEvent`, `getNotice`로 한 번 찾는다(Place와 같은 규칙). 끝났거나 위치가 없으면 URL에서 지운다.

### Task 9: Sitemap, robots (SEO-02)

- `app/sitemap.ts`: `/`, `/explore`, `/explore/{category}`, `/notices`, `/events`, `/about`과 `GET /sitemap`의 상세. 요청할 때마다 만든다(빌드할 때 Backend를 부르지 않는다). Backend가 실패하면 고정 페이지만 준다.
- `app/robots.ts`: `/search`, `/api/` 제외, Sitemap 주소.

### Task 10: More와 About (MORE-01)

- More: About 항목 하나(m-more의 Must).
- About: 서비스 소개, 데이터 출처 안내(Place, Event, Notice가 어디서 오고 원문이 우선한다는 것).

### Task 11: 실제 브라우저로 확인하고 문서를 쓴다

확인용 Event와 Notice(끝난 것, 끝 없는 것, 위치 없는 것, 같은 slug의 Place와 Event)를 넣고 375px, 1200px에서 목록, 필터, 상세, "View on map", 404, Sitemap, robots를 확인한다. `web/README.md`, `backend/README.md`, `backend/seed/README.md`, API 명세, README의 Current Status를 고친다.

---

## 범위 밖

| 항목 | 시점 |
|---|---|
| 실제 Event / Notice 수집 | 형식과 적재는 Task 5. 수집은 출처를 확인하며 병행한다. |
| Marker Clustering (MAP-09), Notice 전용 Marker 모양 | Should |
| Privacy Policy, Terms (MORE-03), 정보 수정 요청 (MORE-02) | Should |
| Local Tab (APP-01) | App |
