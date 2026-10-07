#!/usr/bin/env bash
# Export each screen in wireframe.html to png/{id}.png with headless Chrome.
# Usage (Git Bash):  bash docs/wireframes/export-png.sh [id ...]
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
[ -x "$CHROME" ] || { echo "Chrome not found. Set CHROME to the browser path." >&2; exit 1; }

# A throwaway profile keeps the export away from the user's own browser session.
PROFILE="$(cygpath -w "$(mktemp -d)")"
URL="file:///$(cygpath -m "$DIR/wireframe.html")"
run() { "$CHROME" --headless=new --disable-gpu --no-first-run --user-data-dir="$PROFILE" "$@" 2>/dev/null; }

# wireframe.html?measure=1 writes "id:WIDTHxHEIGHT,..." for every screen.
SIZES="$(run --window-size=5000,3000 --dump-dom "$URL?measure=1" | grep -o 'id="sizes">[^<]*' | sed 's/id="sizes">//' || true)"
[ -n "$SIZES" ] || { echo "Could not measure the screens." >&2; exit 1; }

mkdir -p "$DIR/png"
count=0
for entry in ${SIZES//,/ }; do
  id="${entry%%:*}"; wh="${entry##*:}"; w="${wh%%x*}"; h="${wh##*x}"
  if [ "$#" -gt 0 ] && [[ " $* " != *" $id "* ]]; then continue; fi
  case "$id" in d-*|ad-*) scale=1.5 ;; *) scale=2 ;; esac
  run --hide-scrollbars --force-device-scale-factor="$scale" --window-size="$((w + 32)),$((h + 32))" \
    --screenshot="$(cygpath -w "$DIR/png/$id.png")" "$URL?only=$id" >/dev/null
  count=$((count + 1))
done
echo "exported $count screen(s) to $DIR/png"
