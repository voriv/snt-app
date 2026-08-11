#!/usr/bin/env bash
# ============================================
# 09 — Полная очистка тестового развёртывания
# ============================================
# Останавливает и УДАЛЯЕТ контейнеры, сети, тома
# БД (данные!!), а также ./ssl (сертификаты).
# Файл .env сохраняется, чтобы пересоздать стек быстро.
#
# Запуск: sudo deploy/test/09-cleanup.sh
#   SKIP_SSL=1 — не удалять сертификаты
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

require_root_or_sudo "$0"
check_docker

warn "Это удалит контейнеры, сети, ТОМА БД и сертификаты!"
read -r -p "Продолжить? [y/N]: " ans
if [[ "${ans,,}" != "y" ]]; then
    info "Отменено."
    exit 0
fi

if [[ -f "$ENV_FILE" ]]; then
    info "Остановка и удаление prod-стека (с томами)..."
    compose_prod down -v 2>/dev/null || true
    info "Остановка и удаление db-стека (с томами)..."
    compose_db down -v 2>/dev/null || true
else
    info "Нет .env — останавливаю по именам."
    docker stop snt-prod-app snt-prod-nginx snt-prod-db 2>/dev/null || true
    docker rm -f snt-prod-app snt-prod-nginx snt-prod-db 2>/dev/null || true
fi

# Удаление сертификатов (по умолчанию)
if [[ "${SKIP_SSL:-0}" != "1" && -d "$SSL_DIR" ]]; then
    info "Удаление self-signed сертификатов ($SSL_DIR)..."
    rm -rf "$SSL_DIR"
    ok "Сертификаты удалены."
fi

ok "Очистка завершена. Файл конфигурации .env сохранён (пересоздание: 02/04/05)."