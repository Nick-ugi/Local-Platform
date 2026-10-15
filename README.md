# Queenstown Local Platform

Queenstown을 방문하는 관광객뿐만 아니라 현지 거주자, 신규 이주자, 사업자까지 사용할 수 있는 **지역 기반 통합 정보 플랫폼**을 구축한다.

단순한 관광 정보 앱이 아니라 **Map을 중심으로 Queenstown에서 실제로 필요한 정보와 장소를 연결하는 Local Platform**을 목표로 한다.

---

## 1. Project Overview

### 핵심 컨셉

> **"Queenstown에서 지금 내 주변에 무엇이 있는지 찾는다."**

서비스의 핵심 화면은 **Map**이다.

사용자는 지도에서 장소, 음식점, 카페, 바, 액티비티, 이벤트, 공공시설, 공지사항 등을 확인하고, 메뉴를 통해 지도에서 표현하기 어려운 상세 정보와 지역 콘텐츠를 탐색한다.

### 핵심 방향

- Map First
- Local Information
- Public Information
- Business Information
- Community
- Location-based Service

---

## 2. Goals

### User

Queenstown에 있는 사람이 필요한 정보를 빠르게 찾을 수 있도록 한다.

- 현재 위치 주변 장소 검색
- 음식점 / 카페 / 바 검색
- 액티비티 검색
- 이벤트 확인
- 지역 공지 확인
- 공공시설 확인
- 일자리 정보
- 지역 생활 정보
- 관심 장소 저장

### Business

지역 사업자가 자신의 사업장을 효과적으로 노출하고 관리할 수 있도록 한다.

- 사업장 등록
- 사업장 정보 관리
- 위치 기반 노출
- 이벤트 / 프로모션 등록
- 사용자에게 사업장 정보 제공

### Public

공공기관 및 지역에서 발생하는 정보를 사용자의 위치와 연결한다.

예:

```text
Road Work Notice
        ↓
Notice 등록
        ↓
해당 위치를 Map에 표시
        ↓
사용자가 지도에서 확인
```

공공정보를 별도의 행정정보 페이지로만 제공하는 것이 아니라 **실제 사용자의 위치와 연결하여 제공**하는 것을 목표로 한다.

---

## 3. Target Users

### Tourist

Queenstown을 방문한 관광객

- Restaurant
- Cafe
- Bar
- Activity
- Event
- Shopping
- Accommodation
- Transport

### Resident

Queenstown에 거주하는 사용자

- Local Event
- Local Notice
- Community
- Public Facility
- Jobs
- Local Business

### Newcomer

Queenstown에 새롭게 정착하는 사용자

- Jobs
- Accommodation
- Local Services
- Public Information
- Community
- 생활 정보

### Business

지역 사업자

- Business Registration
- Business Information
- Event
- Promotion
- Location-based Exposure

### Public / Council

공공기관 및 지역 운영기관

- Public Notice
- Road Work
- Public Facility
- Local Event
- Emergency / Important Notice

---

## 4. Core Concept — Map First

### Map = Discovery / Action

지도에서는 사용자가 **무엇이 어디에 있는지 발견하고 행동**할 수 있도록 한다.

예:

- Restaurant
- Cafe
- Bar
- Activity
- Event
- Shopping
- Accommodation
- Jobs
- Public Facility
- Road Work
- Local Notice

사용자는 지도에서 Marker를 선택하여 상세정보로 이동한다.

### Map + Information

모든 정보를 지도에 표시하는 것은 적절하지 않다.

따라서 역할을 분리한다.

**Map**

> 발견 / 위치 / 행동

- 장소
- 이벤트
- 공공시설
- 공지
- 사업장
- 교통
- 주변 정보

**Menu**

> 정보 / 탐색 / 검색

- Explore
- Local
- Jobs
- Community
- Information
- Notice
- Events
- Business

즉,

**Map = 무엇이 어디에 있는가**

**Menu = 어떤 정보를 찾아볼 것인가**

---

## 5. Initial Navigation

```text
┌──────────────────────────────┐
│             MAP              │
│                              │
│      📍   📍       📍        │
│           📍                 │
│                              │
│   [Food] [Cafe] [Event]      │
│                              │
└──────────────────────────────┘

[ Map ] [ Explore ] [ Local ] [ More ]
```

### Map

메인 화면

### Explore

장소 및 콘텐츠 탐색

### Local

