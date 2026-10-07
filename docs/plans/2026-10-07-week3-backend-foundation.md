# Week 3 Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backend가 로컬에서 실행되어 PostGIS에 DB Schema v1을 적용하고, 공통 오류 형식과 첫 API(`GET /api/v1/places/{slug}`)로 API와 DB가 연결된 것을 증명한다.

**Architecture:** `backend/`에 Spring Boot 프로젝트를 만든다. 스키마는 Flyway Migration 하나로 적용하고, 조회는 MyBatis XML Mapper로 한다. 패키지는 기능별(`place`, `common/error`)로 나눈다. 테스트는 Testcontainers로 띄운 실제 PostGIS에서 돌린다.

**Tech Stack:** Java 21, Spring Boot 4.0.8, Gradle, MyBatis Spring Boot Starter 4.0.1, Flyway, PostgreSQL 17 + PostGIS 3.5, Testcontainers, Docker Compose

**Spec:** [docs/05-erd.md](../05-erd.md), [docs/06-api-specification.md](../06-api-specification.md). 캘린더 3주차의 완료 기준은 "API 서버 로컬 실행 및 DB 연결 완료"다.

## Global Constraints

- Java 21, Spring Boot 4.0.8. MyBatis Starter가 4.1을 지원하지 않으므로 4.0.x를 유지한다.
- 패키지 루트는 `com.queenstownlocal.backend`, 프로젝트 위치는 `backend/`다.
- PostGIS 이미지는 `postgis/postgis:17-3.5` 하나만 쓴다. 로컬 DB와 테스트가 같은 이미지를 쓴다.
- 로컬 DB의 호스트 포트는 5433이다. 5432는 이 PC의 다른 PostgreSQL 컨테이너가 쓰고 있다. API는 8080을 쓴다.
- 스키마는 `docs/05-erd.md` 7장의 DDL을 한 글자도 바꾸지 않고 옮긴다.
- API의 Base URL은 `/api/v1`이다. 필드는 camelCase, 값이 없는 필드는 `null`로 내려준다. 시각은 ISO 8601 UTC다.
- 오류는 `application/problem+json`이고 `code`가 반드시 있다. 코드와 상태는 `docs/06-api-specification.md` 1장의 표를 따른다.
- MyBatis는 XML Mapper(`src/main/resources/mapper/*.xml`)를 쓴다.
- `.env`는 커밋하지 않는다. `.env.example`만 커밋한다.
- 커밋 메시지는 영어로 쓰고 마지막 줄에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`를 붙인다.
- 테스트를 돌리려면 Docker가 실행 중이어야 한다. 첫 실행은 Gradle 배포판, 의존성, PostGIS 이미지(압축 약 208MB)를 내려받는다.

## Review Focus

1. **없는 경로나 지원하지 않는 Method로 호출한다.** HTML 오류 화면이나 빈 본문이 아니라 `code`가 있는 Problem Details가 와야 한다. → Task 3
2. **`slug` 자리에 따옴표, 아주 긴 문자열 같은 값이 들어온다.** 500이 아니라 404여야 한다. → Task 4
3. **개발 PC의 시간대가 한국이다.** 응답의 `updatedAt`은 저장한 시각과 같은 순간이어야 하고 `Z`로 끝나야 한다. → Task 4
4. **위도와 경도가 뒤바뀐다.** PostGIS는 경도를 먼저 받는다. 저장한 좌표가 그대로 돌아와야 한다. → Task 2, Task 4
5. **이미 스키마가 적용된 DB로 서버를 다시 시작한다.** Migration이 다시 실행되거나 실패하지 않아야 한다. → Task 2

---

## File Structure

```text
.gitignore                                   OS, IDE, .env, node_modules
.env.example                                 로컬 DB 접속 값의 예시
docker-compose.yml                           로컬 PostGIS

