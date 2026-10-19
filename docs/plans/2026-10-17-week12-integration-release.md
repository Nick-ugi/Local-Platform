# Week 12 Integration / Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MVP를 인터넷에 공개한다. 지금은 무료 서비스(Render + Neon)에 올리고, 같은 이미지와 같은 환경 변수로 언제든 유료 서버 1대(Docker Compose)로 옮길 수 있게 한다. 공개 전에 보안과 오류 처리를 다듬고, Web과 Admin을 S1 ~ S5로 통합 테스트하고, 첫 데이터를 넣는다.

**Architecture:** Backend와 Web은 Dockerfile 하나씩으로 이미지를 만든다. 무료 구성은 Render Blueprint(`render.yaml`)가 이 Dockerfile로 `api`, `web`을 띄우고 Admin은 정적 사이트로 올리며, DB는 Neon(PostgreSQL + PostGIS)이다. 유료 구성은 `deploy/compose.yaml`이 같은 Dockerfile로 `db`, `api`, `web`과 Caddy(HTTPS, Admin 정적 파일, 프록시)를 서버 1대에 띄운다. 두 구성 모두 주소는 셋(Web, Admin, API)이고 환경 변수 이름이 같다.

**Tech Stack:** Docker(멀티스테이지), Next.js `output: "standalone"`, Caddy 2(자동 HTTPS), Render Blueprint, Neon, Playwright, OpenStreetMap Overpass API(첫 데이터)

**Spec:** [docs/01-mvp-feature-definition.md](../01-mvp-feature-definition.md) (8장 12주차 "통합 테스트, 남은 Should", 9장 S1 ~ S5, MORE-02, MORE-03), [README.md](../../README.md) 12-Week Development Plan(12주차: 통합 테스트 / Error Handling / Security / Performance / Deployment / MVP Release), [docs/06-api-specification.md](../06-api-specification.md) 1장 오류, [docs/02-information-architecture.md](../02-information-architecture.md) (`/privacy`, `/terms`), [docs/05-erd.md](../05-erd.md) Place 코드 값.

## Global Constraints

- **돈이 드는 자원은 만들지 않는다.** Render와 Neon의 무료 플랜만 쓴다. 계정 만들기, 저장소 연결, 비밀 값 입력은 사용자가 한다(문서에 순서를 쓴다).
- **두 구성은 같은 것을 쓴다.** `backend/Dockerfile`, `web/Dockerfile`, Admin의 `npm run build -w admin`. 환경 변수 이름도 같다. 어느 한쪽에만 있는 코드 분기는 두지 않는다.
- 비밀 값은 커밋하지 않는다: `JWT_SECRET`, DB 비밀번호, Mapbox 토큰 값, 운영 연락처. `.env.example`에는 이름과 설명만 둔다.
- Mapbox 공개 토큰(`pk.`)은 빌드할 때 들어간다(Web의 `NEXT_PUBLIC_MAPBOX_TOKEN`, Admin의 `VITE_MAPBOX_TOKEN`). 비밀 값이 아니지만 Mapbox에서 허용 URL을 배포 주소로 제한한다(문서에 쓴다).
- App 테스트 배포는 이번 주에 하지 않는다. App 코드는 바꾸지 않는다.
- 공개 API와 지금까지의 화면 동작은 바뀌지 않는다. 바뀌는 것은 운영 설정, 새 화면(`/privacy`, `/terms`), 로그인 시도 제한(429)이다.
- 커밋 메시지는 영어.

## Review Focus

