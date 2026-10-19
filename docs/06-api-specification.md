# API Specification v1

Queenstown Local Platform MVP의 REST API를 정의한다. Web, App, Admin이 같은 API를 사용한다.

- 작성일: 2026-10-07
- 상태: v1 (확정)
- 기준 문서: [MVP Feature Definition v1](01-mvp-feature-definition.md), [Information Architecture v1](02-information-architecture.md), [User Flow v1](03-user-flow.md), [ERD v1](05-erd.md)
- 대상: Spring Boot, MyBatis

Must 범위와 11주차에 개발하는 Should(User, Favorite, Admin)까지 포함한다.

---

## 1. 공통 규칙

### 기본

| 항목 | 규칙 |
|---|---|
| Base URL | `/api/v1` |
| 형식 | 요청과 응답 모두 JSON (`application/json`), UTF-8 |
| 필드 이름 | camelCase |
| 시각 | ISO 8601, UTC. 예: `2026-10-09T04:00:00Z`. 화면에서는 `Pacific/Auckland`로 바꿔 표시한다. |
| 좌표 | WGS84. `latitude`, `longitude`를 숫자로 주고받는다. |
| 값이 없는 필드 | 생략하지 않고 `null`로 내려준다. |
| 코드 값 | [ERD v1](05-erd.md)의 코드 값을 그대로 쓴다. 예: `food`, `road-work`, `public` |
| 식별자 | 공개 API는 `slug`, Admin API는 `id`를 쓴다. |

### 기준 위치

위치를 보내지 않는 요청은 Queenstown 중심을 기준으로 처리한다.

| 항목 | 값 |
|---|---|
| Queenstown 중심 | `latitude` -45.0312, `longitude` 168.6626 |
| 서비스 지역 | 중심에서 반경 50km |

서비스 지역 안인지는 클라이언트가 판단한다. 지역 밖이면 클라이언트는 위치를 보내지 않는다. 두 값은 `shared`의 상수로 둔다.

### 목록

목록은 아래 형태로 응답한다.

| 필드 | 타입 | 설명 |
|---|---|---|
| items | array | 항목 |
| page | number | 현재 쪽. 1부터 시작한다. |
| size | number | 쪽 크기 |
| total | number | 전체 항목 수 |

| 파라미터 | 기본값 | 범위 |
|---|---|---|
| page | 1 | 1 이상 |
| size | 20 | 1 ~ 50 |

### 인증

| 항목 | 규칙 |
|---|---|
| 방식 | `Authorization: Bearer {accessToken}` |
| Access Token | JWT. 유효 시간 15분 |
| Refresh Token | 임의 문자열. 유효 기간 30일. 재발급할 때마다 새 토큰으로 바꾸고 이전 토큰은 무효로 만든다. |
| 공개 API | 인증 없이 호출한다. |
| `/me`로 시작하는 API | 로그인이 필요하다. |
| `/admin`으로 시작하는 API | `role`이 `admin`이어야 한다. |

App은 토큰을 기기의 보안 저장소에 둔다. Web은 브라우저의 JavaScript가 읽을 수 없도록 Next.js 서버가 HttpOnly 쿠키로 보관한다.

### 오류

오류는 Problem Details 형식(`application/problem+json`)으로 응답한다. `code`로 오류의 종류를 구분한다.

