#!/usr/bin/env bash
# Loads backend/seed/places.csv into the local database (docker compose service "db").
# Run from the repository root: bash backend/seed/load-places.sh
#
# Everything runs in one transaction: if any row is refused, nothing is changed.
set -euo pipefail

seed_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

docker compose exec -T db psql \
  -U "${DB_USER:-queenstown}" -d "${DB_NAME:-queenstown}" \
  -v ON_ERROR_STOP=1 --single-transaction \
  -c "$(cat "$seed_dir/create-staging.sql")" \
  -c "\\copy seed_place FROM pstdin (FORMAT csv, HEADER true)" \
  -c "$(cat "$seed_dir/upsert-places.sql")" \
  < "$seed_dir/places.csv"