1. **운영 서버가 개발용 JWT 키로 뜬다.** `SPRING_PROFILES_ACTIVE=prod`에서 `JWT_SECRET`이 없거나 개발용 값이면 서버가 시작하지 않는다. → Task 1
2. **프록시 뒤에서 모든 사람이 같은 IP로 보여, 로그인 제한이 모두를 막는다.** Caddy와 Render가 붙이는 `X-Forwarded-For`의 첫 주소로 사람을 구별한다. 믿는 프록시가 아닌 곳에서 온 `X-Forwarded-For`는 무시한다. → Task 1
3. **HTTPS의 프록시 뒤에서 Web 로그인 쿠키가 붙지 않는다.** 운영의 쿠키는 `Secure`다. 로컬 확인도 Caddy의 HTTPS(`tls internal`)로 해서 가입 → 로그인 → Favorite이 끝까지 된다. → Task 6, Task 7
4. **Admin의 `/api`가 Backend에 닿지 않는다.** Caddy와 Render 정적 사이트의 rewrite가 `/api/*`를 API로 넘기고, 나머지 경로는 `index.html`(새로 고침한 `/places/12`도 열린다). → Task 6, Task 7, Task 8
5. **첫 데이터의 값 하나가 적재 전체를 막는다.** 적재는 한 트랜잭션이라 길이 초과, 잘못된 URL, 빈 주소 하나로 전부 실패한다. 생성 스크립트가 ERD의 규칙으로 값을 다듬거나 그 행을 빼고, 만든 CSV를 실제 PostGIS에 넣는 테스트가 통과한다. → Task 5

---

## File Structure

```text
backend
 ├── Dockerfile, .dockerignore          Gradle로 bootJar → JRE 21, non-root, PORT
 ├── src/main/resources/application-prod.yml   운영 설정(프록시 헤더, graceful shutdown)
 ├── src/main/java/.../security/ProductionSecretCheck.java   prod에서 개발용 키 거부
 ├── src/main/java/.../auth/AuthRateLimiter.java              로그인 · 가입 시도 제한
 └── seed/osm                           OpenStreetMap에서 places.csv를 만드는 스크립트와 라이선스 안내

web
 ├── Dockerfile                         저장소 루트를 context로(shared를 함께), standalone 실행
 ├── next.config.ts                     output standalone, 보안 헤더, poweredByHeader 끔
 ├── src/lib/securityHeaders.ts         헤더 목록(테스트 대상)
 └── src/app/privacy, terms             MORE-03, place 상세의 "Suggest an edit"(MORE-02)

deploy                                  유료 서버 1대 구성
 ├── compose.yaml                       db(PostGIS), api, web, caddy
 ├── Caddyfile                          세 주소: Web, Admin(정적 + /api), API
 ├── caddy/Dockerfile                   Admin을 빌드해 Caddy 이미지에 넣는다
 ├── .env.example
 └── README.md                          서버 준비, 첫 실행, 백업과 복원, 무료 → 유료 옮기기

render.yaml                             무료 구성(Blueprint)
e2e                                     Playwright workspace: S1 ~ S5
.dockerignore                           저장소 루트 context용
docs/07-deployment.md                   무료 배포 순서(Neon, Render, Mapbox, Admin 계정, 첫 데이터)
```

---

### Task 1: Backend 운영 설정과 로그인 시도 제한

**Files:**
- Create: `backend/src/main/resources/application-prod.yml`, `security/ProductionSecretCheck.java`, `auth/AuthRateLimiter.java`
- Modify: `application.yml`(`server.port: ${PORT:8080}`), `common/error/ErrorCode.java`(`TOO_MANY_REQUESTS(429)`), `auth/AuthController.java`, `docs/06-api-specification.md` 1장 오류 표
- Test: `security/ProductionSecretCheckTest.java`, `auth/AuthRateLimitTest.java`

**Interfaces:**
- Produces: 운영 프로필 이름 `prod`(Task 2, 6, 8의 `SPRING_PROFILES_ACTIVE`), 오류 코드 `TOO_MANY_REQUESTS`, 환경 변수 `PORT`, `JWT_SECRET`, `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`.

