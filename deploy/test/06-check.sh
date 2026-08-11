#!/usr/bin/env bash
# ============================================
# 06 — Проверка работы стека (healthcheck)
# ============================================
# Локально: статус контейнеров, /api/health,
# TLS изнутри nginx. Опционально через LOCAL_IP
# (флаг -r) проверяет HTTPS снаружи сервера.
#
# Запуск: sudo deploy/test/06-check.sh
#   deploy/test/06-check.sh -r    (проверить снаружи тоже)
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

require_root_or_sudo "$0"
ensure_env_file

PUBLIC_IP="$(env_get PUBLIC_IP)"
REMOTE=0
[[ "${1:-}" == "-r" || "${1:-}" == "--remote" ]] && REMOTE=1

info "=== Проверка тестового стека (PUBLIC_IP=$PUBLIC_IP) ==="

# 1. Статус контейнеров
echo ""
echo "--- docker ps (проект) ---"
docker ps --filter "name=snt-prod-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 2. nginx -t
echo ""
echo "--- nginx -t ---"
compose_prod exec -T nginx nginx -t || warn "Конфигурация nginx содержит ошибки"

# 3. Healthcheck app (локально через nginx)
echo ""
echo "--- /api/health (через nginx, localhost) ---"
curl -sk https://localhost/api/health && echo || warn "Healthcheck по https://localhost недоступен"

# 4. Healthcheck app напрямую (app:3000)
echo ""
echo "--- /api/health (напрямую, 127.0.0.1:3000) ---"
curl -s http://127.0.0.1:3000/api/health && echo || warn "Прямой доступ к app:3000 не отвечает"

# 5. TLS-заголовки
echo ""
echo "--- TLS (HTTPS по публичному IP, без проверки сертификата) ---"
curl -skI "https://$PUBLIC_IP/" | head -5 || warn "HTTPS по публичному IP не отвечает (проверьте порт 443)"

# 6. Редирект HTTP → HTTPS
echo ""
echo "--- HTTP (ожидаем 301) ---"
curl -sI "http://$PUBLIC_IP/" | head -3 || warn "HTTP-редирект не работает"

# 7. (опционально) внешняя проверка по публичному IP
if [[ "$REMOTE" -eq 1 ]]; then
    echo ""
    echo "--- Внешняя проверка (извне сервера) ---"
    curl -sk "https://$PUBLIC_IP/api/health" && echo || warn "Внешний HTTPS недоступен (проверьте firewall Ruvds)"
fi

info "=== Проверка завершена ==="