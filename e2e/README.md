# 통합 테스트 (Playwright)

Web과 Admin을 실제 브라우저(PC에 설치된 Chrome)로 쓰면서 시나리오 S1 ~ S5([docs/01-mvp-feature-definition.md](../docs/01-mvp-feature-definition.md) 9장)를 확인한다. 브라우저를 따로 내려받지 않는다.

| 명령 | 대상 | 하는 일 |
|---|---|---|
| `npm run test:local -w e2e` | 이 PC의 서버 구성(`deploy/compose.yaml`) | Admin이 Place, Event, Notice를 등록(S5) → 지도 링크, 상세, 길찾기(S1) → Notice(S2) → 이번 주 Event(S3) → 서버 렌더링과 SEO 태그(S4) → 가입하며 Favorite 저장, 해제, 로그아웃 → 로그인 시도 제한 → Private으로 내리면 사라짐. 끝나면 만든 항목을 모두 Private으로 둔다. |
| `npm run test:smoke -w e2e` | 아무 배포(`WEB_URL`, `ADMIN_URL`) | 읽기만: 지도가 그려지는지, Explore와 상세, 목록과 법적 고지 페이지, 없는 주소의 404, Admin의 Log in과 `/api`. 데이터를 바꾸지 않는다. |

## 로컬

1. 서버 구성을 HTTPS로 띄운다([deploy/README.md](../deploy/README.md) "로컬에서 확인하기"). 주소는 `web.lvh.me`, `admin.lvh.me`, `api.lvh.me`(공개 DNS가 127.0.0.1을 가리키는 이름, `TLS_MODE=internal`)다. Windows에서 Node는 `*.localhost`를 찾지 못해서 이 이름을 쓴다.
2. Place 데이터를 올린다(`COMPOSE_FILE=deploy/compose.yaml bash backend/seed/load-seed.sh`).
3. 테스트용 Admin 계정을 만든다. 이메일과 비밀번호는 `e2e/.auth/admin.json`(커밋하지 않는다)에 남는다.

```bash
npm run make-admin -w e2e
npm run test:local -w e2e
```

## 배포에

```bash
WEB_URL=https://queenstown-web.onrender.com ADMIN_URL=https://queenstown-admin.onrender.com npm run test:smoke -w e2e
```

무료 서버가 잠들어 있으면 첫 요청이 1분쯤 걸려 시간 초과가 날 수 있다. 한 번 열어 깨운 뒤 다시 돌린다.

## 알아 둘 것

- 지도(Mapbox, WebGL)는 소프트웨어 렌더링(`--use-angle=swiftshader`)으로 그린다. Marker는 canvas라서 누르지 않고, 선택은 URL(`/?place=slug`)로 연다.
- Next.js가 빈 `role="alert"`(화면 이동 안내)를 늘 두므로, 오류 문구는 글자로 찾는다.
- Admin의 필수 칸 이름 뒤 `*`는 접근성 이름에서 빠진다. 칸은 `getByRole(..., { name })`로 찾는다.
