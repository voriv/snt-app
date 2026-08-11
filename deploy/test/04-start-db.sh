#!/usr/bin/env bash
# ============================================
# 04 — Запуск PostgreSQL (docker-compose.db.yml)
# ============================================
# Поднимает БД на 127.0.0.1:5432 и ждёт healthy.
#
# Запуск: sudo deploy/test/04-start-db.sh
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

require_root_or_sudo "$0"
check_docker
ensure_env_file

info "Запуск PostgreSQL (docker-compose.db.yml)..."
compose_db up -d db

wait_healthy "snt-prod-db" 30 3 || die "БД не стала healthy"

ok "PostgreSQL запущен и healthy на 127.0.0.1:5432"

# Краткая проверка pg_isready через контейнер
compose_db exec -T db pg_isready -U "$(env_get POSTGRES_USER)" -d "$(env_get POSTGRES_DB)" \
    || die "pg_isready не отвечает"

ok "pg_isready: БД принимает подключения"