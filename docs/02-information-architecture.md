# Information Architecture v1

Queenstown Local Platform MVP의 화면 구조, URL, 내비게이션, 분류 체계를 정의한다.

- 작성일: 2026-10-07
- 상태: v1 (확정)
- 기준 문서: [MVP Feature Definition v1](01-mvp-feature-definition.md)

Feature ID는 MVP Feature Definition v1의 ID를 그대로 사용한다.

---

## 1. 구조 원칙

1. **Map이 첫 화면이다.**
2. **상세 화면(Place / Event / Notice)은 고유 URL을 가진 독립 페이지다.** 검색 유입과 공유 링크의 도착점이 된다.
3. **모든 상세에서 "지도에서 보기"로 Map에 돌아간다.** Map의 상태(필터, 선택한 항목)는 URL로 표현한다.
4. **Web과 App은 같은 정보 구조를 사용하고 내비게이션만 다르게 구성한다.**
5. **Later 기능은 메뉴에 노출하지 않는다.**

---

## 2. 전체 구조

### Web

```text
Web
 ├── Map                      /
 │    ├── Place Preview   →   Place Detail
 │    ├── Event 요약 카드  →   Event Detail
 │    └── Notice 요약 카드 →   Notice Detail
 │
 ├── Explore                  /explore
 │    ├── Category            /explore/{category}
 │    ├── Search              /search?q={keyword}
 │    └── Place Detail        /places/{slug}
 │
 ├── Local
 │    ├── Notices             /notices
 │    │    └── Notice Detail  /notices/{slug}
 │    └── Events              /events
 │         └── Event Detail   /events/{slug}
 │
 └── More                     /more
      ├── About               /about
      ├── Privacy Policy      /privacy      (Should)
      ├── Terms               /terms        (Should)
      ├── Login               /login        (Should)
      ├── Sign Up             /signup       (Should)
      └── Favorites           /favorites    (Should)
```

### App

```text
App
 ├── Map (Tab)
 │    ├── Place Preview   →   Place Detail
 │    ├── Event 요약 카드  →   Event Detail
 │    └── Notice 요약 카드 →   Notice Detail
 │
 ├── Explore (Tab)
 │    ├── Search
 │    └── Place Detail
 │
 ├── Local (Tab)                            (Should)
 │    ├── Notices         →   Notice Detail
 │    └── Events          →   Event Detail
 │
 └── More (Tab)
      ├── About
      ├── Login / Sign Up                   (Should)
      └── Favorites                         (Should)
```

Search, Place Detail, Event Detail, Notice Detail은 Tab 위에 쌓이는 화면이다. 어느 Tab에서 열어도 뒤로 가면 원래 화면으로 돌아온다.

### Admin

```text
Admin                                       (Should)
 ├── Login                /login
 ├── Places               /places
 │    ├── 등록            /places/new
 │    └── 수정            /places/{id}
 ├── Events               /events
 │    ├── 등록            /events/new
 │    └── 수정            /events/{id}
 └── Notices              /notices
      ├── 등록            /notices/new
      └── 수정            /notices/{id}
```

Admin은 Web과 분리된 별도의 앱이다.

---

## 3. 화면과 URL

| 화면 | Web URL | App | 검색 노출 | Feature |
|---|---|---|---|---|
| Map | `/` | Tab | 노출 | MAP-01 ~ MAP-09, COMMON-01 |
| Explore | `/explore` | Tab | 노출 | PLACE-01, PLACE-03 |
| Explore (Category) | `/explore/{category}` | Explore 안의 필터 | 노출 | PLACE-02 |
| Search | `/search?q={keyword}` | 화면 | 제외 | SEARCH-01 ~ SEARCH-03 |
| Place Detail | `/places/{slug}` | 화면 | 노출 | PLACE-04 ~ PLACE-08, COMMON-05, SEO-01, FAV-01, MORE-02 |
| Notices | `/notices` | Local Tab (Should) | 노출 | NOTICE-01, NOTICE-05, NOTICE-06, APP-01 |
| Notice Detail | `/notices/{slug}` | 화면 | 노출 | NOTICE-02 ~ NOTICE-04, COMMON-05, SEO-01 |
| Events | `/events` | Local Tab (Should) | 노출 | EVENT-01, EVENT-02, EVENT-05, APP-01 |
| Event Detail | `/events/{slug}` | 화면 | 노출 | EVENT-03, EVENT-04, COMMON-05, SEO-01 |
| More | `/more` | Tab | 제외 | MORE-02, USER-02 |
| About | `/about` | 화면 | 노출 | MORE-01 |
| Privacy Policy / Terms | `/privacy`, `/terms` | 화면 | 노출 | MORE-03 |
| Login | `/login` | 화면 | 제외 | USER-02 |
| Sign Up | `/signup` | 화면 | 제외 | USER-01 |
| Favorites | `/favorites` | 화면 | 제외 | FAV-02 |
| 전체 공통 | 없음 | 없음 | 없음 | NAV-01, NAV-02, COMMON-02 ~ COMMON-04, SEO-02 |
| Admin | 2장의 Admin 구조 | 없음 | 제외 | ADMIN-01 ~ ADMIN-04 |

