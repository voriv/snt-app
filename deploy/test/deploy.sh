#!/usr/bin/env bash
# ============================================
# deploy.sh — единый скрипт тестового деплоя
# БЕЗ домена (self-signed HTTPS, Ruvds)
# ============================================
# Полный цикл: проверка → env → сертификаты →
# порты → БД → app+nginx → проверки.
#
# Запуск: sudo deploy/test/deploy.sh
#   sudo deploy/test/deploy.sh --full
#   sudo deploy/test/deploy.sh start        # без проверки предусловий во время исполнения
#   sudo deploy/test/deploy.sh stop
#   sudo deploy/test/deploy.sh check
#   sudo deploy/test/deploy.sh cleanup
# ============================================

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

ACTION="${1:-full}"

case "$ACTION" in
    full)
        # Полный цикл (предусловия внутри каждого шага уже есть)
        info "=== Полное тестовое развёртывание ==="
        "$SCRIPT_DIR/00-check-prereq.sh"
        if [[ ! -f "$ENV_FILE" ]]; then
            "$SCRIPT_DIR/01-prepare-env.sh"
        else
            warn "Файл .env уже есть — пропуск подготовки."
        fi
        "$SCRIPT_DIR/02-generate-certs.sh"
        "$SCRIPT_DIR/03-open-ports.sh" 2>/dev/null || warn "Пропуск ufw (нет прав/не установлен)"
        "$SCRIPT_DIR/04-start-db.sh"
        "$SCRIPT_DIR/05-start-app.sh"
        "$SCRIPT_DIR/06-check.sh"
        ok "=== Деплой завершён ==="
        ;;
    start)
        # Только запуск (не пересоздавая env/certs)
        info "=== Старт стека ==="
        "$SCRIPT_DIR/04-start-db.sh"
        "$SCRIPT_DIR/05-start-app.sh"
        ;;
    stop)
        "$SCRIPT_DIR/07-stop.sh"
        ;;
    check)
        "$SCRIPT_DIR/06-check.sh" -r
        ;;
    cleanup)
        "$SCRIPT_DIR/09-cleanup.sh"
        ;;
    *)
        die "Неизвестное действие: $ACTION (допустимо: full|start|stop|check|cleanup)"
        ;;
esac