```json
{
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed.",
  "instance": "/api/v1/admin/places",
  "code": "VALIDATION_FAILED",
  "errors": [
    { "field": "sourceUrl", "message": "must not be blank" }
  ]
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| status | number | HTTP 상태 코드 |
| title | string | 상태 코드의 이름 |
| detail | string | 오류 설명 |
| instance | string | 요청한 경로 |
| code | string | 오류 코드 |
| errors | array | 입력값 오류일 때만 있다. 항목은 `field`와 `message`다. |

| code | 상태 | 의미 |
|---|---|---|
| VALIDATION_FAILED | 400 | 입력값이 규칙에 맞지 않는다. |
| INVALID_CREDENTIALS | 401 | 이메일 또는 비밀번호가 틀렸다. 어느 쪽이 틀렸는지는 알려주지 않는다. |
| INVALID_REFRESH_TOKEN | 401 | Refresh Token이 없거나 만료되었거나 무효다. |
| UNAUTHORIZED | 401 | 로그인이 필요하다. |
| FORBIDDEN | 403 | 권한이 없다. |
| NOT_FOUND | 404 | 대상이 없거나 `private`이다. 없는 경로도 여기에 해당한다. |
| METHOD_NOT_ALLOWED | 405 | 지원하지 않는 Method다. |
| EMAIL_ALREADY_USED | 409 | 이미 가입한 이메일이다. |
| TOO_MANY_REQUESTS | 429 | 로그인이나 가입 시도가 너무 많다. 같은 주소에서 10분에 20번까지다. `Retry-After`(초) 뒤에 다시 시도한다. |
| INTERNAL_ERROR | 500 | 서버 오류. `detail`에 내부 메시지를 담지 않는다. |

표에 없는 오류도 같은 형식으로 응답한다. `code`는 4xx이면 `VALIDATION_FAILED`, 5xx이면 `INTERNAL_ERROR`다.

---

## 2. Endpoint 목록

### 공개 API

| Method | Path | 설명 | 우선순위 | Feature |
|---|---|---|---|---|
| GET | `/map/markers` | 지도 영역의 Marker | Must | MAP-03 ~ MAP-08 |
| GET | `/places` | Place 목록과 검색 | Must | PLACE-01 ~ PLACE-03, SEARCH-01 ~ SEARCH-02 |
| GET | `/places/{slug}` | Place 상세 | Must | PLACE-04, PLACE-06, SEO-01 |
| GET | `/places/{slug}/nearby` | 주변 장소 | Should | PLACE-08 |
| GET | `/events` | Event 목록 | Must | EVENT-01, EVENT-02, EVENT-05 |
| GET | `/events/{slug}` | Event 상세 | Must | EVENT-03, EVENT-04, SEO-01 |
| GET | `/notices` | Notice 목록 | Must | NOTICE-01, NOTICE-05, NOTICE-06 |
| GET | `/notices/{slug}` | Notice 상세 | Must | NOTICE-02 ~ NOTICE-04, SEO-01 |
| GET | `/sitemap` | Sitemap에 넣을 항목 | Must | SEO-02 |

### 인증과 사용자 (Should)

| Method | Path | 설명 | 인증 | Feature |
|---|---|---|---|---|
| POST | `/auth/signup` | 회원가입 | 없음 | USER-01 |
| POST | `/auth/login` | 로그인 | 없음 | USER-02, ADMIN-01 |
| POST | `/auth/refresh` | 토큰 재발급 | 없음 | USER-02 |
| POST | `/auth/logout` | 로그아웃 | 없음 | USER-02 |
| GET | `/me` | 내 계정 | 로그인 | USER-02 |
| GET | `/me/favorites` | Favorite 목록 | 로그인 | FAV-02 |
| PUT | `/me/favorites/{slug}` | Favorite 추가 | 로그인 | FAV-01 |
| DELETE | `/me/favorites/{slug}` | Favorite 해제 | 로그인 | FAV-01 |

### Admin (Should)

| Method | Path | 설명 | Feature |
|---|---|---|---|
| GET | `/admin/places` | Place 목록 | ADMIN-02 |
| POST | `/admin/places` | Place 등록 | ADMIN-02 |
| GET | `/admin/places/{id}` | Place 조회 | ADMIN-02 |
| PUT | `/admin/places/{id}` | Place 수정 | ADMIN-02 |
| GET | `/admin/events` | Event 목록 | ADMIN-03 |
| POST | `/admin/events` | Event 등록 | ADMIN-03 |
| GET | `/admin/events/{id}` | Event 조회 | ADMIN-03 |
| PUT | `/admin/events/{id}` | Event 수정 | ADMIN-03 |
| GET | `/admin/notices` | Notice 목록 | ADMIN-04 |
| POST | `/admin/notices` | Notice 등록 | ADMIN-04 |
| GET | `/admin/notices/{id}` | Notice 조회 | ADMIN-04 |
| PUT | `/admin/notices/{id}` | Notice 수정 | ADMIN-04 |

삭제 API는 없다. 내릴 항목은 `status`를 `private`으로 수정한다.

### API를 쓰지 않는 Feature

클라이언트에서 처리한다.

| Feature | 처리 |
|---|---|
| NAV-01, NAV-02, COMMON-02 ~ COMMON-05, MORE-01 ~ MORE-03 | 화면과 문구 |
| MAP-01, MAP-02, COMMON-01 | 지도 SDK와 기기의 위치 기능 |
| MAP-09 | 지도 SDK의 Clustering |
| PLACE-05 | 전화, 웹사이트, 길찾기를 기기에서 연다. |
| SEARCH-03 | `/places`의 검색 결과를 지도에 표시한다. |
| APP-01 | `/events`, `/notices`를 App에서 호출한다. |
| PLACE-07 | v1에 없다. 영업 중 표시를 만들 때 추가한다. |

---

## 3. Map

### GET /map/markers

지도에 보이는 영역 안의 Place, Event, Notice를 한 번에 가져온다. [ERD v1](05-erd.md)의 노출 규칙을 따른다. 위치가 없는 Notice는 나오지 않는다.

| 파라미터 | 필수 | 설명 |
|---|---|---|
| west | O | 영역의 서쪽 경도 |
| south | O | 영역의 남쪽 위도 |
| east | O | 영역의 동쪽 경도 |
| north | O | 영역의 북쪽 위도 |
| filter | | 쉼표로 구분한 값. Category 코드와 `event`, `notice`를 쓴다. 없으면 전체를 가져온다. |

| 응답 필드 | 타입 | 설명 |
|---|---|---|
| markers | array | Marker. `kind`에 따라 필드가 다르다. |
| truncated | boolean | 결과가 500개를 넘어 일부만 내려주었으면 `true` |

Marker의 공통 필드

| 필드 | 타입 | 설명 |
|---|---|---|
| kind | string | `place`, `event`, `notice` |
| slug | string | 식별자 |
| latitude | number | 위도 |
| longitude | number | 경도 |

`kind`별 필드. Preview와 요약 카드를 추가 요청 없이 그릴 수 있는 만큼만 담는다.

| kind | 필드 |
|---|---|
| place | `name`, `category`, `subtype` |
| event | `title`, `startsAt`, `endsAt`, `venueName` |
| notice | `title`, `type`, `isOfficial`, `startsAt`, `endsAt` |

Preview의 거리는 클라이언트가 현재 위치와 Marker의 좌표로 계산한다.

Marker는 모두 합쳐 500개까지다. Notice(시작의 내림차순), Event(시작 순), Place 순으로 채운다. 기간이 있는 Marker가 먼저 잘리지 않게 하기 위해서다. `filter`에 Category가 없고 `event`나 `notice`만 있으면 Place는 나오지 않는다. slug는 종류마다 따로 고유하므로 Marker는 `kind`와 `slug`로 구분한다.

```json
{
  "markers": [
    {
      "kind": "place",
      "slug": "lakeside-kitchen",
      "latitude": -45.0322,
      "longitude": 168.661,
      "name": "Lakeside Kitchen",
      "category": "food",
      "subtype": null
    },
    {
      "kind": "event",
      "slug": "lakefront-night-market",
      "latitude": -45.0331,
      "longitude": 168.6597,
      "title": "Lakefront Night Market",
      "startsAt": "2026-10-09T04:00:00Z",
      "endsAt": "2026-10-09T08:00:00Z",
      "venueName": "Earnslaw Park"
    },
    {
      "kind": "notice",
      "slug": "shotover-street-road-works",
      "latitude": -45.0312,
      "longitude": 168.6626,
      "title": "Shotover Street road works",
      "type": "road-work",
      "isOfficial": true,
      "startsAt": "2026-10-05T18:00:00Z",
      "endsAt": "2026-10-20T05:00:00Z"
    }
  ],
  "truncated": false
}
```

| 상태 | 경우 |
|---|---|
| 200 | 성공 |
| 400 | 영역의 값이 없거나 범위를 벗어났다. `filter`에 모르는 값이 있다. |

---

## 4. Place

### Place 필드

| 필드 | 타입 | 목록 | 상세 | 설명 |
|---|---|---|---|---|
| slug | string | O | O | 식별자 |
| name | string | O | O | 이름 |
| category | string | O | O | Category 코드 |
| subtype | string \| null | O | O | Public Facility의 하위 유형 |
| address | string | O | O | 주소 |
| imageUrl | string \| null | O | O | 대표 이미지 URL |
| latitude | number | O | O | 위도 |
| longitude | number | O | O | 경도 |
| distanceM | number \| null | O | | 기준 위치에서의 거리(m). 요청에 위치가 없으면 `null` |
| description | string \| null | | O | 설명 |
| openingHours | string \| null | | O | 영업시간 |
| phone | string \| null | | O | 전화번호 |
| website | string \| null | | O | 웹사이트 |
| source | string | | O | 출처 이름 |
| sourceUrl | string | | O | 출처 URL |
| updatedAt | string | | O | 수정 시각 |

### GET /places

Explore의 목록과 Search가 함께 쓴다. `status`가 `public`인 Place를 가까운 순으로 응답한다.

| 파라미터 | 필수 | 설명 |
|---|---|---|
| category | | Category 코드 하나 |
| q | | 검색어. 이름, 설명, 주소에서 대소문자 구분 없이 찾는다. 앞뒤 공백을 뺀 100자까지다. |
| lat | | 기준 위치의 위도. `lng`와 함께 보낸다. |
| lng | | 기준 위치의 경도 |
| page, size | | 목록의 공통 파라미터 |

위치를 보내면 그 위치에서 가까운 순으로 정렬하고 `distanceM`을 채운다. `distanceM`은 미터 단위의 정수다. 보내지 않으면 Queenstown 중심에서 가까운 순으로 정렬하고 `distanceM`은 `null`이다. 거리가 같으면 먼저 등록한 Place가 앞이다.

검색어는 공백으로 낱말을 나누고, **모든 낱말**이 이름, 설명, 주소 중 어딘가에 들어 있는 Place를 찾는다. `%`, `_`, `\`는 와일드카드가 아니라 글자 그대로 찾는다. 공백뿐인 검색어는 검색하지 않은 것과 같다.

Web은 방문자의 위치를 소수 넷째 자리(약 11m)로 반올림해 보내고, 서비스 지역 밖이면 보내지 않는다.

```json
{
  "items": [
    {
      "slug": "lakeside-kitchen",
      "name": "Lakeside Kitchen",
      "category": "food",
      "subtype": null,
      "address": "12 Beach Street, Queenstown",
      "imageUrl": null,
      "latitude": -45.0322,
      "longitude": 168.661,
      "distanceM": 350
    }
  ],
  "page": 1,
  "size": 20,
  "total": 37
}
```

| 상태 | 경우 |
|---|---|
| 200 | 성공. 결과가 없으면 `items`가 빈 배열이다. |
| 400 | 모르는 `category`다. `lat`과 `lng` 중 하나만 보냈다. `lat`이 -90 ~ 90, `lng`가 -180 ~ 180을 벗어났다. `q`가 100자를 넘는다. `page`, `size`가 범위를 벗어났다. `errors[0].field`가 그 파라미터다. |

### GET /places/{slug}

```json
{
  "slug": "lakeside-kitchen",
  "name": "Lakeside Kitchen",
  "category": "food",
  "subtype": null,
  "address": "12 Beach Street, Queenstown",
  "imageUrl": null,
  "latitude": -45.0322,
  "longitude": 168.661,
  "description": "Lakefront restaurant.",
  "openingHours": "Mon - Sun · 8:00 am - 10:00 pm",
  "phone": "03 000 0000",
  "website": "https://lakesidekitchen.example",
  "source": "Business website",
  "sourceUrl": "https://lakesidekitchen.example",
  "updatedAt": "2026-10-02T01:30:00Z"
}
```

| 상태 | 경우 |
|---|---|
| 200 | 성공 |
| 404 | 없거나 `private`이다. |

### GET /places/{slug}/nearby (Should)

해당 Place에서 가까운 다른 Place를 가까운 순으로 응답한다. `distanceM`은 해당 Place에서의 거리다.

| 파라미터 | 기본값 | 설명 |
|---|---|---|
| size | 3 | 1 ~ 10 |

응답은 `items`만 있는 목록이다. 항목은 Place의 목록 필드와 같다.

---

## 5. Event

### Event 필드

| 필드 | 타입 | 목록 | 상세 | 설명 |
|---|---|---|---|---|
| slug | string | O | O | 식별자 |
| title | string | O | O | 제목 |
| startsAt | string | O | O | 시작 시각 |
| endsAt | string \| null | O | O | 종료 시각 |
| venueName | string | O | O | 장소 이름 |
| imageUrl | string \| null | O | O | 대표 이미지 URL |
| latitude | number | O | O | 위도 |
| longitude | number | O | O | 경도 |
| description | string \| null | | O | 설명 |
| address | string \| null | | O | 주소 |
| source | string | | O | 출처 이름 |
| sourceUrl | string | | O | 공식 행사 페이지 URL |
| updatedAt | string | | O | 수정 시각 |
| ended | boolean | | O | 종료되었으면 `true` |

### GET /events

예정되었거나 진행 중인 Event를 `startsAt` 오름차순으로 응답한다.

| 파라미터 | 필수 | 설명 |
|---|---|---|
| when | | `today`, `week`, `month`. 없으면 전체 |
| page, size | | 목록의 공통 파라미터 |

`when`의 기간은 `Pacific/Auckland` 기준이다. 기간과 하루라도 겹치는 Event가 나온다. 이미 끝난 Event는 기간에 걸쳐도 나오지 않는다. 시작이 같으면 먼저 등록한 Event가 앞이다.

`endsAt`이 없는 Event는 시작한 날(뉴질랜드 날짜)이 끝날 때까지 진행 중이다. 일광 절약 시간이 바뀌는 날은 23시간이나 25시간이고, 그날의 실제 자정에 끝난다.

| when | 기간 |
|---|---|
| today | 오늘 |
| week | 이번 주 월요일부터 일요일까지 |
| month | 이번 달 1일부터 말일까지 |

| 상태 | 경우 |
|---|---|
| 200 | 성공 |
| 400 | 모르는 `when`이다. |

### GET /events/{slug}

종료된 Event도 `status`가 `public`이면 응답하고 `ended`를 `true`로 준다.

```json
{
  "slug": "lakefront-night-market",
  "title": "Lakefront Night Market",
  "startsAt": "2026-10-09T04:00:00Z",
  "endsAt": "2026-10-09T08:00:00Z",
  "venueName": "Earnslaw Park",
  "imageUrl": null,
  "latitude": -45.0331,
  "longitude": 168.6597,
  "description": "Food stalls and live music on the lakefront.",
  "address": "Earnslaw Park, Queenstown",
  "source": "Event organiser",
  "sourceUrl": "https://nightmarket.example",
  "updatedAt": "2026-10-01T22:00:00Z",
  "ended": false
}
```

| 상태 | 경우 |
|---|---|
| 200 | 성공 |
| 404 | 없거나 `private`이다. |

---

## 6. Notice

### Notice 필드

| 필드 | 타입 | 목록 | 상세 | 설명 |
|---|---|---|---|---|
| slug | string | O | O | 식별자 |
| title | string | O | O | 제목 |
| type | string | O | O | Notice 유형 코드 |
| isOfficial | boolean | O | O | 공식 출처 여부 |
| startsAt | string | O | O | 시작 시각 |
| endsAt | string \| null | O | O | 종료 시각 |
| summary | string | | O | 요약 |
| locationName | string \| null | | O | 위치 설명 |
| latitude | number \| null | | O | 위도. 위치가 없으면 `null` |
| longitude | number \| null | | O | 경도. 위치가 없으면 `null` |
| sourceOrg | string | | O | 출처 기관 |
| sourceUrl | string | | O | 원문 URL |
| updatedAt | string | | O | 수정 시각 |
| ended | boolean | | O | 종료되었으면 `true` |

### GET /notices

유효한 Notice를 `startsAt` 내림차순으로 응답한다. `endsAt`이 없거나 아직 지나지 않은 Notice가 유효하고, 아직 시작하지 않은 Notice도 나온다(미리 알아야 할 통제가 있다). 시작이 같으면 나중에 등록한 Notice가 앞이다.

| 파라미터 | 필수 | 설명 |
|---|---|---|
| type | | Notice 유형 코드 하나 (Should) |
| page, size | | 목록의 공통 파라미터 |

| 상태 | 경우 |
|---|---|
| 200 | 성공 |
| 400 | 모르는 `type`이다. |

### GET /notices/{slug}

종료된 Notice도 `status`가 `public`이면 응답하고 `ended`를 `true`로 준다. `latitude`와 `longitude`가 `null`이면 화면에 "View on map"을 표시하지 않는다.

```json
{
  "slug": "shotover-street-road-works",
  "title": "Shotover Street road works",
  "type": "road-work",
  "isOfficial": true,
  "startsAt": "2026-10-05T18:00:00Z",
  "endsAt": "2026-10-20T05:00:00Z",
  "summary": "Road works on Shotover Street. Expect delays.",
  "locationName": "Shotover Street, between Camp St and Stanley St",
  "latitude": -45.0312,
  "longitude": 168.6626,
  "sourceOrg": "Queenstown Lakes District Council",
  "sourceUrl": "https://council.example/notices/shotover-street",
  "updatedAt": "2026-10-04T20:15:00Z",
  "ended": false
}
```

| 상태 | 경우 |
|---|---|
| 200 | 성공 |
| 404 | 없거나 `private`이다. |

---

## 7. Sitemap

### GET /sitemap

Web의 Next.js 서버가 `sitemap.xml`을 만들 때 호출한다. Place는 `public`인 항목, Event와 Notice는 목록에 나오는 항목만 담는다. 각 목록은 등록 순이다.

| 응답 필드 | 타입 | 설명 |
|---|---|---|
| places | array | `slug`, `updatedAt` |
| events | array | `slug`, `updatedAt` |
| notices | array | `slug`, `updatedAt` |

```json
{
  "places": [{ "slug": "lakeside-kitchen", "updatedAt": "2026-10-02T01:30:00Z" }],
  "events": [{ "slug": "lakefront-night-market", "updatedAt": "2026-10-01T22:00:00Z" }],
  "notices": [{ "slug": "shotover-street-road-works", "updatedAt": "2026-10-04T20:15:00Z" }]
}
```

---

## 8. 인증과 사용자 (Should)

### 토큰 응답

`/auth/signup`, `/auth/login`, `/auth/refresh`가 같은 형태로 응답한다.

| 필드 | 타입 | 설명 |
|---|---|---|
| accessToken | string | Access Token |
| refreshToken | string | Refresh Token |
| expiresIn | number | Access Token의 남은 유효 시간(초) |
| user | object | `email`, `role` |

```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "b1f6c0e2...",
  "expiresIn": 900,
  "user": { "email": "name@example.com", "role": "user" }
}
```

### POST /auth/signup

| 요청 필드 | 필수 | 규칙 |
|---|---|---|
| email | O | 이메일 형식 |
| password | O | 8자 이상 |

| 상태 | 경우 |
|---|---|
| 201 | 가입하고 로그인된 상태가 된다. 토큰 응답을 준다. |
| 400 | 입력값이 규칙에 맞지 않는다. |
| 409 | 이미 가입한 이메일이다. |

### POST /auth/login

일반 사용자와 관리자가 함께 쓴다. Admin은 응답의 `role`이 `admin`이 아니면 로그인을 거부한다.

| 요청 필드 | 필수 |
|---|---|
| email | O |
| password | O |

| 상태 | 경우 |
|---|---|
| 200 | 토큰 응답 |
| 401 | 이메일 또는 비밀번호가 틀렸다. |

### POST /auth/refresh

| 요청 필드 | 필수 |
|---|---|
| refreshToken | O |

| 상태 | 경우 |
|---|---|
| 200 | 새 토큰 응답. 보낸 Refresh Token은 무효가 된다. |
| 401 | Refresh Token이 없거나 만료되었거나 무효다. |

### POST /auth/logout

| 요청 필드 | 필수 |
|---|---|
| refreshToken | O |

| 상태 | 경우 |
|---|---|
| 204 | 보낸 Refresh Token을 무효로 만든다. 이미 무효여도 204다. |

### GET /me

```json
{ "email": "name@example.com", "role": "user" }
```

### GET /me/favorites

저장한 Place를 최근에 저장한 순으로 응답한다. `private`이 된 Place는 나오지 않는다. 응답은 `items`만 있는 목록이고, 항목은 Place의 목록 필드와 같다. `distanceM`은 `null`이다.

### PUT /me/favorites/{slug}

| 상태 | 경우 |
|---|---|
| 204 | 저장했다. 이미 저장한 Place여도 204다. |
| 404 | Place가 없거나 `private`이다. |

### DELETE /me/favorites/{slug}

| 상태 | 경우 |
|---|---|
| 204 | 해제했다. 저장하지 않은 Place여도 204다. |

`/me`로 시작하는 API는 토큰이 없거나 만료되었으면 401을 응답한다.

---

## 9. Admin (Should)

`/admin`으로 시작하는 API는 토큰이 없으면 401, `role`이 `admin`이 아니면 403을 응답한다. Place, Event, Notice가 같은 구조다.

### 공통

| API | 동작 |
|---|---|
| GET 목록 | `status`와 관계없이 모든 항목을 `updatedAt` 내림차순으로 응답한다. |
| POST | 등록한다. `slug`는 서버가 이름이나 제목에서 만든다. 201과 함께 등록한 항목을 응답한다. |
| GET 조회 | 항목 하나를 응답한다. |
| PUT | 전체 필드를 보내 수정한다. `slug`는 바뀌지 않는다. 200과 함께 수정한 항목을 응답한다. |

목록의 파라미터

| 파라미터 | 대상 | 설명 |
|---|---|---|
| q | 전체 | 이름 또는 제목 검색 |
| status | 전체 | `public`, `private` |
| category | Place | Category 코드 |
| type | Notice | Notice 유형 코드 |
| page, size | 전체 | 목록의 공통 파라미터 |

응답 항목은 아래 요청 필드에 `id`, `slug`, `createdAt`, `updatedAt`을 더한 것이다.

| 상태 | 경우 |
|---|---|
| 400 | 입력값이 규칙에 맞지 않는다. `errors`에 필드별 오류를 담는다. |
| 404 | 해당 `id`가 없다. |

### Place 요청 필드

| 필드 | 필수 | 규칙 |
|---|---|---|
| name | O | 120자 이하 |
| category | O | Category 코드 |
| subtype | | `category`가 `facility`이면 필수, 아니면 `null` |
| description | | |
| address | O | 255자 이하 |
| latitude | O | -90 ~ 90 |
| longitude | O | -180 ~ 180 |
| openingHours | | 255자 이하 |
| phone | | 30자 이하 |
| website | | URL |
| imageUrl | | URL |
| source | O | 120자 이하 |
| sourceUrl | O | URL |
| status | O | `public`, `private` |

### Event 요청 필드

| 필드 | 필수 | 규칙 |
|---|---|---|
| title | O | 160자 이하 |
| description | | |
| startsAt | O | 시각 |
| endsAt | | `startsAt` 이후 |
| venueName | O | 120자 이하 |
| address | | 255자 이하 |
| latitude | O | -90 ~ 90 |
| longitude | O | -180 ~ 180 |
| imageUrl | | URL |
| source | O | 120자 이하 |
| sourceUrl | O | URL |
| status | O | `public`, `private` |

### Notice 요청 필드

| 필드 | 필수 | 규칙 |
|---|---|---|
| title | O | 160자 이하 |
| type | O | Notice 유형 코드 |
| summary | O | |
| startsAt | O | 시각 |
| endsAt | | `startsAt` 이후 |
| locationName | | 255자 이하 |
| latitude | | `longitude`와 함께 보내거나 둘 다 `null` |
| longitude | | |
| sourceOrg | O | 120자 이하 |
| sourceUrl | O | URL |
| isOfficial | O | boolean |
| status | O | `public`, `private` |

---

## 10. 다음 단계

```text
API Specification
 ↓
개발환경 구축 (3주차)
 ↓
개발
```