### URL 규칙

- 소문자와 하이픈만 사용한다.
- `slug`는 이름에서 만들고 고유해야 한다. **한 번 공개한 slug는 이름이 바뀌어도 바꾸지 않는다.**
- 기본 언어(English)는 언어 prefix 없이 제공한다. 언어를 추가할 때 `/{locale}/...` 형태로 붙인다.
- 종료된 Event와 Notice의 상세 URL은 없애지 않는다. 페이지에 종료되었음을 표시하고 검색 노출에서 제외한다.
- Sitemap에는 "노출"로 표시한 화면만 넣는다. Event와 Notice는 유효한 항목만 넣는다.

### 목록의 필터

| 화면 | 파라미터 | 값 |
|---|---|---|
| Events | `when` | `today`, `week`, `month`. 없으면 예정되었거나 진행 중인 전체 |
| Notices | `type` (Should) | `road-work`, `road-closure`, `public-notice`, `emergency` |

### Map의 상태

"지도에서 보기"와 Filter 칩은 Map의 URL로 표현한다. 이 URL은 공유할 수 있고, 뒤로 가기를 눌렀을 때 같은 상태로 돌아온다.

| 파라미터 | 예 | 의미 | Feature |
|---|---|---|---|
| `filter` | `/?filter=food,cafe` | 선택한 Filter 칩. 여러 개를 쉼표로 구분한다. 없으면 전체를 표시한다. | MAP-04 |
| `place` | `/?place={slug}` | 해당 Place를 선택한 상태. 지도를 그 위치로 옮기고 Preview를 표시한다. | PLACE-06 |
| `event` | `/?event={slug}` | 해당 Event를 선택한 상태 | EVENT-04 |
| `notice` | `/?notice={slug}` | 해당 Notice를 선택한 상태 | NOTICE-04 |

파라미터가 붙은 Map URL은 검색 노출에서 `/` 하나로 통합한다.

---

## 4. 내비게이션

### Web

모바일은 하단 탭, 데스크톱은 상단 메뉴로 표시한다. 데스크톱의 More는 펼침 메뉴로 표시한다.

| 메뉴 | 이동 | 메뉴가 활성으로 표시되는 URL |
|---|---|---|
| Map | `/` | `/` |
| Explore | `/explore` | `/explore`, `/explore/{category}`, `/search`, `/places/{slug}` |
| Local | `/notices` | `/notices`, `/notices/{slug}`, `/events`, `/events/{slug}` |
| More | `/more` | `/more`, `/about`, `/privacy`, `/terms`, `/login`, `/signup`, `/favorites` |

- Local은 자체 URL이 없다. Local을 누르면 Notices로 이동하고, 화면 상단의 탭으로 Notices와 Events를 전환한다.
- 검색창은 Map과 Explore의 상단에 둔다. 입력하면 Search로 이동한다.

### App

| Tab | 우선순위 | 첫 화면 |
|---|---|---|
| Map | Must | Map |
| Explore | Must | Explore (가까운 순 Place 목록) |
| Local | Should | Notices |
| More | Must | More |

### 화면 간 이동

| 출발 | 동작 | 도착 |
|---|---|---|
| Map | Place Marker → Preview 카드 | Place Detail |
| Map | Event Marker → 요약 카드 | Event Detail |
| Map | Notice Marker → 요약 카드 | Notice Detail |
| Map, Explore | 검색창 입력 | Search |
| Explore, Search | 목록의 Place | Place Detail |
| Notices | 목록의 Notice | Notice Detail |
| Events | 목록의 Event | Event Detail |
| Place Detail | 지도에서 보기 | Map (`?place=`) |
| Event Detail | 지도에서 보기 | Map (`?event=`) |
| Notice Detail | 지도에서 보기 | Map (`?notice=`) |
| Place Detail | 전화, 웹사이트, 길찾기 | 외부 앱 |
| Notice Detail | 원문 열기 | 외부 (공식 출처) |

---

## 5. 분류 체계

### Place Category

