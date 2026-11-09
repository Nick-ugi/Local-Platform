# 지도 마커 그림

지도 마커(종류 색의 원) 가운데 들어가는 흰 그림이다. 앱 탭에 쓰는 Ionicons 글꼴에서 `make-markers.ps1`이 그려 이 폴더와 `web/public/markers`에 같은 PNG를 쓴다. 이름 목록은 `shared/src/map/markerIcon.ts`의 `MARKER_ICONS`와 같다.

```bash
powershell -ExecutionPolicy Bypass -File mobile/assets/markers/make-markers.ps1
```

- 크기: 48×48 px, 1 pt에 3 px(`MARKER_ICON_PIXEL_RATIO`). 지도에서는 28 pt 원 안의 16 pt 그림이고, 선택한 마커에서는 조금 커진다.
- 색: 흰색, 배경 투명. 원의 색은 지도가 칠한다(`shared/src/categoryStyle.ts`).
- 그림을 바꿀 때는 스크립트의 Ionicons 이름을 고치고 다시 실행한다. 화장실처럼 두 이름을 주면 나란히 그린다. 새 그림을 더할 때는 `MARKER_ICONS`에도 더한다.
- 앱은 그림을 번들에 넣으므로 바꾼 뒤 Metro를 다시 읽으면 되고, 개발 빌드를 다시 만들 필요는 없다.
