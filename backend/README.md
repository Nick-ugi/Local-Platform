# Backend

Queenstown Local Platform의 REST API 서버다. Web, App, Admin이 함께 사용한다.

- Java 21, Spring Boot 4.0, Gradle
- MyBatis (XML Mapper), Flyway
- PostgreSQL 17 + PostGIS 3.5

API와 데이터 구조는 [API Specification v1](../docs/06-api-specification.md)과 [ERD v1](../docs/05-erd.md)을 기준으로 한다.

## 필요한 것

- Java 21
- Docker (로컬 DB와 테스트에 쓴다)

## 로컬 DB

저장소 루트에서 실행한다. PostGIS가 5433번 포트로 뜬다.

```bash
docker compose up -d db
```

접속 값의 기본값은 루트의 `.env.example`과 같다. 값을 바꾸려면 `.env.example`을 `.env`로 복사해 수정한다. `.env`는 커밋하지 않는다.

Docker Compose는 `.env`를 읽지만 서버는 읽지 않는다. 값을 바꿨으면 서버에도 같은 값을 환경 변수로 넘긴다.

```bash
DB_PORT=5434 ./gradlew bootRun
```

DB에 접속하지 못하면 서버는 몇 초 안에 `Unable to obtain connection from database`를 남기고 종료한다.

DB를 직접 볼 때:

```bash
docker compose exec db psql -U queenstown -d queenstown
```

DB를 멈출 때:

```bash
docker compose stop db
```

## 서버 실행

```bash
cd backend
./gradlew bootRun
```

서버는 8080번 포트로 뜬다. 시작할 때 Flyway가 `src/main/resources/db/migration`의 Migration을 적용한다.

```bash
curl http://localhost:8080/actuator/health
```

## 로그인과 토큰

`/me`로 시작하는 API는 로그인이, `/admin`으로 시작하는 API는 `role`이 `admin`인 계정이 필요하다(Spring Security). 공개 API는 그대로 열려 있다.

| 값 | 기본값 | 뜻 |
|---|---|---|
| `JWT_SECRET` | 개발용 값 | Access Token(JWT, HS256)의 서명 키. 32바이트 이상. 개발용 값으로 시작하면 서버가 로그에 경고를 남긴다. 배포에서는 반드시 넘긴다. |

```bash
JWT_SECRET="$(openssl rand -base64 48)" ./gradlew bootRun
```

- Access Token은 15분, Refresh Token은 30일이다. Refresh Token은 DB에 SHA-256 해시로만 두고, 재발급할 때마다 바뀌며 이전 것은 무효가 된다.
- 비밀번호는 BCrypt로 저장한다.
- Admin 계정은 가입한 계정의 `role`을 SQL로 바꿔 만든다([admin/README.md](../admin/README.md)).

## Seed 데이터

방문자에게 보이는 Place, Event, Notice는 `seed/`의 CSV에 두고 저장소 루트에서 올린다. 열의 뜻과 지켜야 할 것은 [seed/README.md](seed/README.md)에 있다.

```bash
bash backend/seed/load-seed.sh
```

한 트랜잭션으로 실행하므로 한 줄이라도 거부되면 아무것도 바뀌지 않는다. 같은 파일을 다시 올려도 값이 바뀐 줄만 고친다.

## 테스트

Docker가 실행 중이어야 한다. 테스트는 Testcontainers로 PostGIS를 따로 띄우므로 로컬 DB의 데이터를 건드리지 않는다.

```bash
cd backend
./gradlew test
```

## 구조

```text
src/main/java/com/queenstownlocal/backend
 ├── common/error    오류 코드와 Problem Details 응답
 ├── common/slug     이름과 제목에서 slug 만들기
 ├── security        접근 규칙, JWT 발급과 검증
 ├── auth            가입, 로그인, 재발급, 로그아웃
 ├── me              내 계정과 Favorite
 ├── admin           Admin API (Place, Event, Notice 등록과 수정)
 ├── map             Map API (지도 영역의 Marker)
 ├── place           Place API (목록, 검색, 상세), Category 코드
 ├── event, notice   Event / Notice API
 └── sitemap         Sitemap API

seed                 Place, Event, Notice의 Seed 데이터와 올리는 스크립트

src/main/resources
 ├── application.yml
 ├── db/migration    Flyway Migration
 └── mapper          MyBatis XML Mapper
```

기능별로 패키지를 나눈다. 한 기능의 Controller, Service, Mapper, 응답 타입을 같은 패키지에 둔다.

## 오류 응답

모든 오류는 `application/problem+json`이고 `code`로 종류를 구분한다. 서비스에서는 `ApiException`에 `ErrorCode`를 담아 던진다.

```java
throw new ApiException(ErrorCode.NOT_FOUND, "Place not found.");
```
