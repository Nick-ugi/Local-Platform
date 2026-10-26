# Admin

운영자가 Place, Event, Notice를 등록하고 수정하고 내리는 화면이다(ADMIN-01 ~ ADMIN-04). Web과 따로 도는 React + Vite 앱이다(docs/02-information-architecture.md, Admin). 문구는 운영자용 English이고 따로 언어 파일을 두지 않는다.

## 실행

Backend가 `http://localhost:8080`에서 돌고 있어야 한다([backend/README.md](../backend/README.md)).

```bash
npm install          # 저장소 루트에서 한 번
npm run dev -w admin # http://localhost:5173
```

Admin은 `/api`를 자기 주소로 부르고, Vite가 Backend로 넘긴다(`vite.config.ts`). 그래서 Backend에 CORS가 필요 없다. Backend가 다른 곳에 있으면 `API_BASE_URL=http://...:8080 npm run dev -w admin`.

## Admin 계정

가입 화면은 Web과 App에 있다. Admin 계정은 따로 만들지 않고, 가입한 계정의 `role`을 바꾼다.

1. Backend의 `POST /api/v1/auth/signup`으로 가입한다(Web이나 App의 Sign up, 또는 아래 명령).

   ```bash
   curl -X POST http://localhost:8080/api/v1/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"a long password"}'
   ```

2. 저장소 루트에서 그 계정을 Admin으로 바꾼다.

   ```bash
   docker compose exec -T db psql -U queenstown -d queenstown \
     -c "UPDATE app_user SET role = 'admin' WHERE lower(email) = lower('admin@example.com');"
   ```

`role`이 `admin`이 아닌 계정으로 로그인하면 Admin이 거부한다. Backend도 `/admin` API에 403을 준다.

## 환경 변수

`admin/.env.example`을 `admin/.env.local`로 복사한다.

| 이름 | 뜻 |
|---|---|
| `VITE_MAPBOX_TOKEN` | Mapbox 공개 토큰(`pk.`). 폼의 지도에서 핀으로 위치를 정한다. 없으면 위도와 경도를 숫자로 입력한다. |

## 운영

Admin은 `npm run build -w admin`으로 만든 정적 파일(`admin/dist`)이다. 브라우저는 Admin과 같은 주소의 `/api`를 부르고, 앞단이 그것을 API로 넘긴다. 그래서 운영에서도 CORS가 필요 없다.

| 구성 | 정적 파일 | `/api` |
|---|---|---|
| 무료(Render, `render.yaml`) | 정적 사이트 `queenstown-admin` | 다시 쓰기 규칙으로 `https://queenstown-api.onrender.com/api/*` |
| 서버 1대(`deploy/`) | Caddy 이미지 안(`deploy/caddy/Dockerfile`이 빌드) | Caddy가 `api:8080`으로 |

- `VITE_MAPBOX_TOKEN`은 빌드할 때 들어간다(Render는 서비스의 환경 변수, 서버 1대는 `deploy/.env`의 `MAPBOX_TOKEN`). Mapbox에서 토큰의 허용 URL에 Admin 주소를 넣는다.
- 새로 고친 주소(`/places/12`)도 열리도록 앞단이 모르는 경로는 `index.html`을 준다.
- 운영 DB의 Admin 계정은 위 "Admin 계정"과 같은 방법으로 만든다. Neon은 SQL Editor에서, 서버 1대는 [deploy/README.md](../deploy/README.md)의 명령으로.
- 로그인을 너무 많이 시도하면(같은 주소와 이메일로 10분에 20번) 기다리라는 안내가 나온다.

## 알아 둘 것

- **토큰:** Access Token은 메모리에만, Refresh Token은 `sessionStorage`에 둔다. 새로고침해도 로그인이 남고 탭을 닫으면 끝난다. Access Token이 끝나면(15분) 한 번 재발급해 다시 보낸다.
- **날짜와 시각은 뉴질랜드 시간으로 입력한다.** 컴퓨터의 시간대와 상관없다(`src/lib/nzTime.ts`). 서머타임이 바뀌는 시각도 맞게 보낸다.
- **삭제는 없다.** 내릴 항목은 Private으로 바꾼다. Private 항목은 Web과 App의 지도, 목록에서 빠지고 상세는 404다.
- **slug는 등록할 때 이름이나 제목으로 서버가 만들고, 수정해도 바뀌지 않는다.** 공개한 URL이 깨지지 않게 한다.

## 테스트와 Lint

```bash
npm test -w admin
npm run lint -w admin
npm run typecheck -w admin
npm run build -w admin
```

## 구조

```text
src/auth      로그인, 토큰, 재발급 (session.ts), 로그인 화면
src/layout    왼쪽 메뉴와 화면 틀
src/list      Places / Events / Notices 목록 (검색, 필터, 표)
src/forms     등록 / 수정 폼, 필드, 저장과 오류 표시 (useAdminForm)
src/map       핀으로 위치를 정하는 지도 (mapbox-gl)
src/lib       뉴질랜드 시간, 코드의 이름
```
