# 앱 아이콘과 스플래시 원본

`mobile/assets`의 PNG는 이 폴더의 SVG에서 1024×1024로 내보낸 것이다. 그림을 바꿀 때는 SVG를 고치고 PNG를 다시 내보낸 뒤 개발 빌드를 다시 만든다(`npx expo prebuild --platform android --clean`, `npm run android`).

| SVG | PNG | 쓰임 |
|---|---|---|
| `icon.svg` | `icon.png` | 앱 아이콘(iOS, 적응형 아이콘이 없는 Android). 배경까지 칠한 정사각형, 투명 없음 |
| `foreground.svg` | `android-icon-foreground.png` | Android 적응형 아이콘의 앞면. 투명 배경, 그림은 가운데 61% 원(108dp 중 66dp) 안에 둔다. 가장자리는 기기마다 잘린다 |
| `monochrome.svg` | `android-icon-monochrome.png` | Android 13+ 테마 아이콘. 한 가지 색, 산은 핀에서 뚫는다 |
| `splash.svg` | `splash-icon.png` | 스플래시 화면 가운데 그림. 투명 배경 |

- 색: 호수색 `#0369a1`(적응형 아이콘 배경, 스플래시 배경, `app.config.ts`의 `BRAND_BLUE`)과 흰색.
- 그림: Map First를 뜻하는 지도 핀, 안에 Lake Wakatipu 위의 산.
- 내보내기: 브라우저로 SVG를 열어 1024×1024로 캡처하거나 SVG 편집기에서 PNG로 저장한다. 투명이 필요한 세 장은 배경을 투명으로 둔다.