backend/
 ├── build.gradle, settings.gradle, gradlew  Spring Initializr가 만든다
 ├── README.md                               실행 방법
 └── src
      ├── main/java/com/queenstownlocal/backend
      │    ├── BackendApplication.java
      │    ├── common/error/ErrorCode.java            오류 코드와 HTTP 상태
      │    ├── common/error/ApiException.java         코드를 가진 예외
      │    ├── common/error/GlobalExceptionHandler.java  예외 → Problem Details
      │    └── place
      │         ├── PlaceDetail.java                  Place 상세 응답
      │         ├── PlaceMapper.java                  MyBatis Mapper
      │         ├── PlaceService.java                 없으면 NOT_FOUND
      │         └── PlaceController.java              GET /api/v1/places/{slug}
      ├── main/resources
      │    ├── application.yml
      │    ├── db/migration/V1__init_schema.sql       DB Schema v1
      │    └── mapper/PlaceMapper.xml
      └── test/java/com/queenstownlocal/backend
           ├── TestcontainersConfiguration.java       PostGIS 컨테이너
           ├── BackendApplicationTests.java           컨텍스트 기동
           ├── support/TestData.java                  테스트 데이터 입력
           ├── schema/SchemaMigrationTest.java
           ├── schema/SpatialQueryTest.java
           ├── common/error/ErrorProbeController.java 오류를 일으키는 테스트용 Controller
           ├── common/error/ErrorResponseTest.java
           └── place/PlaceDetailApiTest.java
```

---

### Task 1: PostGIS에 붙어 기동하는 Backend 프로젝트

**Files:**
- Create: `.gitignore`
- Create: `backend/` (Spring Initializr 생성물 전체)
- Modify: `backend/src/test/java/com/queenstownlocal/backend/TestcontainersConfiguration.java`
- Modify: `backend/src/main/resources/application.yml` (`application.properties`를 대체)
- Test: `backend/src/test/java/com/queenstownlocal/backend/BackendApplicationTests.java` (생성물)

**Interfaces:**
- Produces: `TestcontainersConfiguration` — 테스트가 `@Import`해서 PostGIS에 붙는다. 이후 모든 통합 테스트가 쓴다.
- Produces: `./gradlew test`가 `backend/`에서 통과하는 상태

- [ ] **Step 1: 브랜치를 만들고 계획 문서를 커밋한다**

```bash
git checkout -b feat/backend-foundation
git add docs/plans/2026-10-07-week3-backend-foundation.md docs/06-api-specification.md
git commit -m "Add week 3 backend foundation plan"
```

- [ ] **Step 2: 루트 `.gitignore`를 만든다**

```gitignore
# OS
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/
*.iml

# Environment
.env
.env.*
!.env.example

# Office lock files
~$*

# Node
node_modules/
```

- [ ] **Step 3: Spring Initializr로 프로젝트를 만든다**

```bash
curl -sSL "https://start.spring.io/starter.zip?type=gradle-project&language=java&bootVersion=4.0.8&javaVersion=21&groupId=com.queenstownlocal&artifactId=backend&name=backend&packageName=com.queenstownlocal.backend&dependencies=web,validation,actuator,mybatis,postgresql,flyway,testcontainers" -o backend.zip
unzip -q backend.zip -d backend && rm backend.zip
rm backend/HELP.md
```

`backend/build.gradle`에 아래 의존성이 있는지 확인한다. 다르면 멈추고 보고한다.

```text
org.springframework.boot:spring-boot-starter-webmvc
org.springframework.boot:spring-boot-starter-validation
org.springframework.boot:spring-boot-starter-actuator
org.springframework.boot:spring-boot-starter-flyway
org.flywaydb:flyway-database-postgresql
org.mybatis.spring.boot:mybatis-spring-boot-starter:4.0.1
org.testcontainers:testcontainers-postgresql
```

- [ ] **Step 4: 테스트 컨테이너의 이미지를 PostGIS로 바꾼다**

`TestcontainersConfiguration`의 컨테이너 Bean에서 이미지만 바꾼다. 나머지는 생성된 그대로 둔다.

```java
DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres")
```

- [ ] **Step 5: `application.properties`를 지우고 `application.yml`을 만든다**

```yaml
spring:
  application:
    name: backend
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5433}/${DB_NAME:queenstown}
    username: ${DB_USER:queenstown}
    password: ${DB_PASSWORD:queenstown}
  mvc:
    problemdetails:
      enabled: true