| Category | UI Label | slug | 포함하는 장소 |
|---|---|---|---|
| Food | Food | `food` | 음식점, 테이크어웨이 |
| Cafe | Cafes | `cafe` | 카페, 베이커리 |
| Bar | Bars | `bar` | 바, 펍, 브루어리 |
| Activity | Activities | `activity` | 액티비티, 투어, 관광 명소 |
| Shopping | Shopping | `shopping` | 상점, 슈퍼마켓 |
| Public Facility | Facilities | `facility` | 공공시설 |

Place는 Category 하나에만 속한다.

### Public Facility의 하위 유형

Public Facility만 하위 유형을 둔다. 지도에서 Marker 아이콘을 구분하기 위한 것이며, 필터는 Category 단위까지만 제공한다.

| 하위 유형 | 예 |
|---|---|
| Toilet | 공중화장실 |
| Parking | 주차장 |
| Information | 관광 안내소, Council 사무소 |
| Library | 도서관 |
| Medical | 병원, 진료소 |
| Other | 그 밖의 공공시설 |

### Map의 Filter 칩

```text
[Food] [Cafes] [Bars] [Activities] [Shopping] [Facilities] [Events] [Notices]
```

- 여러 개를 동시에 선택할 수 있다.
- 선택한 칩이 없으면 전체를 표시한다.

### Notice 유형

| 유형 | slug |
|---|---|
| Road Work | `road-work` |
| Road Closure | `road-closure` |
| Public Notice | `public-notice` |
| Emergency | `emergency` |

### Event

Event는 MVP에서 분류하지 않는다. 날짜(Today / This Week / This Month)로만 좁힌다.

---

## 6. 화면별 정보 구성

위에서 아래로 놓이는 순서다. Wireframe은 이 순서를 기준으로 그린다.

| 화면 | 정보 |
|---|---|
| Map | 검색창 → Filter 칩 → 지도(Marker, 현재 위치) → 현재 위치 버튼 → 선택한 항목의 요약 카드 |
| Place Preview | 이름 → Category → 거리 → 영업 중 표시(Should) |
| Explore | 검색창 → Category 선택 → Place 카드 목록(이미지, 이름, Category, 주소, 거리) |
| Search | 검색창 → 결과 수 → Place 카드 목록 → 결과 없음 안내 |
| Place Detail | 이미지 → 이름, Category → 빠른 행동(전화, 웹사이트, 길찾기, 공유) → 설명 → 주소와 "지도에서 보기" → 영업시간 → 연락처, 웹사이트 → 출처 → 주변 장소(Should) |
| Notices | Notices / Events 탭 → 유형 필터(Should) → Notice 카드 목록(유형, Official 표시, 제목, 기간) |
| Notice Detail | 유형, Official 표시 → 제목 → 기간 → 요약 → 위치와 "지도에서 보기" → 출처 기관과 "원문 열기" → 수정일 → 공유 |
| Events | Notices / Events 탭 → 날짜 필터 → Event 카드 목록(이미지, 제목, 일시, 장소) |
| Event Detail | 이미지 → 제목 → 일시 → 장소와 "지도에서 보기" → 설명 → 출처 링크 → 공유 |
| More | About → Login 또는 계정(Should) → Favorites(Should) → Privacy Policy, Terms(Should) → 정보 수정 요청(Should) |
| About | 서비스 소개 → 데이터 출처 안내 |

### 상세 화면에는 지도를 넣지 않는다

Place / Event / Notice 상세에는 지도를 직접 넣지 않고 "지도에서 보기" 버튼만 둔다. 상세 화면은 검색 유입의 도착점이라 방문이 가장 많은데, 여기에 지도를 넣으면 방문마다 지도 로드가 발생한다. Mapbox의 Web 무료 구간은 월 50,000회 로드다.

### Admin

| 화면 | 정보 |
|---|---|
| 목록 (Places / Events / Notices) | 검색 → 등록 버튼 → 표(이름 또는 제목, 분류, 공개 상태, 수정일) |
| Place 등록 / 수정 | 이름, Category, 하위 유형 → 설명 → 주소, 지도의 핀으로 위치 지정 → 영업시간 → 연락처, 웹사이트 → 이미지 URL → 출처 → 공개 상태 |
| Event 등록 / 수정 | 제목 → 일시 → 장소, 지도의 핀으로 위치 지정 → 설명 → 이미지 URL → 출처 → 공개 상태 |
| Notice 등록 / 수정 | 제목, 유형 → 기간 → 요약 → 위치 설명, 지도의 핀으로 위치 지정(선택) → 출처 기관, 원문 URL, Official 여부 → 공개 상태 |

---

## 7. 다음 단계

```text
IA
 ↓
User Flow
 ↓
Wireframe
 ↓
ERD
 ↓
API Specification
```