지역 정보

- Notice
- Event

Jobs와 Community는 MVP 이후에 추가한다. Public Facility는 Map과 Explore의 카테고리로 제공한다.

### More

추후 확장

- Login
- My
- Favorite
- Settings
- Business
- About

---

## 6. Main Features

### 6.1 Map

- 현재 위치
- 장소 Marker
- Category Filter
- Search
- Nearby
- Place Detail
- Event Marker
- Notice Marker
- Public Facility Marker

### 6.2 Explore

장소 및 콘텐츠를 탐색한다.

- Place List
- Category
- Search
- Nearby
- Popular
- Recently Added

### 6.3 Local

지역 생활에 필요한 정보를 제공한다.

#### Notice

지역 공지사항

#### Event

지역 이벤트

#### Jobs

Queenstown 지역 채용정보

#### Community

지역 커뮤니티

#### Public

공공시설 및 공공정보

---

## 7. Public Information Layer

이 서비스의 중요한 차별점 중 하나다.

공공기관 정보를 단순히 복사하여 제공하는 것이 아니라 **위치 기반 정보로 연결한다.**

```text
QLDC / Public Data
        │
        ▼
      Notice
        │
        ├── Title
        ├── Content
        ├── Source
        ├── Updated At
        └── Location
                │
                ▼
              MAP
```

예:

> Road Work  
> Queenstown CBD  
> 2026-XX-XX ~ 2026-XX-XX

이 정보를 Notice에서 확인할 수 있을 뿐만 아니라 해당 위치를 지도에서 바로 확인할 수 있도록 한다.

공공정보에는 가능하면 다음 정보를 함께 표시한다.

- Official
- Source
- Updated At
- Effective Date

서비스가 공공기관의 공식 웹사이트를 대체하는 것이 아니라 **공공정보를 사용자 관점에서 연결하는 Layer**가 되는 것을 목표로 한다.

---

## 8. Business

사업자가 자신의 사업 정보를 등록하고 관리할 수 있도록 한다.

### Business

- Business Name
- Category
- Description
- Address
- Location
- Opening Hours
- Contact
- Website
- Images

### Future

- Event
- Promotion
- Featured Business
- Advertisement
- Business Analytics

---

## 9. Admin

서비스 운영을 위한 **Admin Web**을 별도로 구축한다.

```text
Admin
 ├── Dashboard
 ├── User
 ├── Place
 ├── Business
 ├── Event
 ├── Notice
 ├── Public Information
 └── Category
```

관리자는 데이터를 등록 / 수정 / 삭제하고 사용자에게 제공되는 정보를 관리한다.

---

## 10. Platform Architecture

Web, Mobile Web, Mobile App을 별도의 서비스로 만드는 것이 아니라 **하나의 Backend/API와 하나의 데이터 원천을 여러 Client가 공유하는 구조**로 설계한다.

```text
                    Queenstown Local Platform
                              │
              ┌───────────────┼───────────────┐
              │               │               │
            Web         Mobile Web          App
              │               │               │
              └───────────────┼───────────────┘
                              │
                          REST API
                              │
                      Spring Boot Backend
                              │
                         PostgreSQL
                              │
                            Admin
```

### 핵심 원칙

- Web / Mobile Web / App은 서로 다른 Client다.
- Backend / REST API / Database는 공유한다.
- 핵심 Domain과 데이터 구조는 App까지 고려하여 설계한다.
- 플랫폼별 UX는 동일하게 복제하지 않고 각 환경에 맞게 구성한다.
- 사업자와 관리자는 Web을 사용한다.
- Admin은 별도의 Web 화면으로 운영한다.

---

## 11. Web / Mobile Web / App Strategy

### Phase 1 — Web + Mobile Web

초기 MVP는 **Web + Mobile Web/PWA**를 중심으로 개발한다.

Web과 Mobile Web은 별도 프로젝트가 아니라 **하나의 Next.js 코드베이스를 반응형으로 구성**한다.

목적:

- 빠른 UI 검증
- 지도 UX 검증
- 검색 UX 검증
- API 검증
- 실제 사용자 시나리오 검증

모바일 웹은 최종 앱의 대체품이 아니라 **앱 개발 전 MVP Client**로 정의한다.

### Phase 2 — Mobile App Prototype

MVP와 사용자 검증을 진행하면서 **React Native + Expo** 기반 App Prototype을 개발한다.

핵심 확인 대상:

