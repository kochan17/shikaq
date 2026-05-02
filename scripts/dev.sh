#!/usr/bin/env bash
# que dev environment runner
#
# 起動するもの:
#   1. Supabase ローカル (Docker、まだ起動してなければ)
#   2. Edge Functions runtime  (supabase functions serve)
#   3. Stripe webhook 転送      (stripe listen)
#   4. Expo Web dev server     (npm run web)
#
# Ctrl+C で 2-4 を停止。Supabase コンテナは残します（停止したい時は scripts/stop.sh）。

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# ────────── 設定 ──────────
EDGE_LOG="$ROOT/.dev/edge.log"
STRIPE_LOG="$ROOT/.dev/stripe.log"
EXPO_LOG="$ROOT/.dev/expo.log"
TUNNEL_LOG="$ROOT/.dev/tunnel.log"
TUNNEL_URL_FILE="$ROOT/.dev/tunnel-url"
mkdir -p "$ROOT/.dev"

STRIPE_BIN="${STRIPE_BIN:-$HOME/.local/bin/stripe}"
if ! [ -x "$STRIPE_BIN" ]; then
  STRIPE_BIN="$(command -v stripe || true)"
fi

# .env から Stripe Secret Key を読む
EDGE_ENV="$ROOT/supabase/functions/.env"
if [ -f "$EDGE_ENV" ]; then
  STRIPE_KEY="$(grep -E '^STRIPE_SECRET_KEY=' "$EDGE_ENV" | cut -d= -f2- | tr -d '"' | tr -d "'" || true)"
else
  STRIPE_KEY=""
fi

# Supabase Auth が config.toml の env(SUPABASE_AUTH_EXTERNAL_*) を解決するために
# シェル環境変数として export する (Edge Functions の --env-file は SUPABASE_* を弾くので別経路)
# `|| [ -n "$key" ]` で末尾改行なしファイルの最終行も読む
if [ -f "$EDGE_ENV" ]; then
  while IFS='=' read -r key val || [ -n "$key" ]; do
    case "$key" in
      SUPABASE_AUTH_EXTERNAL_*)
        val="${val%\"}"; val="${val#\"}"
        val="${val%\'}"; val="${val#\'}"
        export "$key=$val"
        ;;
    esac
  done < "$EDGE_ENV"
fi

# ────────── PID 管理 ──────────
pids=()

cleanup() {
  echo
  echo "[dev] stopping foreground services..."
  for pid in "${pids[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  # 子孫まで掃除
  pkill -P $$ 2>/dev/null || true
  echo "[dev] stopped. (Supabase containers still running — use scripts/stop.sh to also stop them)"
  exit 0
}
trap cleanup INT TERM

# ────────── 1. Supabase ローカル ──────────
if supabase status >/dev/null 2>&1; then
  echo "[dev] supabase already running"
else
  echo "[dev] starting supabase..."
  supabase start
fi

# ────────── 2. Edge Functions ──────────
echo "[dev] starting edge functions  → log: $EDGE_LOG"
(supabase functions serve --env-file "$EDGE_ENV" >"$EDGE_LOG" 2>&1) &
pids+=($!)

# ────────── 3. Stripe listen ──────────
if [ -z "${STRIPE_KEY:-}" ]; then
  echo "[dev] STRIPE_SECRET_KEY not set in $EDGE_ENV — skipping stripe listen"
elif [ -z "${STRIPE_BIN:-}" ]; then
  echo "[dev] stripe CLI not found — skipping stripe listen"
else
  echo "[dev] starting stripe listen  → log: $STRIPE_LOG"
  ("$STRIPE_BIN" listen \
    --api-key "$STRIPE_KEY" \
    --forward-to localhost:54321/functions/v1/stripe-webhook \
    >"$STRIPE_LOG" 2>&1) &
  pids+=($!)
fi

# ────────── 4. Expo Web ──────────
echo "[dev] starting expo web        → log: $EXPO_LOG"
(cd "$ROOT/que-app" && npm run web >"$EXPO_LOG" 2>&1) &
pids+=($!)

# ────────── 5. Cloudflare Tunnel (Supabase API を HTTPS 公開) ──────────
# Vercel 等の HTTPS 環境から localhost Supabase を叩くための mixed-content 対策
CLOUDFLARED_BIN="$(command -v cloudflared || true)"
if [ -z "${CLOUDFLARED_BIN:-}" ]; then
  echo "[dev] cloudflared not found — skipping tunnel"
else
  echo "[dev] starting cloudflared     → log: $TUNNEL_LOG"
  : > "$TUNNEL_LOG"
  : > "$TUNNEL_URL_FILE"
  ("$CLOUDFLARED_BIN" tunnel --url http://localhost:54321 \
    --logfile "$TUNNEL_LOG" --loglevel info >>"$TUNNEL_LOG" 2>&1) &
  pids+=($!)
  # URL が log に出るまで待つ (最大 30 秒)
  (
    for _ in $(seq 1 30); do
      url=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1)
      if [ -n "$url" ]; then
        echo "$url" > "$TUNNEL_URL_FILE"
        break
      fi
      sleep 1
    done
  ) &
fi

echo
echo "──────────────────────────────────────────────"
echo "  que dev environment running"
echo "──────────────────────────────────────────────"
echo "  App        http://localhost:8081"
echo "  Supabase   http://127.0.0.1:54321"
echo "  Studio     http://127.0.0.1:54323"
echo "  Mailpit    http://127.0.0.1:54324"
echo "  Tunnel     cat $TUNNEL_URL_FILE  (起動後に表示)"
echo
echo "  Logs:"
echo "    edge   tail -f $EDGE_LOG"
echo "    stripe tail -f $STRIPE_LOG"
echo "    expo   tail -f $EXPO_LOG"
echo "    tunnel tail -f $TUNNEL_LOG"
echo
echo "  Ctrl+C で foreground services を停止"
echo "──────────────────────────────────────────────"

wait
