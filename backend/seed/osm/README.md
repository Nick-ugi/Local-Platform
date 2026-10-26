# OpenStreetMap에서 가져온 Place

`backend/seed/places.csv`의 첫 데이터는 [OpenStreetMap](https://www.openstreetmap.org/)에서 가져왔다.

## 라이선스

OpenStreetMap의 데이터는 © OpenStreetMap contributors이고 [Open Database License(ODbL)](https://opendatacommons.org/licenses/odbl/)를 따른다.

- 이 데이터로 만든 `places.csv`도 ODbL을 따른다.
- 서비스의 About 화면에 "© OpenStreetMap contributors"와 라이선스 링크를 둔다. 상세 화면의 출처(Source)는 각 장소의 OpenStreetMap 페이지로 이어진다.
- 이 데이터의 라이선스는 저장소의 코드와 따로다. 코드에 라이선스를 정하더라도 이 파일은 ODbL이다.

## 다시 가져오기

저장소 루트에서 실행한다. 인터넷이 필요하고, 공개 Overpass 서버가 바쁘면 기다렸다가 다시 묻는다.

```bash
node backend/seed/osm/fetch-places.mjs
bash backend/seed/load-seed.sh
```

- 범위는 Queenstown 중심(-45.0312, 168.6626)에서 15km, 이름이 있는 것만이다.
- 분류: `amenity=restaurant|fast_food` → food, `cafe` → cafe, `bar|pub|biergarten` → bar, `tourism=attraction|viewpoint`와 `leisure=park` → activity, `shop=*` → shopping, `amenity=toilets|parking|library` → facility(toilet, parking, library), `clinic|doctors|hospital|pharmacy` → facility/medical, `tourism=information` + `information=office` → facility/information.
- 이미 파일에 있는 장소는 slug를 그대로 쓴다(같은 OpenStreetMap 주소로 찾는다). 한 번 공개한 slug는 바꾸지 않는다.
- 주소 태그가 없으면 주소는 `Queenstown`이다. 이런 장소는 아래 "주소 보완"의 캐시(`reverse-cache.json`)로 도로 이름을 채운다. 길이가 넘치는 전화번호와 영업시간, http(s)가 아닌 웹사이트는 비운다.
- OpenStreetMap에서 사라진 장소는 파일에서 빠지지만 DB에서는 지워지지 않는다. 내릴 때는 Admin에서 Private으로 바꾼다.
- 영업시간은 OpenStreetMap의 표기(`Mo-Su 08:00-16:00`) 그대로 저장한다. 화면은 읽을 수 있는 표기면 요일별 줄과 지금 열려 있는지(뉴질랜드 시각)를 보여 주고, 아니면 그대로 보여 준다(`shared/src/hours.ts`).

## 주소 보완

주소가 `Queenstown`뿐인 장소는 [Nominatim](https://nominatim.org/)의 역지오코딩으로 도로 이름을 채운다.

```bash
node backend/seed/osm/reverse.mjs
bash backend/seed/load-seed.sh
```

- 장소의 좌표로 `reverse?format=jsonv2&zoom=18&addressdetails=1`을 묻는다. [사용 정책](https://operations.osmfoundation.org/policies/nominatim/)대로 초당 1건 이하, 앱 이름이 든 User-Agent로 묻는다. 처음 한 번은 약 7분 걸린다.
- 답은 `reverse-cache.json`(OpenStreetMap 주소 → 번지, 도로, 동네 이름과 좌표)에 남기고, 캐시에 있는 장소는 다시 묻지 않는다. `fetch-places.mjs`로 다시 가져올 때도 이 캐시로 채운다.
- 주소는 `번지 도로, 도시`다. 도시(town, city, village)가 없을 때만 동네(suburb) 이름을 쓴다. Nominatim은 Queenstown 시내를 `Boydtown`이라 부르는데, 방문자가 알아보기 어렵다. 도로 이름이 없거나 Nominatim이 찾은 것이 장소에서 50m 넘게 떨어져 있으면 그 장소는 `Queenstown`으로 둔다. 다른 장소의 도로를 붙이는 것보다 낫다.
- Nominatim의 답도 OpenStreetMap 데이터라 ODbL을 따른다.

## 테스트

```bash
node --test backend/seed/osm/mapping.test.mjs
```
