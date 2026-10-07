# Wireframe v1

Queenstown Local Platform MVP의 화면 배치와 정보 순서를 정의한다.

- 작성일: 2026-10-07
- 상태: v1 (확정)
- 기준 문서: [MVP Feature Definition v1](01-mvp-feature-definition.md), [Information Architecture v1](02-information-architecture.md), [User Flow v1](03-user-flow.md)

저해상도 Wireframe이다. 색, 글꼴, 아이콘은 정하지 않는다. 화면의 문구는 서비스 UI 언어인 English로 적었다.

---

## 1. 보는 방법

원본은 [wireframes/wireframe.html](wireframes/wireframe.html)이다. 브라우저로 열면 모든 화면을 실제 비율로 볼 수 있다.

이 문서의 이미지는 같은 파일에서 내보낸 것이다. HTML을 수정하면 아래 명령으로 이미지를 다시 만든다.

```bash
bash docs/wireframes/export-png.sh
```

### 표기

| 표기 | 의미 |
|---|---|
| 주황색 번호 | 화면 옆 또는 아래의 주석과 대응한다. |
| 보라색 점선과 `Should` | Should 항목이다. 나머지는 Must다. |
| X 표시 상자 | 이미지 자리 |
| 회색 막대 | 본문 텍스트 자리 |

---

## 2. 배치 결정

1. **모바일 Map은 검색창과 Filter 칩을 지도 위에 두고, 선택한 항목의 카드를 하단 탭 바로 위에 둔다.** 엄지가 닿는 아래쪽에서 상세로 넘어간다.
2. **데스크톱 Map은 선택한 항목의 카드를 지도 왼쪽 위에 띄운다.** 카드의 폭을 고정해 지도를 가리지 않는다.
3. **Place, Event, Notice는 Marker의 모양으로 구분한다.** 색에 의존하지 않는다.
4. **상세 화면은 모바일에서 한 열, 데스크톱에서 두 열이다.** 데스크톱은 오른쪽 열에 빠른 행동, 주소, 영업시간, 연락처, 출처를 모은다.
5. **상세 화면에는 지도를 넣지 않고 "View on map" 버튼을 둔다.**
6. **Notice는 유형과 Official 표시를 제목보다 먼저 보여준다.**
7. **App은 Mobile Web과 화면 구성이 같고 탭만 3개다.** 선택한 항목의 카드는 아래에서 올라오는 시트로 표시한다.
8. **Admin은 왼쪽 메뉴, 목록 표, 등록 폼으로 구성한다.** 위치는 지도의 핀으로 지정한다.

---

## 3. 화면 목록

| ID | 화면 | 플랫폼 | 우선순위 |
|---|---|---|---|
| m-map | Map | Mobile Web | Must |
| m-map-place | Map - Place 선택 | Mobile Web | Must |
| m-map-notice | Map - Notice 선택 | Mobile Web | Must |
| m-explore | Explore | Mobile Web | Must |
| m-search | Search | Mobile Web | Must |
| m-place | Place Detail | Mobile Web | Must |
| m-notices | Local - Notices | Mobile Web | Must |
| m-notice | Notice Detail | Mobile Web | Must |
| m-events | Local - Events | Mobile Web | Must |
| m-event | Event Detail | Mobile Web | Must |
| m-more | More | Mobile Web | Must |
| m-login | Login / Sign Up | Mobile Web | Should |
| m-favorites | Favorites | Mobile Web | Should |
| d-map | Map | Desktop Web | Must |
| d-explore | Explore | Desktop Web | Must |
| d-place | Place Detail | Desktop Web | Must |
| d-notices | Local - Notices | Desktop Web | Must |
| a-map | Map | App | Must |
| a-explore | Explore | App | Must |
| ad-login | Admin Login | Admin | Should |
| ad-places | Places 목록 | Admin | Should |
| ad-place-form | Place 등록 / 수정 | Admin | Should |
| ad-notice-form | Notice 등록 / 수정 | Admin | Should |

### 따로 그리지 않은 화면

다른 화면과 배치가 같아서 그리지 않았다.

| 화면 | 같은 배치를 쓰는 화면 |
|---|---|
| Desktop의 Events | d-notices |
| Desktop의 Event Detail, Notice Detail | d-place |
| Desktop의 Search | d-explore |
| App의 Search, Place Detail, Notice Detail, Event Detail | Mobile Web의 같은 화면 |
| Sign Up | m-login |
| Admin의 Events 목록, Notices 목록 | ad-places |
| Admin의 Event 등록 / 수정 | ad-notice-form |
| About, Privacy Policy, Terms | 제목과 본문만 있는 텍스트 화면 |

결과 없음, 오류, 404 화면은 [User Flow v1](03-user-flow.md)의 "상태 안내"에 정의한 문구를 해당 화면의 목록 자리에 표시한다.

---

## 4. Mobile Web

375px 폭 기준이다. 하단 탭은 Map / Explore / Local / More다.

### Map

![Map](wireframes/png/m-map.png)

![Map - Place 선택](wireframes/png/m-map-place.png)

![Map - Notice 선택](wireframes/png/m-map-notice.png)

### Explore와 Search

![Explore](wireframes/png/m-explore.png)

![Search](wireframes/png/m-search.png)

### Place Detail

![Place Detail](wireframes/png/m-place.png)

### Local

![Local - Notices](wireframes/png/m-notices.png)

![Notice Detail](wireframes/png/m-notice.png)

![Local - Events](wireframes/png/m-events.png)

![Event Detail](wireframes/png/m-event.png)

### More

![More](wireframes/png/m-more.png)

![Login / Sign Up](wireframes/png/m-login.png)

![Favorites](wireframes/png/m-favorites.png)

---

## 5. Desktop Web

1200px 폭 기준이다. 하단 탭 대신 상단 메뉴를 쓴다.

![Map (Desktop)](wireframes/png/d-map.png)

![Explore (Desktop)](wireframes/png/d-explore.png)

![Place Detail (Desktop)](wireframes/png/d-place.png)

![Local - Notices (Desktop)](wireframes/png/d-notices.png)

---

## 6. App

탭은 Map / Explore / More 3개다. Local Tab은 Should다.

![App - Map](wireframes/png/a-map.png)

![App - Explore](wireframes/png/a-explore.png)

---

## 7. Admin

데스크톱 전용이다. 전체가 Should 범위다.

![Admin Login](wireframes/png/ad-login.png)

![Places 목록](wireframes/png/ad-places.png)

![Place 등록 / 수정](wireframes/png/ad-place-form.png)

![Notice 등록 / 수정](wireframes/png/ad-notice-form.png)

---

## 8. 다음 단계

```text
Wireframe
 ↓
ERD
 ↓
API Specification
```
