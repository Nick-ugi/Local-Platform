# Seed 데이터

방문자에게 보이는 Place, Event, Notice는 `places.csv`, `events.csv`, `notices.csv`로 관리하고, 이 폴더의 스크립트로 DB에 올린다.
Admin(11주차)이 생기기 전까지는 이 파일들이 원본이다.

`places.csv`의 첫 데이터는 OpenStreetMap에서 가져왔고 ODbL을 따른다. 다시 가져오는 방법과 라이선스는 [osm/README.md](osm/README.md)에 있다.

## 파일

| 파일 | 하는 일 |
|---|---|
| `places.csv`, `events.csv`, `notices.csv` | 데이터. 한 줄이 하나다. |
| `create-staging.sql` | CSV를 받는 임시 테이블 `seed_place`, `seed_event`, `seed_notice`. 트랜잭션이 끝나면 사라진다. |
| `upsert-places.sql`, `upsert-events.sql`, `upsert-notices.sql` | 확인한 뒤 테이블에 넣거나 고친다. |
| `load-seed.sh` | 세 파일을 한 트랜잭션으로 로컬 DB에 올린다. |

## Place의 열 (`places.csv`)

UTF-8, 첫 줄은 머리줄이다. 쉼표, 큰따옴표, 줄바꿈이 든 값은 큰따옴표로 감싸고, 값 안의 큰따옴표는 두 번 쓴다(`"Coffee, ""brunch"""`). 빈 칸은 `NULL`이다.

| 열 | 필수 | 설명 |
|---|---|---|
| `slug` | O | URL에 쓰는 이름. 소문자와 숫자를 하이픈 하나로 잇는다(`lakeside-kitchen`). |
| `name` | O | 120자까지 |
| `category` | O | `food`, `cafe`, `bar`, `activity`, `shopping`, `facility` |
| `subtype` | facility만 | `toilet`, `parking`, `information`, `library`, `medical`, `other`. 다른 Category는 빈 칸 |
| `description` | | |
| `address` | O | |
| `latitude`, `longitude` | O | WGS84 십진수(`-45.0312`, `168.6626`). Queenstown 중심에서 50km 안 |
| `opening_hours` | | 화면에 보이는 그대로 적는다(`Mon - Sun · 8:00 am - 10:00 pm`) |
| `phone` | | 화면에 보이는 그대로. 숫자, 공백, `+ - ( )`만 쓰면 전화 버튼이 생긴다. |
| `website`, `image_url` | | `https://`로 시작하는 주소만 링크와 이미지가 된다. |
| `source` | O | 정보를 가져온 곳(`Business website`, `QLDC`) |
| `source_url` | O | 그 주소 |
| `status` | O | `public`이면 보이고 `private`이면 숨는다. |

## Event의 열 (`events.csv`)

| 열 | 필수 | 설명 |
|---|---|---|
| `slug`, `title` | O | |
| `description` | | |
| `starts_at` | O | 시각과 offset을 함께 적는다(`2026-10-24T17:00:00+13:00`). offset이 없으면 거부한다. 뉴질랜드는 4월 첫 일요일부터 9월 마지막 일요일 전까지 `+12:00`, 나머지는 `+13:00`이다. |
| `ends_at` | | 같은 형식. 비우면 시작한 날이 끝날 때까지 진행 중이다. |
| `venue_name` | O | 화면의 "Where" |
| `address` | | |
| `latitude`, `longitude` | O | Place와 같다 |
| `image_url` | | |
| `source`, `source_url` | O | 공식 행사 페이지 |
| `status` | O | |

## Notice의 열 (`notices.csv`)

| 열 | 필수 | 설명 |
|---|---|---|
| `slug`, `title` | O | |
| `type` | O | `road-work`, `road-closure`, `public-notice`, `emergency` |
| `summary` | O | 요약. 원문 전체를 옮기지 않는다. |
| `starts_at`, `ends_at` | `starts_at`만 | Event와 같은 형식. `ends_at`을 비우면 `private`으로 바꿀 때까지 보인다. |
| `location_name` | | 위치 설명(`Shotover Street, between Camp St and Stanley St`) |
| `latitude`, `longitude` | | 둘 다 적거나 둘 다 비운다. 비우면 목록에만 나오고 지도에는 없다. |
| `source_org`, `source_url` | O | 출처 기관과 원문 |
| `is_official` | O | 공식 기관의 공지면 `true`, 아니면 `false` |
| `status` | O | |

## 지켜야 할 것

- **출처는 필수다.** 출처와 그 주소가 없는 줄은 올라가지 않는다. 확인하지 않은 행사나 공지를 지어내지 않는다.
- **한 번 공개한 `slug`는 바꾸지 않는다.** 공유된 링크와 검색엔진의 주소가 slug다. 다시 올릴 때도 slug로 같은 행을 찾아 고친다.
- **내릴 때는 줄을 지우지 않고 `status`를 `private`으로 바꾼다.** 파일에서 빠진 줄은 DB에서 지워지지 않는다. 끝난 Event와 Notice는 그대로 두어도 목록과 지도에서 빠지고, 상세 URL은 종료 안내와 함께 남는다.
- 좌표는 위도, 경도 순이다. 지도 앱에서 복사한 값이 경도, 위도 순인지 확인한다.

## 올리기

로컬 DB가 떠 있어야 한다(`docker compose up -d db`). 저장소 루트에서 실행한다.

```bash
bash backend/seed/load-seed.sh
```

- 배포한 DB(Neon 등)에 올릴 때는 `DATABASE_URL`에 그 DB의 `postgresql://` 주소를 넣는다. 로컬에 psql이 없어도 postgres 컨테이너로 보낸다.

  ```bash
  DATABASE_URL='postgresql://user:password@host/db?sslmode=require' bash backend/seed/load-seed.sh
  ```

- 어느 파일이든 한 줄이라도 거부되면 아무것도 바뀌지 않는다. 오류에 거부된 slug가 나온다.
- 같은 파일을 다시 올리면 아무것도 바뀌지 않는다. 값이 바뀐 줄만 고치고, 그 줄의 수정일(`updated_at`)만 바뀐다.
- 접속 값은 `docker-compose.yml`과 같이 `DB_USER`, `DB_NAME` 환경 변수를 쓴다.

DB가 거부하는 값(없는 Category나 Notice 유형, facility인데 subtype이 없음, 끝이 시작보다 이름 등)은 테이블의 제약이 잡는다. 이 폴더의 SQL은 제약이 잡지 못하는 slug 형식, 중복 slug, 서비스 지역, offset 없는 시각, 위치의 절반만 있는 Notice를 확인한다.