- 현재 위치
- 지도
- 주변 장소
- 빠른 행동
- Favorite
- 향후 Push Notification 확장 가능성

### Phase 3 — Mobile App MVP

Web/Mobile Web에서 검증된 핵심 기능을 App에 적용한다.

App은 MVP 이후의 선택 사항이 아니라 **12주 MVP의 목표에 포함한다.** (9주차 Prototype → 10주차 Core)

12주차의 App 배포 범위는 스토어 정식 출시가 아니라 **TestFlight / Android 내부 테스트 배포**까지로 한다.

```text
Web / Mobile Web MVP
        ↓
User Test
        ↓
UX Validation
        ↓
React Native App Prototype
        ↓
App 핵심 기능
        ↓
Web + App + Admin 통합 테스트
```

### 플랫폼별 역할

| 플랫폼 | 핵심 사용자 | 역할 |
|---|---|---|
| App | 관광객 / 주민 | 현장에서 지도·검색·주변 정보 |
| Web | 관광객 / 주민 / 사업자 | 검색·정보·공유·등록 |
| Mobile Web | 초기 사용자 | 모바일 UX 및 MVP 검증 |
| Admin Web | 운영자 / 사업자 / 기관 | 데이터 관리 |
| Backend | 전체 | API / 인증 / 비즈니스 로직 |
| DB | 전체 | 하나의 데이터 원천 |

---

## 12. Technology Stack

버전은 2026-10 기준이며, 각 프로젝트를 생성하는 시점의 최신 안정 버전을 사용한다.

### Web (Web + Mobile Web)

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- next-intl
- Vitest

공개 페이지(Place / Event / Notice)의 검색 노출(SEO)과 공유를 위해 SSR을 사용한다.

### Admin

- React
- TypeScript
- Vite (SPA)

### Mobile

- React Native
- Expo (SDK 57)

### Backend

- Java 21
- Spring Boot 4.0.x
- MyBatis
- Flyway
- Gradle
- Spring Security + JWT

Spring Boot는 MyBatis Starter가 지원하는 4.0.x를 사용한다.

### Database

- PostgreSQL
- PostGIS (Nearby / 위치 기반 검색)

### Map

- Mapbox
  - Web: Mapbox GL JS
  - App: @rnmapbox/maps

Web과 App에서 같은 지도 스타일을 사용한다.

### Infrastructure

- Docker (Docker Compose)
- Nginx

### API

- REST API

### Language

- 서비스 UI는 English를 기본으로 한다.
- 처음부터 i18n 구조를 적용하여 언어를 추가할 수 있도록 한다.

### Repository Structure

하나의 저장소(Monorepo)에서 관리한다. `web` / `admin` / `mobile` / `shared`는 npm workspaces로 묶는다.

```text
Local-Platform
 ├── backend   Spring Boot REST API
 ├── web       Next.js (Web + Mobile Web)
 ├── admin     React + Vite (Admin Web)
 ├── mobile    React Native + Expo (App)
 ├── shared    API Types / Constants / Validation
 └── docs      기획 · 설계 · 개발 기록
```

---

## 13. Initial Data Model

아래는 초기 구상이다. 테이블과 컬럼의 정의는 [ERD v1](docs/05-erd.md)을 기준으로 한다.

### Place

```text
Place
 ├── id
 ├── name
 ├── category
 ├── description
 ├── address
 ├── latitude
 ├── longitude
 ├── openingHours
 ├── phone
 ├── website
 ├── image
 ├── source
 ├── sourceUrl
 ├── status
 ├── createdAt
 └── updatedAt
```

### Notice

```text
Notice
 ├── id
 ├── title
 ├── content
 ├── category
 ├── source
 ├── sourceUrl
 ├── isOfficial
 ├── latitude
 ├── longitude
 ├── startDate
 ├── endDate
 ├── createdAt
 └── updatedAt
```

### Data Source

- Place는 직접 수집 · 등록한 데이터를 사용하고 `source` / `sourceUrl`을 기록한다.
- Google Places처럼 저장이 제한된 외부 장소 데이터는 DB에 저장하지 않는다.
- Notice / Public Information은 공식 출처 링크와 요약, 위치를 제공한다. 원문 재사용 조건은 출처별로 확인한다.
- Seed 데이터는 7~8주차 기능 개발과 병행하여 수집한다.

