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
 └── place           Place API

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
