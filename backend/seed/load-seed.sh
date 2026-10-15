#!/usr/bin/env bash
# Loads the seed files (places.csv, events.csv, notices.csv) into the local database
# (docker compose service "db"). Run from the repository root: bash backend/seed/load-seed.sh
#
# Everything runs in one transaction: if any row of any file is refused, nothing is changed.
set -euo pipefail

seed_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# COPY ... FROM STDIN inside a script reads the lines that follow it, up to a line "\.".
# sed adds the last newline when a file has none, so "\." starts a line of its own.
copy() {
  printf 'COPY %s FROM STDIN (FORMAT csv, HEADER true);\n' "$1"
  sed -e '$a\' "$seed_dir/$2"
  printf '\\.\n'
}

{
  cat "$seed_dir/create-staging.sql"
  copy seed_place places.csv
  copy seed_event events.csv
  copy seed_notice notices.csv
  cat "$seed_dir/upsert-places.sql" "$seed_dir/upsert-events.sql" "$seed_dir/upsert-notices.sql"
} | docker compose exec -T db psql \
  -U "${DB_USER:-queenstown}" -d "${DB_NAME:-queenstown}" \
  -v ON_ERROR_STOP=1 --single-transaction -f -