초기 MVP에서는 필요한 핵심 Domain부터 구현하고, 사용자 검증 결과에 따라 Domain을 확장한다.

---

## 14. MVP Scope

기능 단위의 상세 정의는 [MVP Feature Definition v1](docs/01-mvp-feature-definition.md)을 기준으로 한다.

### Must Have

```text
Map
 ├── Current Location
 ├── Marker
 ├── Category Filter
 └── Search

Place
 ├── List
 ├── Detail
 ├── Category
 └── Nearby

Local
 ├── Notice
 └── Event

Public
 └── Location-based Information

App (React Native + Expo)
 ├── Map
 ├── Place
 ├── Search
 ├── Nearby
 └── Notice / Event (Marker · Detail)
```

### Should Have

```text
User
Favorite
Basic Admin (Place / Event / Notice)
```

### Later

```text
Recent Place
Business Registration / Management
Community
Jobs
Business Promotion
Advertisement
Analytics
Push Notification
Advanced Personalization
```

### MVP 판단 기준

기능을 추가할 때 다음 질문을 기준으로 판단한다.

1. Queenstown 사용자에게 실제로 필요한가?
2. 지도와 연결했을 때 가치가 증가하는가?
3. 기존 서비스와 차별성이 있는가?
4. MVP에서 반드시 필요한가?
5. 향후 Business / Public Platform으로 확장 가능한가?

---

## 15. Development Roadmap

```text
Planning
   ↓
MVP Definition
   ↓
IA / User Flow / Wireframe / ERD / API
   ↓
Backend Foundation
   ↓
Web
   ↓
Mobile Web
   ↓
Map / Place / Event / Notice
   ↓
User Validation
   ↓
React Native App Prototype
   ↓
App Core Features
   ↓
Admin
   ↓
Web + App + Admin Integration Test
   ↓
Deployment
   ↓
MVP Release
```

### 12-Week Development Plan

| Week | Focus |
|---|---|
| 1 | 기획 확정 / MVP 범위 / 사용자 시나리오 |
| 2 | IA / User Flow / Wireframe / ERD / API |
| 3 | Spring Boot / PostgreSQL + PostGIS / MyBatis / Docker 기반 구축 |
| 4 | Next.js Web 기본 구조 / 공통 UI / API 연동 |
| 5 | Mobile Web / Responsive / Mobile UX |
| 6 | Mapbox / Current Location / Marker / Category |
| 7 | Place / List / Detail / Search / Nearby / Seed 데이터 수집 |
| 8 | Event / Notice / Public Information → Map / Seed 데이터 수집 |
| 9 | React Native + Expo App Prototype |
| 10 | App 핵심 기능 / Map / Place / Search / Notice · Event Detail |
| 11 | User / Favorite / Admin (Place · Event · Notice) / Web-App 연동 |
| 12 | 통합 테스트 / Error Handling / Security / Performance / Deployment / App 테스트 배포 / MVP Release |

세부 프로젝트 캘린더는 `PROJECT-CALENDAR.xlsx`를 기준으로 관리한다.

---

## 16. Initial Validation

현재 개발자는 한국에 있기 때문에 초기에는 실제 현지 사용자 검증에 한계가 있다.

따라서 초기 MVP는 다음 방식으로 검증한다.

1. Queenstown 실제 데이터 수집
2. Web / Mobile Web 구축
3. 실제 사용자 시나리오 테스트
4. Queenstown 관련 온라인 커뮤니티 및 사용자 피드백
5. 현지 사업자 피드백
6. 실제 방문 시 현장 테스트

초기에는 기술 완성도보다 **실제로 필요한 서비스인지 검증하는 것**을 우선한다.

---

## 17. Business Direction

서비스가 충분히 사용되기 시작하면 사업자 대상 기능을 추가한다.

### Free

- 기본 사업장 등록

### Paid

- Featured Business
- Promotion
- Event Promotion
- Advertisement
- Business Analytics

장기적으로는 Queenstown 지역 사업자들이 자신의 정보를 관리하는 **Local Business Platform**으로 확장한다.

---

## 18. Public Sector Direction

공공정보를 기반으로 충분한 사용자가 확보되면 공공기관과의 연계 가능성을 검토한다.

```text
Public Data
     ↓
Platform
     ↓
Location-based Information
     ↓
Citizen / Resident / Tourist
```

단순히 정보를 보여주는 것이 아니라 **사용자가 실제 위치에서 필요한 정보를 찾도록 연결하는 것**을 목표로 한다.

