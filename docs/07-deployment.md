# 배포 v1 — 무료 구성 (Render + Neon)

지금은 무료 서비스에 올리고, 사용자가 늘거나 잠드는 시간이 불편해지면 서버 1대로 옮긴다([deploy/README.md](../deploy/README.md)). 두 구성은 같은 Dockerfile과 같은 환경 변수 이름을 쓴다.

```text
방문자 ─▶ queenstown-web (Render, Docker, 무료) ──API_BASE_URL──▶ queenstown-api (Render, Docker, 무료) ─▶ Neon (PostgreSQL + PostGIS, 무료)
운영자 ─▶ queenstown-admin (Render, 정적 사이트) ──/api 다시 쓰기──▶ queenstown-api
App   ─────────────────────────────────────────────────────────▶ queenstown-api
```

| 서비스 | 무엇 | 비용 |
|---|---|---|
| Render | `render.yaml`(Blueprint)의 세 서비스 | 무료(웹 서비스 2개, 정적 사이트 1개) |
| Neon | DB | 무료 플랜 |
| Mapbox | 지도 | 무료 한도 안 |

계정 만들기, 저장소 연결, 비밀 값 입력은 운영자가 직접 한다. 아래 순서를 따른다.

## 1. Neon (DB)

1. [neon.com](https://neon.com)에 GitHub로 가입한다.
2. 새 프로젝트: Postgres 17, 지역은 **AWS Asia Pacific (Singapore)**(Render와 같은 곳).
3. **Connect**에서 **Connection pooling을 끈** 연결 문자열을 연다. `postgresql://<user>:<password>@<host>/<database>?sslmode=require` 모양이다. 이 값을 어디에도 붙여 두지 않는다(아래 Render 입력란에만 쓴다).
4. PostGIS는 따로 켜지 않는다. API가 처음 뜰 때 Flyway가 `CREATE EXTENSION postgis`를 실행한다.

## 2. Render (API, Web, Admin)

1. [render.com](https://render.com)에 GitHub로 가입하고 저장소(`Nick-ugi/Local-Platform`)에 접근을 허락한다.
2. **New → Blueprint** → 저장소를 고르면 `render.yaml`의 세 서비스가 보인다.
3. 입력란(`sync: false`)을 채운다.

| 서비스 | 값 | 넣을 것 |
|---|---|---|
| queenstown-api | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<host>/<database>?sslmode=require` (1-3의 host와 database) |
| | `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | 1-3의 user와 password |
| queenstown-web | `API_BASE_URL` | `https://queenstown-api.onrender.com` |
| | `SITE_URL` | `https://queenstown-web.onrender.com` |
| | `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox 공개 토큰(`pk.`) |
| | `CONTACT_EMAIL` | 운영 연락처(비워도 된다. 비우면 GitHub Issues로 안내한다) |
| queenstown-admin | `VITE_MAPBOX_TOKEN` | 같은 Mapbox 토큰 |

- `JWT_SECRET`은 Render가 만든다(`generateValue`). 바꾸면 모두 다시 로그인한다.
- 이름이 이미 쓰여 Render가 다른 주소(`queenstown-api-xxxx.onrender.com`)를 주면, `API_BASE_URL`과 `render.yaml`의 Admin `/api/*` 다시 쓰기 주소를 그 주소로 고친다.

4. **Apply**. 처음 빌드는 10분쯤 걸린다. API가 `Live`가 되면 `https://queenstown-api.onrender.com/actuator/health`가 `UP`이다.

## 3. Mapbox

Mapbox 계정 → Tokens → 쓰는 공개 토큰의 **URL restrictions**에 Web과 Admin 주소를 넣는다.

```text
https://queenstown-web.onrender.com
https://queenstown-admin.onrender.com
```

로컬 개발 주소(`http://localhost:3001`, `http://localhost:5173`)를 계속 쓰려면 함께 넣는다.

## 4. 첫 데이터와 Admin 계정

```bash
# Place 498곳 (OpenStreetMap, backend/seed). Neon의 연결 문자열(postgresql://...)을 넣는다.
DATABASE_URL='postgresql://<user>:<password>@<host>/<database>?sslmode=require' bash backend/seed/load-seed.sh
```

Admin 계정: Web에서 가입한 뒤 Neon의 **SQL Editor**에서 실행한다.

```sql
update app_user set role = 'admin' where email = '가입한 이메일';
```

Event와 Notice는 Admin에서 등록한다.

## 5. 확인

```bash
WEB_URL=https://queenstown-web.onrender.com ADMIN_URL=https://queenstown-admin.onrender.com npm run test:smoke -w e2e
```

- 지도에 Place가 보이고, Explore와 상세, Notices와 Events, Privacy와 Terms가 열린다.
- Admin에 로그인해 Place 하나를 Private으로 바꿨다가 되돌린다(`/api` 다시 쓰기가 POST와 PUT도 넘기는지).
- 서비스가 잠든 뒤(15분) 첫 요청이 1분쯤 걸리고 결국 열린다.

## 무료 구성의 한계

| 한계 | 영향 |
|---|---|
| Render 무료 웹 서비스는 15분 동안 요청이 없으면 잠들고, 다음 요청에 깨어나는 데 1분쯤 걸린다 | Web과 API가 둘 다 잠들어 있으면 첫 방문이 느리다 |
| 0.1 CPU, 512MB 메모리 | API(Spring Boot)가 깨어나는 데 오래 걸린다 |
| Render 무료 시간은 계정당 월 750시간 | 두 서비스가 잠들지 않고 한 달 내내 돌면 넘는다. 넘으면 다음 달까지 멈춘다 |
| Neon 무료: 저장 0.5 ~ 1GB, 월 100 CU-시간 | 다 쓰면 다음 달까지 DB가 멈춘다 |
| Web이 API를 부르는 주소는 Render의 공개 주소다 | API는 Web을 거친 로그인의 방문자 주소를 알 수 없어, 로그인 시도 제한이 계정마다만 걸린다(서버 1대 구성에서는 방문자마다) |
| 백업 | Neon 무료의 기본 복원 기간뿐이다. 주기적으로 `pg_dump`를 받아 둔다 |

## 유료로 옮길 때

이런 때 옮긴다: 첫 방문의 1분이 문제가 될 때, 무료 시간이나 Neon 한도에 닿을 때, 개인 도메인을 쓸 때.

순서는 [deploy/README.md](../deploy/README.md)의 "6. 무료 구성(Neon)에서 옮기기"를 따른다. 같은 이미지를 쓰므로 코드는 바꾸지 않는다.

## App

App은 이번 배포에 포함하지 않는다. 테스트 배포를 할 때 `EXPO_PUBLIC_API_BASE_URL=https://queenstown-api.onrender.com`, `EXPO_PUBLIC_SITE_URL=https://queenstown-web.onrender.com`으로 빌드한다.
