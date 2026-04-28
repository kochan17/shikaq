#!/usr/bin/env bash
# shikaq dev environment stopper
#
# 停止するもの:
#   1. Expo dev server (port 8081)
#   2. Stripe listen
#   3. supabase functions serve
#   4. Supabase ローカル (Docker コンテナ)

set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[stop] killing port 8081 (expo)..."
lsof -ti :8081 2>/dev/null | xargs -r kill 2>/dev/null || true

echo "[stop] killing stripe listen..."
pkill -f "stripe listen" 2>/dev/null || true

echo "[stop] killing supabase functions serve..."
pkill -f "supabase functions serve" 2>/dev/null || true

echo "[stop] stopping supabase docker containers..."
supabase stop 2>&1 | tail -3 || true

echo "[stop] done."