mybatis:
  mapper-locations: classpath:mapper/*.xml
  configuration:
    map-underscore-to-camel-case: true
    arg-name-based-constructor-auto-mapping: true

management:
  endpoints:
    web:
      exposure:
        include: health
```

- [ ] **Step 6: 테스트를 돌린다**

Run: `cd backend && ./gradlew test`
Expected: `BUILD SUCCESSFUL`. `BackendApplicationTests`가 PostGIS 컨테이너에 붙어 통과한다.

- [ ] **Step 7: 커밋한다**

```bash
git add .gitignore backend
git commit -m "Scaffold Spring Boot backend that boots against PostGIS"
```

---

### Task 2: DB Schema v1과 로컬 DB

**Files:**
- Create: `backend/src/main/resources/db/migration/V1__init_schema.sql`
- Create: `docker-compose.yml`, `.env.example`
- Create: `backend/src/test/java/com/queenstownlocal/backend/support/TestData.java`
- Test: `backend/src/test/java/com/queenstownlocal/backend/schema/SchemaMigrationTest.java`
- Test: `backend/src/test/java/com/queenstownlocal/backend/schema/SpatialQueryTest.java`

**Interfaces:**
- Consumes: `TestcontainersConfiguration` (Task 1)
- Produces: 테이블 `place`, `event`, `notice`, `app_user`, `favorite`, `refresh_token`
- Produces: `TestData.insertPlace(JdbcClient jdbc, String slug, String category, String subtype, double latitude, double longitude, String status)` — `name`은 `slug`와 같게, `address`는 `"addr"`, `source`는 `"test"`, `source_url`은 `"https://example.com"`으로 넣는다. 위치는 `ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography`로 넣는다.

테스트 클래스는 `@SpringBootTest`, `@Import(TestcontainersConfiguration.class)`, `@Transactional`을 붙이고 `JdbcClient`로 SQL을 실행한다.

- [ ] **Step 1: 스키마 테스트를 쓴다**

`SchemaMigrationTest`

```java
@Test void createsTheSixTables() {
    assertThat(tableNames()).containsExactly(
        "app_user", "event", "favorite", "notice", "place", "refresh_token");
}   // information_schema.tables, table_schema = 'public', 위 여섯 이름만 조회해 이름순 정렬

@Test void locationColumnsAreGeography() {
    assertThat(tablesWithGeographyLocation()).containsExactly("event", "notice", "place");
}   // information_schema.columns, column_name = 'location', udt_name = 'geography'

@Test void migrationRunsOnceAndIsRestartSafe() {
    assertThat(flyway.info().applied()).hasSize(1);
    assertThat(flyway.migrate().migrationsExecuted).isZero();
}

@Test void rejectsFacilityWithoutSubtype() {
    assertThatThrownBy(() -> TestData.insertPlace(jdbc, "f1", "facility", null, -45.0312, 168.6626, "public"))
        .isInstanceOf(DataIntegrityViolationException.class);
}

@Test void rejectsSubtypeOnNonFacility() {
    assertThatThrownBy(() -> TestData.insertPlace(jdbc, "f2", "food", "toilet", -45.0312, 168.6626, "public"))
        .isInstanceOf(DataIntegrityViolationException.class);
}

@Test void rejectsSameEmailInAnotherCase() {
    insertUser("a@example.com");
    assertThatThrownBy(() -> insertUser("A@Example.com"))
        .isInstanceOf(DataIntegrityViolationException.class);
}

@Test void rejectsEventEndingBeforeItStarts() { /* starts_at 2026-10-09T05:00Z, ends_at 2026-10-08T05:00Z */ }

