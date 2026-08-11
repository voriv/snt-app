#!/usr/bin/env bash
# ============================================
# 02 — Генерация self-signed сертификатов
# для тестового HTTPS БЕЗ реального домена
# ============================================
# Создаёт ./ssl/live/${DOMAIN}/{privkey.pem,fullchain.pem}
# с SAN (IP + localhost). Файлы обязаны существовать
# ДО старта nginx (см. nginx/default.conf).
#
# Запуск: sudo deploy/test/02-generate-certs.sh
#   --force — пересоздать сертификат, если уже есть
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

FORCE=0
[[ "${1:-}" == "--force" || "${1:-}" == "-f" ]] && FORCE=1

require_root_or_sudo "$0"
ensure_env_file

require_cmd openssl

DOMAIN="$(env_get DOMAIN)"
PUBLIC_IP="$(env_get PUBLIC_IP)"

SSL_LIVE="$SSL_DIR/live/$DOMAIN"
CERT_KEY="$SSL_LIVE/privkey.pem"
CERT_PEM="$SSL_LIVE/fullchain.pem"

if [[ -f "$CERT_KEY" && -f "$CERT_PEM" && "$FORCE" -ne 1 ]]; then
    ok "Сертификаты уже существуют: $SSL_LIVE (для пересоздания: --force)"
    exit 0
fi

info "Генерация self-signed сертификата для DOMAIN=$DOMAIN (SAN: IP $PUBLIC_IP, localhost)"
mkdir -p "$SSL_LIVE"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERT_KEY" \
    -out "$CERT_PEM" \
    -subj "/CN=${DOMAIN}" \
    -addext "subjectAltName=IP:${PUBLIC_IP},DNS:${PUBLIC_IP},DNS:localhost" 2>/dev/null \
    || openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$CERT_KEY" \
        -out "$CERT_PEM" \
        -subj "/CN=${DOMAIN}" \
        -addext "subjectAltName=IP:${PUBLIC_IP},DNS:localhost"

chmod 600 "$CERT_KEY"

ok "Сертификаты созданы:"
echo "  key : $CERT_KEY"
echo "  cert: $CERT_PEM"

info "Проверка сертификата:"
openssl x509 -in "$CERT_PEM" -noout -subject -ext subjectAltName