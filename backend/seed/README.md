# Seed 데이터

방문자에게 보이는 Place는 `places.csv` 한 파일로 관리하고, 이 폴더의 스크립트로 DB에 올린다.
Admin(11주차)이 생기기 전까지는 이 파일이 Place의 원본이다.

## 파일

| 파일 | 하는 일 |
|---|---|
| `places.csv` | Place 데이터. 한 줄이 Place 하나다. |
| `create-staging.sql` | CSV를 받는 임시 테이블 `seed_place`. 트랜잭션이 끝나면 사라진다. |
| `upsert-places.sql` | 확인한 뒤 `place`에 넣거나 고친다. |
| `load-places.sh` | 위 셋을 한 트랜잭션으로 로컬 DB에 실행한다. |

## 열

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

## 지켜야 할 것

- **출처는 필수다.** `source`와 `source_url`이 없는 줄은 올라가지 않는다.
- **한 번 공개한 `slug`는 바꾸지 않는다.** 공유된 링크와 검색엔진의 주소가 slug다. 다시 올릴 때도 slug로 같은 행을 찾아 고친다.
- **Place를 내릴 때는 줄을 지우지 않고 `status`를 `private`으로 바꾼다.** 파일에서 빠진 줄은 DB에서 지워지지 않는다.
- 좌표는 위도, 경도 순이다. 지도 앱에서 복사한 값이 경도, 위도 순인지 확인한다.

## 올리기

로컬 DB가 떠 있어야 한다(`docker compose up -d db`). 저장소 루트에서 실행한다.

```bash
bash backend/seed/load-places.sh
```

- 한 줄이라도 거부되면 아무것도 바뀌지 않는다. 오류에 거부된 slug가 나온다.
- 같은 파일을 다시 올리면 아무것도 바뀌지 않는다. 값이 바뀐 줄만 고치고, 그 줄의 수정일(`updated_at`)만 바뀐다.
- 접속 값은 `docker-compose.yml`과 같이 `DB_USER`, `DB_NAME` 환경 변수를 쓴다.

DB가 거부하는 값(없는 Category, facility인데 subtype이 없음 등)은 `place` 테이블의 제약이 잡는다. 이 폴더의 SQL은 제약이 잡지 못하는 slug 형식, 중복 slug, 서비스 지역을 확인한다.
