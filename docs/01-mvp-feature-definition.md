# MVP Feature Definition v1

Queenstown Local Platform의 12주 MVP에서 만들 기능을 **화면과 사용자 행동 단위**로 정의한다.

- 작성일: 2026-10-07
- 상태: v1 (확정)
- 기준 문서: [README](../README.md), `PROJECT-CALENDAR.xlsx`

표의 한 줄은 개발 티켓 하나에 해당한다. 이후 IA, User Flow, Wireframe, ERD, API 설계는 이 문서의 ID를 기준으로 진행한다.

---

## 1. MVP 목표

Queenstown에 가져가서 사람들에게 직접 보여주고 써 보게 할 수 있는 MVP를 만든다.

- 관광객과 주민이 지도에서 주변 장소, 행사, 공공 공지를 찾는다.
- Web(Mobile Web 포함)과 App이 같은 API와 데이터를 사용한다.
- 실제 Queenstown 데이터로 동작한다.

---

## 2. 핵심 시나리오

| ID | 사용자 | 상황 | 흐름 | 플랫폼 |
|---|---|---|---|---|
| S1 | 관광객 | "지금 근처에서 뭐 먹지?" | 지도 → 현재 위치 → 카테고리 → Marker → 미리보기 → 상세 → 전화 / 웹사이트 / 길찾기 | Web · App |
| S2 | 주민 | "이 공사 어디지? 언제까지지?" | 지도의 Notice Marker(또는 Local의 Notice 목록) → 상세(출처, 기간) → 지도에서 위치 확인 | Web · App |
| S3 | 관광객 / 주민 | "이번 주에 무슨 행사가 있지?" | Local → Event 목록(날짜 필터) → 상세 → 지도에서 위치 확인 | Web · App |
| S4 | 여행 준비 중인 사람 | 검색엔진에서 Queenstown 장소를 검색 | 검색 결과 → Place / Event 상세 페이지 → 지도에서 주변 탐색 → 공유 | Web |
| S5 | 운영자 | 장소, 행사, 공지를 등록 | Admin 로그인 → Place / Event / Notice 등록 · 수정 → 지도에 반영 | Admin |

---

## 3. 범위 규칙

1. **로그인 없이 Must 기능을 모두 사용한다.** 로그인은 Favorite에만 필요하다.
2. **Place 카테고리는 6개로 시작한다.** Food, Cafe, Bar, Activity, Shopping, Public Facility. 데이터를 직접 수집하므로 카테고리 수가 곧 수집량이다. Accommodation과 Transport는 Later로 둔다.
3. **Public Facility는 별도 엔티티가 아니라 Place의 카테고리로 다룬다.**
4. **Notice 위치는 지점 하나로 표시한다.** 구간이나 영역 표시는 Later로 둔다. 위치가 없는 Notice는 목록에만 나온다.
5. **Search는 Place 검색만 Must로 한다.** Event와 Notice를 포함한 통합 검색은 Later로 둔다.
6. **Web 내비게이션은 Map / Explore / Local / More로 구성한다.** Local에는 Notice와 Event만 노출한다.
7. **App에서도 Notice와 Event의 Marker와 상세를 제공한다.** App의 Notice / Event 목록 화면은 Should로 둔다.

### 우선순위

| 우선순위 | 의미 |
|---|---|
| Must | 12주 MVP에 반드시 포함한다. |
| Should | User / Favorite / Admin은 11주차에 개발한다. 그 밖의 Should는 일정이 남을 때 포함한다. |
| Later | MVP 이후에 다룬다. |

### 플랫폼

| 표기 | 의미 |
|---|---|
| Web | Web + Mobile Web (하나의 Next.js 코드베이스, 반응형) |
| App | React Native + Expo |
| Admin | Admin Web (React + Vite) |

---

## 4. 화면 목록

### Web / App

