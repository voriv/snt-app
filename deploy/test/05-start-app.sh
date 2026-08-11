#!/usr/bin/env bash
# ============================================
# 05 — Запуск приложения (app) и nginx
# ============================================
# Поднимает app (Next.js) и nginx с self-signed TLS.
# СЕРВИС certbot НЕ запускается (нужен реальный домен).
# Если образа нет в registry — собирается из исходников.
#
# Запуск: sudo deploy/test/05-start-app.sh
#   --build — принудительная сборка образа
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

FORCE_BUILD=0
[[ "${1:-}" == "--build" || "${1:-}" == "-b" ]] && FORCE_BUILD=1

require_root_or_sudo "$0"
check_docker
ensure_env_file

DOMAIN="$(env_get DOMAIN)"
image="$(env_get IMAGE)"
nginx_conf="$PROJECT_ROOT/nginx/default.conf"

# 1. Сертификаты должны существовать ДО старта nginx
if [[ ! -f "$SSL_DIR/live/$DOMAIN/privkey.pem" || ! -f "$SSL_DIR/live/$DOMAIN/fullchain.pem" ]]; then
    die "Self-signed сертификаты для DOMAIN=$DOMAIN не найдены. Выполните: sudo deploy/test/02-generate-certs.sh"
fi
ok "Сертификаты для '$DOMAIN' на месте"

# 2. server_name в nginx: предупреждение, если там фиксированный домен
if grep -q "server_name" "$nginx_conf"; then
    if grep -qE "server_name [a-zA-Z0-9.-]+\.(ru|com|net|org|site|info)\b" "$nginx_conf"; then
        warn "В nginx/default.conf указан конкретный реальный домен. \
Для теста по IP лучше server_name _; (по умолчанию). Проверьте конфиг."
    fi
fi

# 3. Образ: проверить наличие локально
if ! docker image inspect "$image" >/dev/null 2>&1 || [[ "$FORCE_BUILD" -eq 1 ]]; then
    info "Образ '$image' не найден локально — сборка из исходников (может занять время)..."
    (cd "$PROJECT_ROOT" && docker compose --env-file "$ENV_FILE" -f "$COMPOSE_PROD" build app)
else
    ok "Образ '$image' уже есть локально"
fi

# 4. Запуск app + nginx (без certbot)
info "Запуск app и nginx (без certbot)..."
compose_prod up -d app nginx

# 5. Проверки
info "Проверка состояния контейнеров..."
compose_prod ps app nginx

# Ожидание healthcheck app
if ! wait_healthy "snt-prod-app" 30 5; then
    err "App не стал healthy. Логи:"
    compose_prod logs --tail=50 app
    exit 1
fi

if ! compose_prod exec -T nginx nginx -t >/dev/null 2>&1; then
    err "Конфигурация nginx невалидна. Логи:"
    compose_prod logs --tail=30 nginx
    exit 1
fi

PUBLIC_IP="$(env_get PUBLIC_IP)"
HOST_PORT="${PROD_HTTPS_PORT:-443}"

report() {
    echo ""
    echo "✅ Стек запущен."
    echo "   HTTPS:   https://$PUBLIC_IP/ (в браузере подтвердите предупреждение)"
    echo "   HTTP:    http://$PUBLIC_IP/ (редирект на HTTPS)"
    echo "   Health:  curl -k https://$PUBLIC_IP/api/health"
    echo "   НЕ забудьте открыть порты: sudo deploy/test/03-open-ports.sh"
}
report