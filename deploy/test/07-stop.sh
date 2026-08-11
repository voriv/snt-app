#!/usr/bin/env bash
# ============================================
# 07 — Остановка стека (контейнеры, без удаления данных)
# ============================================
# Останавливает app/nginx (prod-compose) и db (db-compose).
# Данные (тома БД, ssl, .env) сохраняются.
#
# Запуск: sudo deploy/test/07-stop.sh
# Для полной очистки (с томами) — 09-cleanup.sh
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

require_root_or_sudo "$0"
check_docker

if [[ -f "$ENV_FILE" ]]; then
    info "Остановка стека (app, nginx)..."
    compose_prod stop app nginx
    info "Остановка БД (db)..."
    compose_db stop db
    ok "Стек остановлен. Данные сохранены."
else
    warn "Нет .env — останавливаю только существующие контейнеры по именам."
    docker stop snt-prod-app snt-prod-nginx snt-prod-db 2>/dev/null || true
fi