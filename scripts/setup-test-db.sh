#!/usr/bin/env bash
# Create the local Postgres database the test suite runs against.
#
# Why local: the suite makes 10-20 queries per test. Against a remote Neon branch that is
# ~200-400ms of round trip each, which put a full run at ~25 minutes and caused stalls that
# surfaced as timeout failures in a different file on every run. Locally the same queries
# cost microseconds.
#
# One-time, if Postgres is not installed yet:
#   brew install postgresql@17 && brew services start postgresql@17
#
# Then:
#   ./scripts/setup-test-db.sh
#   npm test
set -euo pipefail

DB_NAME="${TEST_DB_NAME:-tecxwork_test}"
DB_URL="postgresql://localhost:5432/${DB_NAME}"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Install Postgres first:" >&2
  echo "  brew install postgresql@17 && brew services start postgresql@17" >&2
  echo "(then re-run this script; you may need to add it to PATH)" >&2
  exit 1
fi

if ! pg_isready -q 2>/dev/null; then
  echo "Postgres is installed but not accepting connections. Start it with:" >&2
  echo "  brew services start postgresql@17" >&2
  exit 1
fi

echo "==> creating database ${DB_NAME} (dropping any previous one)"
dropdb --if-exists "${DB_NAME}"
createdb "${DB_NAME}"

echo "==> applying the schema"
# push builds every table straight from schema.ts. Safe here because the database was just
# created empty — never point this at a database holding data.
DATABASE_URL="${DB_URL}" npx drizzle-kit push --force

echo
echo "Done. Run the suite with:"
echo "  TEST_DATABASE_URL=\"${DB_URL}\" npm test"
echo
echo "Or add this line to .env.local so npm test just works:"
echo "  TEST_DATABASE_URL=${DB_URL}"
