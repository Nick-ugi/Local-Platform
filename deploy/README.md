# 서버 1대로 운영하기

무료 구성(Render + Neon, [docs/07-deployment.md](../docs/07-deployment.md))에서 유료 서버로 옮길 때 쓰는 구성이다. Render와 같은 Dockerfile(`backend/Dockerfile`, `web/Dockerfile`)과 같은 환경 변수 이름을 쓴다.

```text
방문자 ──https──▶ Caddy (80, 443) ──▶ web:3000   (WEB_HOST)
                     │            ──▶ /srv/admin + /api → api:8080   (ADMIN_HOST)
                     │            ──▶ api:8080   (API_HOST, App이 쓴다)
                     └ 인증서를 스스로 받고 갱신한다(Let's Encrypt)
api ──▶ db (PostgreSQL + PostGIS, 볼륨 db-data)
```

- 밖에서 닿는 것은 Caddy(80, 443)뿐이다. DB와 API의 포트는 열지 않는다.
- Caddy는 방문자 주소를 `X-Forwarded-For`로 넘기고, 방문자가 보낸 값은 믿지 않는다. API는 사설 주소의 프록시만 믿는다(로그인 시도 제한이 방문자마다 센다).

## 1. 서버 준비

- Linux(Ubuntu 24.04 등), 메모리 **2GB 이상**(DB, API, Web, 빌드가 함께 돈다), 디스크 20GB 이상.
- [Docker Engine](https://docs.docker.com/engine/install/)과 Compose 플러그인.
- 방화벽에서 22(SSH), 80, 443만 연다.
- DNS: 세 주소(`WEB_HOST`, `ADMIN_HOST`, `API_HOST`)의 A 레코드를 서버 IP로. 인증서를 받으려면 먼저 이 주소들이 서버를 가리켜야 한다.

## 2. 첫 실행

```bash
git clone https://github.com/Nick-ugi/Local-Platform.git
cd Local-Platform
cp deploy/.env.example deploy/.env      # 값을 채운다
docker compose -f deploy/compose.yaml --env-file deploy/.env up -d --build
docker compose -f deploy/compose.yaml --env-file deploy/.env ps
```

| 값 | 뜻 |
|---|---|
| `WEB_HOST`, `ADMIN_HOST`, `API_HOST` | 세 주소(`https://` 없이) |
| `TLS_MODE` | Let's Encrypt가 연락할 이메일. 로컬 확인은 `internal` |
| `DB_PASSWORD`, `JWT_SECRET` | `openssl rand -base64 48`로 만든다. 바꾸지 않는다(JWT_SECRET을 바꾸면 모두 다시 로그인한다) |
| `MAPBOX_TOKEN` | Mapbox 공개 토큰. Mapbox 계정에서 허용 URL을 Web과 Admin 주소로 제한한다 |
| `CONTACT_EMAIL` | Privacy Policy, Terms, Suggest an edit의 연락처(선택) |

## 3. 첫 데이터와 Admin 계정

```bash
# Place (backend/seed). DB 컨테이너 안의 psql로 보낸다.
set -a; . deploy/.env; set +a
COMPOSE_FILE=deploy/compose.yaml bash backend/seed/load-seed.sh

# Admin: Web에서 가입한 계정을 admin으로 바꾼다.
docker compose -f deploy/compose.yaml --env-file deploy/.env exec db \
  psql -U queenstown -d queenstown -c "update app_user set role = 'admin' where email = 'you@example.com'"
```

## 4. 업데이트

```bash
git pull
docker compose -f deploy/compose.yaml --env-file deploy/.env up -d --build
```

DB의 구조는 API가 시작할 때 Flyway가 바꾼다. 업데이트 전에 백업한다.

## 5. 백업과 복원

```bash
# 백업. 매일 하려면 이 줄을 crontab에 넣는다(앞에 `0 4 * * * cd /서버의/Local-Platform &&`, `%`는 `\%`로)
docker compose -f deploy/compose.yaml --env-file deploy/.env exec -T db \
  pg_dump -U queenstown -d queenstown -Fc > "backup-$(date +%F).dump"

# 복원 (빈 DB에)
docker compose -f deploy/compose.yaml --env-file deploy/.env exec -T db \
  pg_restore -U queenstown -d queenstown --clean --if-exists --no-owner < backup-2026-10-19.dump
```

백업 파일은 서버 밖(다른 저장소)에도 둔다.

## 6. 무료 구성(Neon)에서 옮기기

1. Neon의 연결 문자열(직접 연결, `postgresql://...`)로 덤프한다. 로컬에 pg_dump가 없으면 컨테이너로:

   ```bash
   docker run --rm postgres:17 pg_dump "$NEON_URL" -Fc --no-owner > neon.dump
   ```

2. 서버에서 위 2번(첫 실행)까지 한 뒤, 5번의 복원으로 넣는다. API를 먼저 띄우면 Flyway가 만든 빈 테이블 위에 `--clean`으로 덮는다.
3. `JWT_SECRET`을 Render와 같은 값으로 두면 로그인이 유지된다. 다르게 두면 모두 다시 로그인한다.
4. DNS를 서버로 바꾸고, App과 Mapbox 토큰의 허용 URL을 새 주소로 바꾼다.

## 로컬에서 확인하기

같은 구성을 PC에서 HTTPS로 띄운다. `*.lvh.me`는 공개 DNS가 127.0.0.1(자기 PC)을 가리키는 이름이다(`*.localhost`는 Windows의 Node가 찾지 못해 통합 테스트에 쓰지 않는다. 안 되면 `*.127.0.0.1.nip.io`). Caddy의 자체 인증서라 브라우저와 curl은 경고를 낸다(`curl -k`).

```text
WEB_HOST=web.lvh.me
ADMIN_HOST=admin.lvh.me
API_HOST=api.lvh.me
TLS_MODE=internal
```

```bash
docker compose -f deploy/compose.yaml --env-file deploy/.env up -d --build
curl -k https://api.lvh.me/actuator/health
npm run make-admin -w e2e && npm run test:local -w e2e   # 통합 테스트(e2e/README.md)
docker compose -f deploy/compose.yaml --env-file deploy/.env down        # 끄기 (-v를 붙이면 데이터도 지운다)
```