- `application-prod.yml`: `server.forward-headers-strategy: native`(Tomcat이 믿는 프록시의 `X-Forwarded-For`, `X-Forwarded-Proto`를 쓴다. 믿는 범위는 Tomcat 기본값인 사설 대역과 loopback), `server.shutdown: graceful`, `management.endpoint.health.probes.enabled: true`.
- `ProductionSecretCheck`: `@Profile("prod")` 빈. `JwtProperties.DEVELOPMENT_SECRET`이면 시작을 멈추는 예외(`IllegalStateException("JWT_SECRET must be set in production")`).
- `AuthRateLimiter`: `/auth/login`과 `/auth/signup`에 클라이언트 주소(`request.getRemoteAddr()`, 프록시 헤더가 반영된 값)마다 **10분에 20번**. 넘으면 429 `TOO_MANY_REQUESTS`, `Retry-After` 헤더(초). 막을 때 INFO 로그에 그 주소를 남긴다(Task 8에서 Render가 넘긴 주소가 실제 방문자의 것인지 본다). 메모리에 둔다(서버 1대 기준. 여러 대가 되면 공유 저장소가 필요하다고 주석에). 시계는 주입된 `Clock`.
- API 명세 1장 오류 표에 `TOO_MANY_REQUESTS | 429 | 로그인이나 가입 시도가 너무 많다. Retry-After 뒤에 다시 시도한다.`

| 테스트 | 기대 |
|---|---|
| prod 프로필 + `JWT_SECRET` 없음 | 컨텍스트 시작 실패, 원인 메시지에 `JWT_SECRET` |
| prod 프로필 + 32바이트 이상 키 | 시작, `/actuator/health` 200 |
| 같은 주소에서 로그인 20번 → 21번째 | 429, `code=TOO_MANY_REQUESTS`, `Retry-After` 있음 |
| 시계를 10분 넘기면 | 다시 401(틀린 비밀번호)로 돌아온다 |
| 실제 포트(`RANDOM_PORT`)로 `X-Forwarded-For: 203.0.113.1`과 `203.0.113.2`를 번갈아 21번씩 | prod 설정에서 두 주소가 따로 센다 |
| 가입도 같은 한도 | 21번째 429 |

- [ ] 테스트 작성 → 실패 확인 → 구현 → `./gradlew test` 전체 통과 → 커밋

### Task 2: Backend 이미지

**Files:** Create `backend/Dockerfile`, `backend/.dockerignore`. Modify `backend/README.md`(이미지 만들기와 실행).

- 1단계 `eclipse-temurin:21-jdk`에서 `./gradlew bootJar -x test`, 2단계 `eclipse-temurin:21-jre`에 jar만. non-root 사용자. `JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"`(Render 무료는 512MB). `EXPOSE 8080`, 실제 포트는 `PORT`.
- `.dockerignore`: `build`, `.gradle`, `bin`, `seed`.

- [ ] 확인: `docker build -t queenstown-api backend` 성공. 로컬 DB에 붙여 `docker run -e SPRING_PROFILES_ACTIVE=prod -e JWT_SECRET=<임의 48자> -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5433/queenstown ... -p 8090:8080` → `curl localhost:8090/actuator/health`가 `UP`, 컨테이너 사용자가 root가 아니다(`docker exec ... id -u` ≠ 0). → 커밋

### Task 3: Web 운영 준비

**Files:** Create `web/Dockerfile`, 루트 `.dockerignore`, `web/src/lib/securityHeaders.ts`(+ test). Modify `web/next.config.ts`, `web/README.md`.

**Interfaces:**
- Produces: `securityHeaders: { key: string; value: string }[]`, Web 이미지의 환경 변수 `API_BASE_URL`, `SITE_URL`, `CONTACT_EMAIL`(Task 4), 빌드 인자 `NEXT_PUBLIC_MAPBOX_TOKEN`. 컨테이너는 `PORT`(기본 3000), `HOSTNAME=0.0.0.0`.

- `next.config.ts`: `output: "standalone"`, `outputFileTracingRoot`는 저장소 루트(shared를 따라가도록), `poweredByHeader: false`, `headers()`가 모든 경로에 `securityHeaders`.
- `securityHeaders`: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`. HSTS는 HTTPS를 끝내는 곳(Caddy, Render)이 붙인다.
- `web/Dockerfile`: context는 저장소 루트. `package.json`, `package-lock.json`, `shared`, `web`만 복사 → `npm ci -w web -w shared --include-workspace-root` → `ARG NEXT_PUBLIC_MAPBOX_TOKEN` → `npm run build -w web` → 3단계에 `web/.next/standalone`, `web/.next/static`, `web/public`. non-root.

| 테스트 | 기대 |
|---|---|
| `securityHeaders` | 위 네 헤더가 그 값으로, 이름이 겹치지 않는다 |

- [ ] 확인: `docker build -f web/Dockerfile --build-arg NEXT_PUBLIC_MAPBOX_TOKEN=... -t queenstown-web .` 성공. `docker run -e API_BASE_URL=http://host.docker.internal:8080 -p 3010:3000` → `/`가 200이고 응답에 네 헤더, `X-Powered-By` 없음, 지도가 그려진다. `npm test -w web`, `npm run lint -w web`, `npm run build -w web` 통과. → 커밋

