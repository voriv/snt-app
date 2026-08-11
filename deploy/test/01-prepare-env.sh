#!/usr/bin/env bash
# ============================================
# 01 — Создание конфигурационного файла .env
# для тестового развёртывания БЕЗ домена
# ============================================
# Интерактивно запрашивает PUBLIC_IP (или берёт
# из первого аргумента/флага PUBLIC_IP=...), секреты
# и генерирует deploy/test/.env из шаблона.
#
# Примеры:
#   sudo deploy/test/01-prepare-env.sh
#   sudo deploy/test/01-prepare-env.sh 45.88.123.45
#   sudo deploy/test/01-prepare-env.sh --force 45.88.123.45
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

FORCE=0
PUBLIC_IP=""

# --- Разбор аргументов -------------------------------------------------
for arg in "$@"; do
    case "$arg" in
        --force|-f) FORCE=1 ;;
        PUBLIC_IP=*) PUBLIC_IP="${arg#PUBLIC_IP=}" ;;
        *)
            if [[ -z "$PUBLIC_IP" ]]; then
                PUBLIC_IP="$arg"
            fi
            ;;
    esac
done

# --- Проверки -----------------------------------------------------------
require_root_or_sudo "$0"
check_docker

if [[ -f "$ENV_FILE" && "$FORCE" -ne 1 ]]; then
    die "Файл $ENV_FILE уже существует. Используйте --force для пересоздания."
fi

[[ -f "$ENV_TEMPLATE" ]] || die "Шаблон $ENV_TEMPLATE не найден."

# --- PUBLIC_IP -----------------------------------------------------------
if [[ -z "$PUBLIC_IP" ]]; then
    read -r -p "Введите публичный IP этого VPS (например 45.88.123.45): " PUBLIC_IP
fi

if [[ -z "$PUBLIC_IP" ]]; then
    die "PUBLIC_IP обязателен."
fi

# Валидация IP-адреса
if ! [[ "$PUBLIC_IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    warn "Формат IP необычный: $PUBLIC_IP (ожидался x.x.x.x). Продолжаем как есть."
fi

info "Публичный IP: $PUBLIC_IP"

# --- Генерация секретов ---------------------------------------------------
NEXTAUTH_SECRET="$(openssl rand -base64 32 | tr -d '\n')"
WS_INTERNAL_SECRET="$(openssl rand -base64 32 | tr -d '\n')"
DB_PASSWORD="$(openssl rand -base64 18 | tr -dc 'A-Za-z0-9' | head -c 18)"

info "Сгенерированы секреты (NEXTAUTH_SECRET, WS_INTERNAL_SECRET, POSTGRES_PASSWORD)."

# --- Сборка .env из шаблона ------------------------------------------------
{
    echo "# Автоматически сгенерировано $(date '+%Y-%m-%d %H:%M:%S')"
    echo "# Тестовое развёртывание БЕЗ домена. Не редактируйте вручную без необходимости."
    echo ""
    echo "PUBLIC_IP=\"$PUBLIC_IP\""
    echo ""
    echo "POSTGRES_USER=\"snt_user\""
    echo "POSTGRES_PASSWORD=\"$DB_PASSWORD\""
    echo "POSTGRES_DB=\"snt_db\""
    echo "DB_BIND_ADDRESS=\"127.0.0.1\""
    echo "DATABASE_URL=\"postgresql://snt_user:$DB_PASSWORD@127.0.0.1:5432/snt_db?schema=public\""
    echo ""
    echo "NEXTAUTH_URL=\"https://$PUBLIC_IP\""
    echo "NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\""
    echo "WS_INTERNAL_SECRET=\"$WS_INTERNAL_SECRET\""
    echo ""
    echo "DOMAIN=\"$PUBLIC_IP\""
    echo "ACME_EMAIL=\"test@example.com\""
    echo ""
    echo "# Из шаблона (встраиваются в bundle при сборке)"
    grep -E '^(NEXT_PUBLIC_APP_NAME|NEXT_PUBLIC_APP_DESCRIPTION|MAX_FILE_SIZE|IMAGE)=' "$ENV_TEMPLATE"
    echo ""
    echo "# Часть шаблона (проверка)"
    echo "# END"
} > "$ENV_FILE"

# Права — пароли в файле, читать должен только root/владелец
chmod 600 "$ENV_FILE"

ok "Файл конфигурации создан: $ENV_FILE"
info "Проверьте содержимое (особенно POSTGRES_PASSWORD и NEXTAUTH_URL)."

# Показать финальный файл
cat "$ENV_FILE"