| 화면 | Web | App | 설명 |
|---|---|---|---|
| Map | Must | Must | 첫 화면. 지도, Filter 칩, 검색창 |
| Place Preview | Must | Must | Map에서 Marker를 눌렀을 때 나오는 요약 카드 |
| Explore | Must | Must | Place 목록 |
| Search | Must | Must | Place 검색과 결과 |
| Place Detail | Must | Must | 장소 상세 |
| Local | Must | Should | Notice 목록과 Event 목록을 탭으로 전환 |
| Notice Detail | Must | Must | 공지 상세 |
| Event Detail | Must | Must | 행사 상세 |
| More | Must | Must | About 등 |
| Login / Sign Up | Should | Should | 로그인과 회원가입 |
| Favorites | Should | Should | 저장한 장소 목록 |

### Admin

| 화면 | 우선순위 | 설명 |
|---|---|---|
| Admin Login | Should | 관리자 로그인 |
| Place 관리 | Should | 목록, 등록, 수정 |
| Event 관리 | Should | 목록, 등록, 수정 |
| Notice 관리 | Should | 목록, 등록, 수정 |

---

## 5. Feature 목록

### 5.1 NAV / COMMON

| ID | Feature | 화면 | 사용자 행동 | 우선순위 | 플랫폼 |
|---|---|---|---|---|---|
| NAV-01 | Web 내비게이션 | 전체 | Map / Explore / Local / More 사이를 이동한다. (모바일은 하단 탭, 데스크톱은 상단 메뉴) | Must | Web |
| NAV-02 | App 내비게이션 | 전체 | Map / Explore / More 탭 사이를 이동한다. | Must | App |
| COMMON-01 | 위치 권한 처리 | Map, Explore | 위치 권한을 거부하거나 서비스 지역 밖에 있어도 Queenstown 중심을 기준으로 지도와 목록을 본다. | Must | Web · App |
| COMMON-02 | 상태 안내 | 전체 | 로딩 중, 결과 없음, 오류를 안내받고 다시 시도한다. | Must | Web · App |
| COMMON-03 | 반응형 화면 | 전체 | 모바일 브라우저에서 데스크톱과 같은 기능을 사용한다. | Must | Web |
| COMMON-04 | i18n 구조 | 전체 | UI 문구를 English로 본다. (문구는 언어 파일로 분리한다) | Must | Web · App |
| COMMON-05 | 공유 | Place Detail, Event Detail, Notice Detail | 상세 페이지 링크를 복사하거나 공유한다. | Must | Web · App |

### 5.2 MAP

| ID | Feature | 화면 | 사용자 행동 | 우선순위 | 플랫폼 |
|---|---|---|---|---|---|
| MAP-01 | 지도 표시 | Map | 서비스를 열면 Queenstown 지도를 본다. | Must | Web · App |
| MAP-02 | 현재 위치 | Map | 내 위치를 지도에서 확인하고, 버튼으로 내 위치로 돌아온다. | Must | Web · App |
| MAP-03 | Place Marker | Map | 보이는 영역의 장소를 카테고리별 Marker로 본다. | Must | Web · App |
| MAP-04 | Filter 칩 | Map | 칩(카테고리 6개, Event, Notice)을 눌러 해당 Marker만 본다. | Must | Web · App |
| MAP-05 | Place Preview | Map, Place Preview | Place Marker를 눌러 이름, 카테고리, 거리가 담긴 카드를 보고, 카드를 눌러 상세로 이동한다. | Must | Web · App |
| MAP-06 | Event Marker | Map | 예정되었거나 진행 중인 Event를 Marker로 보고, 눌러서 요약 카드를 거쳐 상세로 이동한다. | Must | Web · App |
| MAP-07 | Notice Marker | Map | 유효 기간 안의 Notice를 Marker로 보고, 눌러서 요약 카드를 거쳐 상세로 이동한다. | Must | Web · App |
| MAP-08 | 영역 기준 갱신 | Map | 지도를 이동하거나 확대하면 보이는 영역의 Marker가 갱신된다. | Must | Web · App |
| MAP-09 | Marker Clustering | Map | 지도를 축소하면 겹치는 Marker를 묶음으로 본다. | Should | Web · App |