### Task 4: Privacy Policy, Terms, Suggest an edit (MORE-02, MORE-03 — Web)

**Files:** Create `web/src/app/privacy/page.tsx`, `web/src/app/terms/page.tsx`, `web/src/lib/contact.ts`(+ tests). Modify `web/src/app/more/page.tsx`, Place 상세, `web/messages/en.json`, `web/src/app/sitemap.ts`, `web/.env.example`.

**Interfaces:**
- Produces: `contactEmail(): string | null`(`CONTACT_EMAIL`, 이메일 형식이 아니면 null), `suggestEditHref(place: { name: string; slug: string }, site: URL): string | null`(`mailto:`, 제목 `Suggest an edit: {name}`, 본문에 상세 URL).

- `/privacy`: 모으는 것(이메일, 비밀번호의 BCrypt 해시, Favorite, Refresh Token의 해시, 서버 접속 기록), 모으지 않는 것(현재 위치는 기기에서 거리 계산과 가까운 순 요청에만 쓰고 저장하지 않는다), 쓰는 곳(Render, Neon, Mapbox), 보관(Refresh Token 30일, 계정은 삭제 요청까지), 계정 삭제는 `CONTACT_EMAIL`로 요청. 마지막 수정일. 문구는 사실만 쓰고, 법률 검토 전이라는 표시는 문서(README)에 둔다.
- `/terms`: 정보는 출처의 것을 옮긴 것이고 정확성을 보장하지 않는다, 공식 공지는 원문(Source)을 따른다, 계정의 책임, 연락처.
- More: About 아래에 Privacy Policy, Terms(IA 262행 순서). Place 상세: 출처 줄 옆에 "Suggest an edit"(`CONTACT_EMAIL`이 없으면 숨김).
- 두 페이지는 sitemap에 넣고 SEO 메타(title, description, canonical)는 About과 같은 방식.

| 테스트 | 기대 |
|---|---|
| `contactEmail` | `CONTACT_EMAIL` 없음, 빈 값, 형식 아님 → null |
| `suggestEditHref` | 이름에 `&`, `#`, 한글이 있어도 제목과 본문이 인코딩된 `mailto:` |
| More | Privacy Policy, Terms 링크가 About 다음 |
| Place 상세 | `CONTACT_EMAIL`이 있으면 링크, 없으면 없음 |
| `/privacy`, `/terms` | 제목, 마지막 수정일, 연락처. `CONTACT_EMAIL`이 없으면 연락처는 저장소의 GitHub Issues 링크(`https://github.com/Nick-ugi/Local-Platform/issues`)이고 빈 값이 보이지 않는다 |
| sitemap | 두 주소가 들어 있다 |

- [ ] 테스트 → 구현 → `npm test -w web`, lint, build → 브라우저에서 More → Privacy, 상세의 Suggest an edit → 커밋

### Task 5: 첫 데이터 (OpenStreetMap → places.csv)

**Files:** Create `backend/seed/osm/fetch-places.mjs`, `backend/seed/osm/mapping.mjs`(+ `mapping.test.mjs`, `node --test`), `backend/seed/osm/README.md`(ODbL). Modify `backend/seed/places.csv`(생성물), `backend/seed/load-seed.sh`(`DATABASE_URL`이 있으면 그 DB로), `backend/seed/README.md`, About의 출처 문단, `backend/src/test/.../seed/SeedDataTest.java`.

**Interfaces:**
- Produces: `toPlaceRow(element: OverpassElement): PlaceRow | null`(`mapping.mjs`), CSV 머리글은 지금의 `places.csv`와 같다.

