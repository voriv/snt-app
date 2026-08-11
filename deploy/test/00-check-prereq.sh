#!/usr/bin/env bash
# ============================================
# 00 — Проверка предусловий тестового деплоя
# ============================================
# Проверяет: root/sudo, docker, compose v2,
# openssl, наличие файлов проекта, порты занятости.
# Запуск: sudo deploy/test/00-check-prereq.sh
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

info "=== Проверка предусловий тестового развёртывания ==="

# 1. Права
if [[ $EUID -ne 0 ]]; then
    warn "Рекомендуется запускать с sudo (часть проверок требует root)."
fi

# 2. Утилиты
for cmd in docker openssl curl; do
    require_cmd "$cmd"
done
ok "Утилиты найдены: docker, openssl, curl"

# 3. Docker Compose v2
check_docker
ok "Docker и Compose v2 работают"

# 4. Файлы проекта
[[ -f "$COMPOSE_PROD" ]] || die "Не найден $COMPOSE_PROD"
[[ -f "$COMPOSE_DB" ]]   || die "Не найден $COMPOSE_DB"
[[ -f "$PROJECT_ROOT/nginx/default.conf" ]] || die "Не найден nginx/default.conf"
ok "Файлы compose и nginx на месте"

# 5. .env — создан ли
if [[ -f "$ENV_FILE" ]]; then
    warn "Файл .env уже существует. При необходимости пересоздайте: 01-prepare-env.sh --force"
else
    warn "Файл .env отсутствует. Создайте его: sudo deploy/test/01-prepare-env.sh"
fi

# 6. Занятость портов 80/443/5432 (не критично, только предупреждение)
for port in 80 443 5432; do
    if ss -ltn 2>/dev/null | grep -q ":${port}[[:space:]]"; then
        warn "Порт $port уже занят на хосте — возможны конфликты."
    fi
done

# 7. Стиль выполнимости
if command -v dos2unix >/dev/null 2>&1; then
    ok "dos2unix доступен (для Windows-переноса строк, если нужно)"
fi

info "=== Проверка завершена ==="