@Test void acceptsNoticeWithoutLocation() { /* location 없이 insert, 1행 */ }
```

- [ ] **Step 2: 위치 조회 테스트를 쓴다**

`SpatialQueryTest`. `docs/05-erd.md` 8장의 조회 두 개를 그대로 실행한다. 지금까지 실행해 보지 못한 부분이다.

```java
// A: Queenstown 중심, B: 약 170m, C: Frankton 약 5.6km, D: A 근처이지만 private
@BeforeEach void seed() {
    TestData.insertPlace(jdbc, "a", "food",     null,     -45.0312, 168.6626, "public");
    TestData.insertPlace(jdbc, "b", "cafe",     null,     -45.0322, 168.6610, "public");
    TestData.insertPlace(jdbc, "c", "shopping", null,     -45.0195, 168.7320, "public");
    TestData.insertPlace(jdbc, "d", "facility", "toilet", -45.0313, 168.6627, "private");
}

@Test void boundingBoxReturnsOnlyPublicPlacesInside() {
    // west 168.65, south -45.04, east 168.67, north -45.02
    assertThat(slugsInBox(168.65, -45.04, 168.67, -45.02)).containsExactlyInAnyOrder("a", "b");
}

@Test void boundingBoxReturnsStoredCoordinates() {
    // 'b'의 latitude는 -45.0322, longitude는 168.6610 (오차 1e-6)
}

@Test void nearestFirstWithDistanceInMetres() {
    // 기준 위치 lat -45.0312, lng 168.6626
    // 순서: a, b, c
    // 거리: a < 1, 150 < b < 190, 5400 < c < 5800
}
```

- [ ] **Step 3: 테스트가 실패하는지 확인한다**

Run: `cd backend && ./gradlew test --tests '*schema*'`
Expected: FAIL. `relation "place" does not exist`

- [ ] **Step 4: Migration과 `TestData`를 만든다**

`V1__init_schema.sql`에 `docs/05-erd.md` 7장의 SQL 블록 전체를 `CREATE EXTENSION IF NOT EXISTS postgis;`부터 마지막 `CREATE INDEX`까지 그대로 옮긴다.

- [ ] **Step 5: 테스트가 통과하는지 확인한다**

Run: `cd backend && ./gradlew test`
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 6: 로컬 DB를 만든다**

`docker-compose.yml`

```yaml
services:
  db:
    image: postgis/postgis:17-3.5
    container_name: queenstown-db
    environment:
      POSTGRES_DB: ${DB_NAME:-queenstown}
      POSTGRES_USER: ${DB_USER:-queenstown}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-queenstown}
    ports:
      - "${DB_PORT:-5433}:5432"
    volumes:
      - queenstown-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-queenstown} -d ${DB_NAME:-queenstown}"]
      interval: 5s
      timeout: 3s
      retries: 10

volumes:
  queenstown-db-data:
```

`.env.example`

```dotenv
DB_NAME=queenstown
DB_USER=queenstown
DB_PASSWORD=queenstown
DB_PORT=5433
```

- [ ] **Step 7: 로컬 DB에 스키마가 적용되는지 확인한다**

```bash
docker compose up -d db
cd backend && ./gradlew bootRun
```

Expected: 로그에 `Successfully applied 1 migration`. 서버를 끄고 다시 `./gradlew bootRun` 하면 `Schema "public" is up to date`.

```bash
docker compose exec db psql -U queenstown -d queenstown -c "\dt"
```

Expected: 여섯 테이블과 `flyway_schema_history`, `spatial_ref_sys`

- [ ] **Step 8: 커밋한다**

```bash
git add docker-compose.yml .env.example backend
git commit -m "Add DB schema v1 migration and local PostGIS"
```

---

### Task 3: 공통 오류 응답

**Files:**
- Create: `backend/src/main/java/com/queenstownlocal/backend/common/error/ErrorCode.java`
- Create: `backend/src/main/java/com/queenstownlocal/backend/common/error/ApiException.java`
- Create: `backend/src/main/java/com/queenstownlocal/backend/common/error/GlobalExceptionHandler.java`
- Create: `backend/src/test/java/com/queenstownlocal/backend/common/error/ErrorProbeController.java`
- Test: `backend/src/test/java/com/queenstownlocal/backend/common/error/ErrorResponseTest.java`

**Interfaces:**
- Produces: `enum ErrorCode` — `VALIDATION_FAILED(400)`, `INVALID_CREDENTIALS(401)`, `INVALID_REFRESH_TOKEN(401)`, `UNAUTHORIZED(401)`, `FORBIDDEN(403)`, `NOT_FOUND(404)`, `METHOD_NOT_ALLOWED(405)`, `EMAIL_ALREADY_USED(409)`, `INTERNAL_ERROR(500)`. `HttpStatus status()`를 가진다.
- Produces: `ApiException(ErrorCode code, String detail)` — `RuntimeException`. `ErrorCode code()`를 가진다.
- Produces: 모든 오류 응답의 본문 `{ type, title, status, detail, code }`와, 입력값 오류일 때의 `errors: [{ field, message }]`

- [ ] **Step 1: 오류를 일으키는 테스트용 Controller를 만든다**

이 Controller는 `ErrorResponseTest`에서만 쓴다. `@SpringBootTest`를 쓰는 다른 테스트의 컴포넌트 스캔에 잡히지 않게 한다.

```java
@RestController
class ErrorProbeController {
    record Body(@NotBlank String name) {}