---

## 19. Future Vision

```text
                    Queenstown
                         │
            ┌────────────┼────────────┐
            │            │            │
          User        Business      Public
            │            │            │
            └────────────┼────────────┘
                         │
                  Local Platform
                         │
            ┌────────────┼────────────┐
            │            │            │
           Map       Information   Community
            │            │            │
            └────────────┼────────────┘
                         │
                    Mobile App
```

관광객용 서비스에서 시작하여,

**Tourist → Resident → Newcomer → Business → Public**

으로 사용자 범위를 확장한다.

---

## 20. Project Philosophy

이 프로젝트에서 가장 중요한 것은 **기능의 숫자가 아니다.**

> **"Queenstown에서 필요한 정보를 필요한 위치에서 찾을 수 있게 한다."**

모든 기능은 다음 질문을 기준으로 판단한다.

1. 이 정보가 Queenstown 사용자에게 실제로 필요한가?
2. 지도와 연결했을 때 가치가 증가하는가?
3. 기존 서비스와 차별성이 있는가?
4. MVP에서 반드시 필요한가?
5. 향후 Business / Public Platform으로 확장 가능한가?

---

## 21. Current Status

**Design → Development**

### Completed

- [x] 기본 서비스 아이디어
- [x] Map First 전략
- [x] Target User 정의
- [x] Web / Mobile Web / App 방향
- [x] 기본 Feature 방향
- [x] Public Information Layer
- [x] Business 방향
- [x] Admin 방향
- [x] 기술 Stack 방향
- [x] 12주 개발 로드맵
- [x] 기술 Stack / 저장소 구조 확정
- [x] MVP 범위 확정 ([MVP Feature Definition v1](docs/01-mvp-feature-definition.md))
- [x] IA ([Information Architecture v1](docs/02-information-architecture.md))
- [x] User Flow ([User Flow v1](docs/03-user-flow.md))
- [x] Wireframe ([Wireframe v1](docs/04-wireframe.md))
- [x] ERD ([ERD v1](docs/05-erd.md))
- [x] API 설계 ([API Specification v1](docs/06-api-specification.md))
- [x] 개발환경 구축 (3주차 Backend Foundation, [backend/README.md](backend/README.md))
- [x] 4주차 Web Foundation ([web/README.md](web/README.md))
- [x] 5주차 Mobile Web (하단 탭, 반응형 배치, 상세 화면의 뒤로 가기)
- [x] 6주차 Map Core (Mapbox 지도, Marker와 Preview, 필터 칩, 현재 위치)
- [x] 7주차 Place (Explore 목록과 Category, 가까운 순, 검색, 상세의 빠른 행동과 공유, "View on map", 상세의 SEO, Seed 데이터 형식)
- [x] 8주차 Event / Notice / Public (Notices / Events 목록과 상세, 지도의 Event · Notice Marker, Sitemap과 robots, About, Event · Notice Seed 형식)
- [x] 9주차 App Prototype (Expo SDK 57, Map / Explore / More 탭, Queenstown 지도와 현재 위치, 영역의 Place Marker, Android 에뮬레이터에서 확인)
- [ ] 10주차 App Core (지도의 칩과 Place · Event · Notice Marker, 요약 카드, Explore와 검색, Place · Event · Notice 상세와 빠른 행동, 공유, "View on map") — 코드와 테스트 완료, 에뮬레이터 확인 전

### Next

- [ ] 개발

---

## 22. Project Goal

실제로 운영할 서비스를 만드는 것이 목적이다. 동시에 기획 · 설계 · 개발 · 테스트 · 배포 과정을 기록하여 **포트폴리오로 사용할 수 있도록 한다.**

### Short Term

Queenstown Local Platform MVP 구축 (Web + Mobile Web + App + Admin)

### Mid Term

실제 사용자 검증 및 서비스 개선

### Long Term

Queenstown 지역의

**Tourist + Resident + Newcomer + Business + Public**

을 연결하는 Local Platform 구축.

---

## Final Direction

```text
Idea
 ↓
Planning
 ↓
MVP Definition
 ↓
Design
 ↓
Development
 ↓
Web + Mobile Web MVP
 ↓
Real User Validation
 ↓
Mobile App Prototype
 ↓
Mobile App MVP
 ↓
Business / Public Expansion
 ↓
Queenstown Local Platform
```
