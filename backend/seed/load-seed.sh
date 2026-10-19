#!/usr/bin/env bash
# Loads the seed files (places.csv, events.csv, notices.csv) into the local database
# (docker compose service "db"). Run from the repository root: bash backend/seed/load-seed.sh
#
# With DATABASE_URL set (a postgresql:// address, such as Neon's connection string), the files go to
# that database instead, through psql in a postgres container, so no local psql is needed:
#   DATABASE_URL='postgresql://user:password@host/db?sslmode=require' bash backend/seed/load-seed.sh
#
# Everything runs in one transaction: if any row of any file is refused, nothing is changed.
set -euo pipefail

seed_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# COPY ... FROM STDIN inside a script reads the lines that follow it, up to a line "\.".
# sed drops the carriage returns of Windows line ends (a file saved by Excel), which COPY refuses
# when they are mixed with plain ones, and adds the last newline when a file has none, so "\."
# starts a line of its own.
copy() {
  printf 'COPY %s FROM STDIN (FORMAT csv, HEADER true);\n' "$1"
  sed -e 's/\r$//' -e '$a\' "$seed_dir/$2"
  printf '\\.\n'
}

psql_in() {
  if [ -n "${DATABASE_URL:-}" ]; then
    docker run --rm -i postgres:17 psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction -f -
  else
    docker compose exec -T db psql \
      -U "${DB_USER:-queenstown}" -d "${DB_NAME:-queenstown}" \
      -v ON_ERROR_STOP=1 --single-transaction -f -
  fi
}

{
  cat "$seed_dir/create-staging.sql"
  copy seed_place places.csv
  copy seed_event events.csv
  copy seed_notice notices.csv
  cat "$seed_dir/upsert-places.sql" "$seed_dir/upsert-events.sql" "$seed_dir/upsert-notices.sql"
} | psql_in