### 5.3 PLACE

| ID | Feature | 화면 | 사용자 행동 | 우선순위 | 플랫폼 |
|---|---|---|---|---|---|
| PLACE-01 | Place List | Explore | 장소 목록(이름, 카테고리, 주소, 이미지)을 본다. | Must | Web · App |
| PLACE-02 | Category 필터 | Explore | 카테고리를 골라 목록을 좁힌다. | Must | Web · App |
| PLACE-03 | Nearby 정렬 | Explore | 가까운 순으로 보고 각 장소까지의 거리를 확인한다. | Must | Web · App |
| PLACE-04 | Place Detail | Place Detail | 이름, 카테고리, 설명, 주소, 영업시간, 연락처, 웹사이트, 이미지, 출처를 본다. | Must | Web · App |
| PLACE-05 | 빠른 행동 | Place Detail | 전화 걸기, 웹사이트 열기, 길찾기(외부 지도 앱)를 실행한다. | Must | Web · App |
| PLACE-06 | 지도에서 보기 | Place Detail | 해당 장소가 선택된 상태의 Map으로 이동한다. | Must | Web · App |
| PLACE-07 | 영업 중 표시 | Place Preview, Place Detail | 지금 영업 중인지 확인한다. | Should | Web · App |
| PLACE-08 | 주변 장소 | Place Detail | 상세 하단에서 가까운 다른 장소를 본다. | Should | Web · App |

### 5.4 SEARCH

| ID | Feature | 화면 | 사용자 행동 | 우선순위 | 플랫폼 |
|---|---|---|---|---|---|
| SEARCH-01 | Place 검색 | Search | Map이나 Explore의 검색창에 이름이나 키워드를 입력한다. | Must | Web · App |
| SEARCH-02 | 검색 결과 | Search | 결과 목록에서 장소를 골라 상세로 이동한다. | Must | Web · App |
| SEARCH-03 | 결과 지도 보기 | Search, Map | 검색 결과를 지도의 Marker로 본다. | Should | Web · App |

### 5.5 EVENT

| ID | Feature | 화면 | 사용자 행동 | 우선순위 | 플랫폼 |
|---|---|---|---|---|---|
| EVENT-01 | Event List | Local | 예정되었거나 진행 중인 행사를 날짜순으로 본다. | Must | Web |
| EVENT-02 | 날짜 필터 | Local | 오늘 / 이번 주 / 이번 달로 좁힌다. | Must | Web |
| EVENT-03 | Event Detail | Event Detail | 제목, 일시, 장소, 설명, 이미지, 출처 링크를 본다. | Must | Web · App |
| EVENT-04 | 지도에서 보기 | Event Detail | 행사 위치가 선택된 상태의 Map으로 이동한다. | Must | Web · App |
| EVENT-05 | 기간 기준 노출 | Local, Map | 종료된 행사는 목록과 지도에 나오지 않는다. | Must | Web · App |

### 5.6 NOTICE

Notice 유형은 Road Work, Road Closure, Public Notice, Emergency로 한다.

| ID | Feature | 화면 | 사용자 행동 | 우선순위 | 플랫폼 |
|---|---|---|---|---|---|
| NOTICE-01 | Notice List | Local | 유효한 공지를 최신순으로 본다. | Must | Web |
| NOTICE-02 | Notice Detail | Notice Detail | 제목, 유형, 요약, 기간, 위치, 출처 기관, 수정일, Official 표시를 본다. | Must | Web · App |
| NOTICE-03 | 원문 열기 | Notice Detail | 공식 출처 페이지를 연다. | Must | Web · App |
| NOTICE-04 | 지도에서 보기 | Notice Detail | 공지 위치가 선택된 상태의 Map으로 이동한다. | Must | Web · App |
| NOTICE-05 | 기간 기준 노출 | Local, Map | 종료된 공지는 목록과 지도에 나오지 않는다. | Must | Web · App |
| NOTICE-06 | 유형 필터 | Local | 유형으로 목록을 좁힌다. | Should | Web |