    @GetMapping("/probe/not-found")
    void notFound() { throw new ApiException(ErrorCode.NOT_FOUND, "Place not found."); }

    @PostMapping("/probe/validate")
    void validate(@Valid @RequestBody Body body) {}

    @GetMapping("/probe/param")
    void param(@RequestParam int size) {}

    @GetMapping("/probe/boom")
    void boom() { throw new IllegalStateException("db password is hunter2"); }
}
```

- [ ] **Step 2: 실패하는 테스트를 쓴다**

`ErrorResponseTest`. `@WebMvcTest(ErrorProbeController.class)`에 `GlobalExceptionHandler`를 `@Import`하고 MockMvc로 호출한다. 모든 경우에 `Content-Type`이 `application/problem+json`인지 함께 확인한다.

| 테스트 | 요청 | 기대 |
|---|---|---|
| `apiExceptionBecomesProblemDetail` | `GET /probe/not-found` | 404. `status` 404, `title` "Not Found", `detail` "Place not found.", `code` "NOT_FOUND". `errors`는 없다. |
| `invalidBodyListsFieldErrors` | `POST /probe/validate`, 본문 `{"name":""}` | 400. `code` "VALIDATION_FAILED", `errors[0].field` "name", `errors[0].message`는 비어 있지 않다. |
| `malformedJsonIsValidationFailed` | `POST /probe/validate`, 본문 `{"name":` | 400. `code` "VALIDATION_FAILED" |
| `wrongParameterTypeNamesTheParameter` | `GET /probe/param?size=abc` | 400. `code` "VALIDATION_FAILED", `errors[0].field` "size" |
| `missingParameterNamesTheParameter` | `GET /probe/param` | 400. `code` "VALIDATION_FAILED", `errors[0].field` "size" |
| `unexpectedErrorHidesTheMessage` | `GET /probe/boom` | 500. `code` "INTERNAL_ERROR". 본문에 "hunter2"가 없다. |
| `unknownPathIsNotFound` | `GET /api/v1/nope` | 404. `code` "NOT_FOUND" |
| `wrongMethodIsMethodNotAllowed` | `POST /probe/not-found` | 405. `code` "METHOD_NOT_ALLOWED" |

- [ ] **Step 3: 테스트가 실패하는지 확인한다**

Run: `cd backend && ./gradlew test --tests '*ErrorResponseTest'`
Expected: FAIL. `ApiException`과 `ErrorCode`가 없어 컴파일되지 않는다.

- [ ] **Step 4: `ErrorCode`, `ApiException`, `GlobalExceptionHandler`를 만든다**

`GlobalExceptionHandler`는 `@RestControllerAdvice`이고 `ResponseEntityExceptionHandler`를 상속한다. Spring이 만든 `ProblemDetail`에 `code`를 더하는 방식으로 구현한다.

| 예외 | code | 비고 |
|---|---|---|
| `ApiException` | 예외가 가진 코드 | `detail`은 예외의 `detail` |
| 본문 검증 실패, 본문 파싱 실패, 파라미터 누락, 파라미터 타입 불일치 | `VALIDATION_FAILED` | `errors`에 필드 이름과 메시지를 담는다. 본문 파싱 실패는 `errors`가 빈 배열이다. |
| 없는 경로 | `NOT_FOUND` | |
| 지원하지 않는 Method | `METHOD_NOT_ALLOWED` | |
| Spring MVC의 그 밖의 4xx | `VALIDATION_FAILED` | |
| 그 밖의 모든 예외 | `INTERNAL_ERROR` | `detail`은 "Unexpected error."로 고정하고, 예외는 로그에 남긴다. |

- [ ] **Step 5: 테스트가 통과하는지 확인한다**

Run: `cd backend && ./gradlew test`
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 6: 커밋한다**

```bash
git add backend
git commit -m "Add Problem Details error responses with error codes"
```

---

### Task 4: Place 상세 API와 로컬 실행 확인

**Files:**
- Create: `backend/src/main/java/com/queenstownlocal/backend/place/PlaceDetail.java`
- Create: `backend/src/main/java/com/queenstownlocal/backend/place/PlaceMapper.java`
- Create: `backend/src/main/java/com/queenstownlocal/backend/place/PlaceService.java`
- Create: `backend/src/main/java/com/queenstownlocal/backend/place/PlaceController.java`
- Create: `backend/src/main/resources/mapper/PlaceMapper.xml`
- Create: `backend/README.md`
- Modify: `README.md` (Current Status)
- Test: `backend/src/test/java/com/queenstownlocal/backend/place/PlaceDetailApiTest.java`

**Interfaces:**
- Consumes: `TestcontainersConfiguration` (Task 1), `TestData.insertPlace` (Task 2), `ApiException`, `ErrorCode.NOT_FOUND` (Task 3)
- Produces: `record PlaceDetail(String slug, String name, String category, String subtype, String address, String imageUrl, double latitude, double longitude, String description, String openingHours, String phone, String website, String source, String sourceUrl, Instant updatedAt)` — `docs/06-api-specification.md`의 Place 상세 필드 15개와 같다.
- Produces: `PlaceMapper.findPublicBySlug(String slug)` → `Optional<PlaceDetail>`. `status = 'public'`인 행만 찾는다.
- Produces: `PlaceService.getPublicPlace(String slug)` → `PlaceDetail`. 없으면 `ApiException(ErrorCode.NOT_FOUND, "Place not found.")`
- Produces: `GET /api/v1/places/{slug}`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`PlaceDetailApiTest`. `@SpringBootTest`, `@AutoConfigureMockMvc`, `@Import(TestcontainersConfiguration.class)`, `@Transactional`.

```java
@Test void returnsThePublicPlaceWithExactlyTheDocumentedFields() throws Exception {
    TestData.insertPlace(jdbc, "lakeside-kitchen", "food", null, -45.0322, 168.6610, "public");
    jdbc.sql("""
        update place set description = 'Lakefront restaurant.', opening_hours = 'Mon - Sun · 8:00 am - 10:00 pm',
               phone = '03 000 0000', website = 'https://lakesidekitchen.example',
               updated_at = timestamptz '2026-10-02 14:30:00+13'
        where slug = 'lakeside-kitchen'""").update();

    // GET /api/v1/places/lakeside-kitchen → 200, application/json
    // 본문의 키는 정확히 15개다:
    //   slug, name, category, subtype, address, imageUrl, latitude, longitude,
    //   description, openingHours, phone, website, source, sourceUrl, updatedAt
    // slug "lakeside-kitchen", category "food"
    // subtype과 imageUrl은 키가 있고 값이 null이다
    // latitude -45.0322, longitude 168.6610 (오차 1e-6)
    // openingHours "Mon - Sun · 8:00 am - 10:00 pm"
    // updatedAt은 "Z"로 끝나고 Instant.parse 결과가 2026-10-02T01:30:00Z와 같다
}

@Test void returnsTheSubtypeOfAFacility() { /* "facility", "toilet" → subtype "toilet" */ }

@Test void privatePlaceIsNotFound()  { /* status "private" → 404, code "NOT_FOUND", application/problem+json */ }

@Test void unknownSlugIsNotFound()   { /* GET /api/v1/places/nope → 404, code "NOT_FOUND" */ }

@Test void oddSlugsAreNotFoundRatherThanErrors() {
    // 아래 각각이 404이고 code가 "NOT_FOUND"다
    //   /api/v1/places/%27%3B%20drop%20table%20place%3B--
    //   /api/v1/places/ + "a".repeat(2000)
    //   /api/v1/places/%ED%95%9C%EA%B8%80
}
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `cd backend && ./gradlew test --tests '*PlaceDetailApiTest'`
Expected: FAIL. 모든 요청이 404이고 첫 테스트가 200을 기대해 실패한다.

- [ ] **Step 3: `PlaceDetail`, `PlaceMapper`, `PlaceMapper.xml`, `PlaceService`, `PlaceController`를 만든다**

Mapper의 조회는 위도와 경도를 `ST_Y(location::geometry) AS latitude`, `ST_X(location::geometry) AS longitude`로 꺼낸다. 나머지 컬럼은 이름 그대로 조회하고 `map-underscore-to-camel-case`에 맡긴다.

- [ ] **Step 4: 전체 테스트가 통과하는지 확인한다**

Run: `cd backend && ./gradlew test`
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 5: 로컬에서 서버를 띄워 확인한다**

```bash
docker compose up -d db
cd backend && ./gradlew bootRun
```

다른 터미널에서:

```bash
curl -s http://localhost:8080/actuator/health
```

Expected: `{"status":"UP"}` 형태의 응답

```bash
curl -s -i http://localhost:8080/api/v1/places/nope
```

Expected: `HTTP/1.1 404`, `Content-Type: application/problem+json`, 본문에 `"code":"NOT_FOUND"`

```bash
docker compose exec db psql -U queenstown -d queenstown -c "insert into place (slug, name, category, address, location, source, source_url, status) values ('lakeside-kitchen', 'Lakeside Kitchen', 'food', '12 Beach Street, Queenstown', ST_SetSRID(ST_MakePoint(168.6610, -45.0322), 4326)::geography, 'Business website', 'https://lakesidekitchen.example', 'public')"
curl -s http://localhost:8080/api/v1/places/lakeside-kitchen
```

Expected: 200. `"latitude":-45.0322`, `"longitude":168.661`이 있는 JSON. 확인한 뒤 넣은 행을 지운다.

```bash
docker compose exec db psql -U queenstown -d queenstown -c "delete from place where slug = 'lakeside-kitchen'"
```

- [ ] **Step 6: `backend/README.md`를 쓰고 루트 README의 상태를 바꾼다**

`backend/README.md`에는 필요한 것(Java 21, Docker), 로컬 DB 시작, 서버 실행, 테스트 실행 명령과 포트(API 8080, DB 5433)를 적는다. 명령은 이 계획에서 확인한 것만 적는다.

루트 `README.md`의 Current Status에서 "개발환경 구축"을 Completed로 옮긴다.

- [ ] **Step 7: 커밋한다**

```bash
git add backend README.md
git commit -m "Add place detail endpoint as the first API-to-DB slice"
```

---

## 범위 밖

3주차에 하지 않는다.

| 항목 | 시점 |
|---|---|
| Place 목록, 검색, 지도 Marker API | 6 ~ 7주차 |
| Event, Notice API | 8주차 |
| 인증, Favorite, Admin API | 11주차 |
| CORS, Web과의 연동 | 4주차. 이 PC의 3000번 포트는 다른 컨테이너가 쓰고 있어 Web 개발 서버의 포트를 따로 정한다. |
| npm workspaces, `shared` 패키지 | 4주차 |
| Seed 데이터 | 7 ~ 8주차 |
| 배포용 이미지와 Nginx | 12주차 |