- 범위: Queenstown 중심(-45.0312, 168.6626)에서 반경 **15km**, 이름이 있는 node와 way(way는 중심점). Overpass API에 한 번 묻는다(요청 사이 대기, User-Agent에 저장소 주소).
- 분류: `amenity=restaurant|fast_food` → food, `amenity=cafe` → cafe, `amenity=bar|pub|biergarten` → bar, `tourism=attraction|viewpoint`, `leisure=park` 중 이름 있는 것 → activity, `shop=*` → shopping, `amenity=toilets` → facility/toilet, `amenity=parking`(이름 있는 것) → facility/parking, `tourism=information`(`information=office`) → facility/information, `amenity=library` → facility/library, `amenity=clinic|doctors|hospital|pharmacy` → facility/medical. 그 밖은 뺀다.
- 값: `slug`는 이름 → shared와 같은 규칙, 겹치면 `-2`. `address`는 `addr:housenumber addr:street, addr:suburb|addr:city`, 없으면 `Queenstown`. `opening_hours`, `phone`, `website`는 있으면(ERD 길이로 자르고, website는 http(s)만). `image_url`은 비움. `source`=`OpenStreetMap`, `source_url`=`https://www.openstreetmap.org/{node|way}/{id}`, `status`=`public`.
- 라이선스: OSM 데이터는 ODbL. About의 출처 문단에 "Place data © OpenStreetMap contributors (ODbL)"와 링크, `seed/osm/README.md`에 같은 내용과 다시 만드는 방법.
- `load-seed.sh`: `DATABASE_URL`이 있으면 `docker run --rm -i postgres:17 psql "$DATABASE_URL" ...`로 같은 SQL을 보낸다(로컬 psql 없이 Neon에 넣기).

| 테스트 | 기대 |
|---|---|
| `toPlaceRow` 분류 | 위 표 그대로, 이름 없음과 표에 없는 태그는 null |
| 긴 이름(130자), 긴 주소 | 120자, 255자로 자른다 |
| `website=www.example.com`, `ftp://` | https를 붙이지 않고 비운다(http(s)만) |
| 같은 이름 두 곳 | `-2` |
| `SeedDataTest` | 커밋한 `places.csv`가 실제 PostGIS에 한 번에 들어가고, 행 수가 CSV와 같다 |

- [ ] 테스트 → 구현 → `node backend/seed/osm/fetch-places.mjs > backend/seed/places.csv` → 행 수와 분류별 개수를 커밋 메시지에 → 로컬 DB에 `load-seed.sh` → Web 지도에서 확인 → 커밋

### Task 6: 서버 1대 구성 (유료 서버로 옮길 때)

**Files:** Create `deploy/compose.yaml`, `deploy/Caddyfile`, `deploy/caddy/Dockerfile`, `deploy/.env.example`, `deploy/README.md`.

**Interfaces:**
- Consumes: Task 2, 3의 Dockerfile, Task 1의 `prod`.
- Produces: 환경 변수 `WEB_HOST`, `ADMIN_HOST`, `API_HOST`(Caddy의 사이트 주소), `TLS_MODE`(`internal`이면 로컬 인증서), `DB_PASSWORD`, `JWT_SECRET`, `MAPBOX_TOKEN`(두 빌드 인자로), `CONTACT_EMAIL`.

- `compose.yaml`: `db`(`postgis/postgis:17-3.5`, 볼륨, healthcheck, 외부 포트 없음), `api`(prod, DB가 healthy일 때), `web`(`API_BASE_URL=http://api:8080`, `SITE_URL=https://${WEB_HOST}`), `caddy`(80, 443, 볼륨 `caddy_data`). 외부로 열리는 것은 Caddy뿐.
- `Caddyfile`: `{$WEB_HOST}` → `web:3000`. `{$ADMIN_HOST}` → `/api/*`는 `api:8080`, 나머지는 Admin 정적 파일(`try_files {path} /index.html`). `{$API_HOST}` → `api:8080`(App이 쓸 주소). 세 사이트 모두 HSTS와 Task 3의 보안 헤더(Admin은 여기서). `TLS_MODE=internal`이면 `tls internal`.
- `caddy/Dockerfile`: node 단계에서 `npm ci -w admin -w shared` → `ARG VITE_MAPBOX_TOKEN` → `npm run build -w admin` → `caddy:2` 이미지의 `/srv/admin`에.
- `deploy/README.md`: 서버 고르기(2GB 메모리 이상), Docker 설치, DNS 세 개를 서버 IP로, `.env` 채우기, `docker compose up -d --build`, Admin 계정 만들기, 첫 데이터, 백업(`pg_dump` 매일 cron 예시)과 복원, **Neon에서 옮기기**(`pg_dump` → `pg_restore`), 업데이트(`git pull && docker compose up -d --build`).