### 5.7 SEO

| ID | Feature | 화면 | 사용자 행동 | 우선순위 | 플랫폼 |
|---|---|---|---|---|---|
| SEO-01 | 상세 페이지 SSR | Place Detail, Event Detail, Notice Detail | 검색 결과나 공유 링크에서 상세 페이지로 바로 들어온다. (고유 URL, title, description, Open Graph 태그) | Must | Web |
| SEO-02 | Sitemap / robots | 없음 | 검색엔진이 상세 페이지를 수집한다. | Must | Web |

### 5.8 MORE

| ID | Feature | 화면 | 사용자 행동 | 우선순위 | 플랫폼 |
|---|---|---|---|---|---|
| MORE-01 | About | More | 서비스 소개와 데이터 출처 안내를 본다. | Must | Web · App |
| MORE-02 | 정보 수정 요청 | More, Place Detail | 잘못된 정보를 이메일로 알린다. | Should | Web · App |
| MORE-03 | Privacy Policy / Terms | More | 개인정보 처리방침과 이용약관을 본다. | Should | Web · App |

### 5.9 APP 전용

| ID | Feature | 화면 | 사용자 행동 | 우선순위 | 플랫폼 |
|---|---|---|---|---|---|
| APP-01 | Local 탭 | Local | App에서 Notice 목록과 Event 목록을 본다. | Should | App |

### 5.10 USER / FAVORITE

로그인은 이메일과 비밀번호 방식으로 한다.

| ID | Feature | 화면 | 사용자 행동 | 우선순위 | 플랫폼 |
|---|---|---|---|---|---|
| USER-01 | 회원가입 | Login / Sign Up | 이메일과 비밀번호로 가입한다. | Should | Web · App |
| USER-02 | 로그인 / 로그아웃 | Login / Sign Up, More | 로그인하고 로그아웃한다. | Should | Web · App |
| FAV-01 | Favorite 추가 / 해제 | Place Detail | 장소를 저장하거나 해제한다. | Should | Web · App |
| FAV-02 | Favorite 목록 | Favorites | 저장한 장소를 모아 본다. | Should | Web · App |

### 5.11 ADMIN

Admin이 완성되기 전(7~10주차)에는 Seed SQL로 데이터를 넣는다. 이미지는 URL로 입력한다.

| ID | Feature | 화면 | 사용자 행동 | 우선순위 | 플랫폼 |
|---|---|---|---|---|---|
| ADMIN-01 | Admin 로그인 | Admin Login | 관리자 계정으로 로그인한다. | Should | Admin |
| ADMIN-02 | Place 관리 | Place 관리 | 장소를 등록 · 수정 · 비공개 처리하고, 지도에서 핀으로 위치를 지정한다. | Should | Admin |
| ADMIN-03 | Event 관리 | Event 관리 | 행사를 등록 · 수정 · 비공개 처리하고, 일시와 위치를 지정한다. | Should | Admin |
| ADMIN-04 | Notice 관리 | Notice 관리 | 공지를 등록 · 수정 · 비공개 처리하고, 유형, 출처, 기간, 위치를 지정한다. | Should | Admin |

---

## 6. Later

MVP에서 만들지 않는다.

| 영역 | 항목 |
|---|---|
| Place | Accommodation / Transport 카테고리, Popular / Recently Added 정렬, 리뷰와 평점, Recent Place |
| Notice | 구간 · 영역 표시 |
| Search | 통합 검색(Event / Notice), 최근 검색어 |
| User | 소셜 로그인, 비밀번호 재설정, Advanced Personalization |
| Business | Business 등록 / 관리, Promotion, Advertisement, Analytics |
| Local | Community, Jobs |
| App | Push Notification, Offline, Open in App(Deep Link), 스토어 정식 출시 |
| Language | 추가 언어와 언어 전환 UI |
| Admin | Dashboard, User 관리, Category 관리, 이미지 업로드 |

