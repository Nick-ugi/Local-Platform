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
| `JWT_SECRET` | 개발용 값 | Access Token(JWT, HS256)의 서명 키. 32바이트 이상. 개발용 값으로 시작하면 서버가 로그에 경고를 남긴다. 운영 프로필(`prod`)에서는 개발용 값이면 서버가 시작하지 않는다. |

```bash
JWT_SECRET="$(openssl rand -base64 48)" ./gradlew bootRun
```

- Access Token은 15분, Refresh Token은 30일이다. Refresh Token은 DB에 SHA-256 해시로만 두고, 재발급할 때마다 바뀌며 이전 것은 무효가 된다.
- 비밀번호는 BCrypt로 저장한다.
- Admin 계정은 가입한 계정의 `role`을 SQL로 바꿔 만든다([admin/README.md](../admin/README.md)).
- 로그인과 가입은 10분에 20번까지다. 로그인은 주소와 이메일마다(웹 서버처럼 여러 방문자가 한 주소로 와도 서로 막지 않게), 가입은 주소마다 센다. Web은 앞단 프록시가 붙인 방문자 주소(`X-Forwarded-For`의 마지막 값)를 Backend에 넘긴다. 넘으면 429 `TOO_MANY_REQUESTS`와 `Retry-After`(초). 횟수는 서버의 메모리에 있어서 서버를 다시 켜면 처음부터 센다.

## 운영 (Docker 이미지)

배포(Render, 서버 1대)는 모두 이 폴더의 `Dockerfile`로 만든 이미지를 쓴다. 이미지는 운영 프로필(`prod`)로 뜬다.

```bash
docker build -t queenstown-api backend
docker run -p 8080:8080 \
  -e JWT_SECRET="$(openssl rand -base64 48)" \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5433/queenstown \
  -e SPRING_DATASOURCE_USERNAME=queenstown -e SPRING_DATASOURCE_PASSWORD=queenstown \
  queenstown-api
```

| 값 | 뜻 |
|---|---|
| `JWT_SECRET` | 필수. 없거나 개발용 값이면 시작하지 않는다. |
| `SPRING_DATASOURCE_URL` | JDBC 주소. Neon처럼 SSL이 필요한 DB는 끝에 `?sslmode=require`. |
| `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | DB 계정 |
| `PORT` | 서버 포트. 없으면 8080. Render는 스스로 넣는다. |

- 운영 프로필은 앞의 프록시(Caddy, Render)가 붙인 `X-Forwarded-For`, `X-Forwarded-Proto`를 믿는다. 믿는 프록시는 사설 대역과 loopback 주소뿐이라, 방문자가 헤더로 주소를 바꿀 수 없다.
- 컨테이너는 root가 아닌 사용자로 돌고, 힙은 컨테이너 메모리의 75%다.

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