- [ ] 확인(로컬, HTTPS): `WEB_HOST=web.localhost ADMIN_HOST=admin.localhost API_HOST=api.localhost TLS_MODE=internal`로 `docker compose -f deploy/compose.yaml up -d --build` → `curl -k https://api.localhost/actuator/health` UP, `https://web.localhost/` 200과 HSTS, `https://admin.localhost/places`(새로 고침 경로)가 Admin의 `index.html`, `https://admin.localhost/api/v1/places` 200. → 커밋

### Task 7: 통합 테스트 (Playwright, S1 ~ S5)

**Files:** Create `e2e/package.json`(workspace `@queenstown/e2e`), `e2e/playwright.config.ts`, `e2e/tests/*.spec.ts`, `e2e/scripts/make-admin.mjs`, `e2e/README.md`. Modify 루트 `package.json`(workspaces에 `e2e`).

**Interfaces:**
- Consumes: Task 6의 로컬 스택, Task 5의 데이터.
- Produces: 환경 변수 `WEB_URL`, `ADMIN_URL`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`. 명령 `npm run test:local -w e2e`(전부), `npm run test:smoke -w e2e`(읽기만: S1 ~ S4).

- `make-admin.mjs`: 로컬 스택에 가입(API) → `docker compose -f deploy/compose.yaml exec db psql`로 `role='admin'` → 이메일과 임의 비밀번호를 `e2e/.auth/admin.json`(gitignore)에. 운영에는 쓰지 않는다.
- 지도 Marker는 canvas라서 누르지 않고, 선택을 URL로 연다(`/?place={slug}`). 데이터는 테스트가 Admin으로 만든 것을 쓴다(S5가 먼저, 나머지가 그 항목을 본다). 끝나면 만든 항목을 private으로.

| 시나리오 | 확인 |
|---|---|
| S5 | Admin 로그인 → Place, Event, Notice 등록(Public) → 일반 계정은 Admin 로그인 거부 |
| S1 | `/?filter=cafe&place={slug}` → 미리보기 → View details → Directions 링크가 Google Maps |
| S2 | `/notices` → 등록한 Notice → 기간(뉴질랜드 날짜), Official, View on map |
| S3 | `/events?when=week` → 등록한 Event → 상세 → View on map |
| S4 | 상세 HTML(`request.get`)에 본문, `<title>`, `og:title`, canonical(`WEB_URL` 기준) |
| 계정 | 가입 → 하트 → 로그인으로 → 돌아와 저장 → Favorites → 해제 → Log out (HTTPS에서 쿠키) |
| 제한 | 같은 주소로 틀린 로그인 21번 → 화면에 다시 시도 안내(429) |
| 비공개 | 등록한 Place를 private으로 → 상세 404, Explore에 없음 |

- [ ] 작성 → Task 6 스택에 `npm run test:local -w e2e` 통과(Chromium, `ignoreHTTPSErrors`) → 커밋

### Task 8: 무료 배포 (Render + Neon)

**Files:** Create `render.yaml`, `docs/07-deployment.md`. Modify `README.md`(배포 절).

- `render.yaml`:
  - `queenstown-api`: `type: web`, `runtime: docker`, `plan: free`, `dockerfilePath: ./backend/Dockerfile`, `dockerContext: ./backend`, `healthCheckPath: /actuator/health`. env: `SPRING_PROFILES_ACTIVE=prod`, `JWT_SECRET`(`generateValue: true`), `SPRING_DATASOURCE_URL`·`USERNAME`·`PASSWORD`(`sync: false`).
  - `queenstown-web`: `type: web`, `runtime: docker`, `plan: free`, `dockerfilePath: ./web/Dockerfile`, `dockerContext: .`. env: `API_BASE_URL`, `SITE_URL`, `CONTACT_EMAIL`, `NEXT_PUBLIC_MAPBOX_TOKEN`(모두 `sync: false`. Render는 환경 변수를 Docker 빌드 인자로도 넘긴다).
  - `queenstown-admin`: `type: web`, `runtime: static`, `buildCommand: npm ci -w admin -w shared && npm run build -w admin`, `staticPublishPath: ./admin/dist`, `routes`: rewrite `/api/*` → `https://{API 주소}/api/*`, rewrite `/*` → `/index.html`. env: `VITE_MAPBOX_TOKEN`(`sync: false`).
  - `buildFilter`로 각 서비스가 자기 폴더와 `shared`가 바뀔 때만 빌드.
- `docs/07-deployment.md`(사용자가 따라 하는 순서): Neon 프로젝트(지역은 가까운 곳, PostGIS는 Flyway가 켠다) → 직접 연결 문자열을 JDBC로(`?sslmode=require`) → Render에서 Blueprint로 저장소 연결 → `sync: false` 값 입력 → 첫 배포 → Admin의 rewrite 주소를 실제 API 주소로 확인 → Mapbox 토큰의 허용 URL에 Web과 Admin 주소 → 가입 후 Neon SQL Editor에서 `role='admin'` → `DATABASE_URL=... bash backend/seed/load-seed.sh`. 무료의 한계(15분 쉬면 잠들고 첫 요청에 1분쯤, 월 750시간, Neon 0.5 ~ 1GB와 월 100 CU-시간)와 유료로 옮기는 기준과 방법(`deploy/README.md`).

- [ ] `render.yaml`과 문서 작성 → 커밋 → **사용자가 계정을 만들고 Blueprint를 연결**(이 단계는 사용자 몫, 같이 화면을 보며 진행) → 배포 주소로 `WEB_URL=... ADMIN_URL=... npm run test:smoke -w e2e` 통과 → 잠든 뒤 첫 요청이 결국 열리는지(시간 기록) → 내 PC에서 틀린 로그인 21번으로 429를 받고, Render 로그의 주소가 내 공인 IP인지 확인(Render 내부 주소면 `server.tomcat.remoteip.internal-proxies`에 Render의 대역을 더하고 Task 1의 테스트에 그 경우를 추가) → 커밋(주소를 README에)

### Task 9: 릴리스 확인과 문서

- [ ] 전체 테스트: `./gradlew test`, `npm test`(shared, web, admin, mobile, e2e 제외), 각 lint와 typecheck, `next build`, `vite build`.
- [ ] 배포된 Web의 Lighthouse(모바일): Performance, Accessibility, Best Practices, SEO 점수를 README에 기록. 눈에 띄는 문제(LCP 이미지 크기, 누락된 meta)만 고치고 나머지는 다음 단계로 적는다.
- [ ] README: Current Status에 12주차, 배포 주소, 무료 구성의 한계, Privacy와 Terms가 법률 검토 전이라는 표시. backend, web, admin README에 운영 환경 변수 표.
- [ ] 커밋 → (사용자에게 묻고) push, PR, 병합, `v0.1.0` 태그

---

## 범위 밖

| 항목 | 시점 |
|---|---|
| App 테스트 배포(Android 내부 테스트, TestFlight), App의 MORE-02 · MORE-03 · APP-01(Local 탭) | App 배포 때 |
| MAP-09 Marker 묶음, PLACE-07 영업 중, PLACE-08 주변 장소, SEARCH-03 검색 결과 지도 | MVP 이후 |
| 개인 도메인, 모니터링과 알림, 자동 백업(무료 Neon의 기본 복원 외) | 유료 서버로 옮길 때 |
| Event와 Notice의 첫 데이터 | 운영자가 Admin으로 등록 |
| 계정 삭제 화면 | MVP 이후(지금은 이메일 요청) |