---

## 7. MVP 데이터 기준

| 항목 | 기준 |
|---|---|
| 지역 | Queenstown CBD, Frankton |
| Place | 100개 이상, 카테고리 6개를 모두 포함 |
| Event | 10개 이상 |
| Notice | 10개 이상 |

모든 데이터에 출처(`source`, `sourceUrl`)를 기록한다. 수집은 7~8주차 기능 개발과 병행한다.

---

## 8. 주차별 Feature

| 주차 | Focus | Feature |
|---|---|---|
| 4 | Web Foundation | NAV-01, COMMON-02, COMMON-04 |
| 5 | Mobile Web | COMMON-03 |
| 6 | Map Core | MAP-01 ~ MAP-05, MAP-08, COMMON-01 |
| 7 | Place | PLACE-01 ~ PLACE-06, SEARCH-01 ~ SEARCH-02, COMMON-05, SEO-01(Place) |
| 8 | Event / Notice / Public | EVENT-01 ~ EVENT-05, NOTICE-01 ~ NOTICE-05, MAP-06 ~ MAP-07, SEO-01(Event / Notice), SEO-02, MORE-01 |
| 9 | App Prototype | NAV-02, MAP-01 ~ MAP-03 (App) |
| 10 | App Core | MAP-04 ~ MAP-08, PLACE-01 ~ PLACE-06, SEARCH-01 ~ SEARCH-02, EVENT-03 ~ EVENT-05, NOTICE-02 ~ NOTICE-05, COMMON-01 ~ COMMON-02, COMMON-04 ~ COMMON-05, MORE-01 (App) |
| 11 | User / Favorite / Admin | USER-01 ~ USER-02, FAV-01 ~ FAV-02, ADMIN-01 ~ ADMIN-04 |
| 12 | Integration / Release | 통합 테스트, 남은 Should |
| 13 | UX Polish | PLACE-07, MAP-09 (Web · App), MORE-02 ~ MORE-03 (App) |

10주차의 작업량이 가장 많다. 13주차는 12주 MVP 뒤에 남은 Should를 Web과 App에 마저 넣고 사용성을 다듬는 주다([계획](plans/2026-10-27-week13-ux-polish.md)).

---

## 9. 시나리오별 Feature와 완료 기준

| 시나리오 | Feature | 완료 기준 |
|---|---|---|
| S1 | MAP-01 ~ MAP-05, MAP-08, PLACE-04 ~ PLACE-06, COMMON-01 | 모바일 브라우저와 App에서 지도를 열고 카테고리를 골라 Marker → 미리보기 → 상세 → 길찾기까지 도달한다. 위치 권한을 거부해도 같은 흐름이 동작한다. |
| S2 | MAP-07, NOTICE-01 ~ NOTICE-05 | 위치가 있는 유효한 Notice가 지도에 Marker로 보이고, 상세에서 출처, 기간, Official 표시를 확인한 뒤 지도에서 위치를 본다. 종료된 Notice는 보이지 않는다. |
| S3 | EVENT-01 ~ EVENT-05, MAP-06 | Event 목록에 "이번 주" 필터를 적용하고, 상세와 지도 위치를 확인한다. 종료된 Event는 보이지 않는다. |
| S4 | SEO-01 ~ SEO-02, PLACE-04, PLACE-06, EVENT-03, COMMON-05 | Place / Event 상세 URL을 직접 열면 서버에서 렌더링된 본문과 title, description, Open Graph 태그가 응답에 포함된다. |
| S5 | ADMIN-01 ~ ADMIN-04 | Admin에서 등록한 Place / Event / Notice가 Web과 App의 지도와 목록에 나타난다. |

---

## 10. 다음 단계

```text
MVP Feature Definition v1
        ↓
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
