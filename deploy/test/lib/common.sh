#!/usr/bin/env bash
# ============================================
# Общие утилиты для скриптов тестового деплоя
# (бездоменный запуск на Ruvds, self-signed)
# ============================================
# Скрипты вызываются из каталога deploy/test,
# но пути к проекту вычисляются автоматически.

set -euo pipefail

# --- Пути ------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DEPLOY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$TEST_DEPLOY_DIR/../.." && pwd)"

ENV_FILE="$TEST_DEPLOY_DIR/.env"
ENV_TEMPLATE="$TEST_DEPLOY_DIR/.env.test-deploy.example"

COMPOSE_PROD="$PROJECT_ROOT/docker-compose.prod.yml"
COMPOSE_DB="$PROJECT_ROOT/docker-compose.db.yml"
SSL_DIR="$PROJECT_ROOT/ssl"

# --- Цвета и логирование -------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
info() { log "${CYAN}[INFO]${NC} $*"; }
ok()   { log "${GREEN}[OK]${NC} $*"; }
warn() { log "${YELLOW}[WARN]${NC} $*"; }
err()  { log "${RED}[ERROR]${NC} $*" >&2; }
die()  { err "$*"; exit 1; }

# --- Проверки --------------------------------------------------------
require_cmd() {
    local cmd=$1
    command -v "$cmd" >/dev/null 2>&1 \
        || die "Не найден '${cmd}'. Установите его (например: sudo apt install ${cmd})."
}

require_root_or_sudo() {
    if [[ $EUID -ne 0 ]]; then
        die "Нужны права root. Запустите с sudo: sudo $0 $*"
    fi
}

check_docker() {
    require_cmd docker
    if ! docker compose version >/dev/null 2>&1; then
        die "Нужен Docker Compose v2 (плагин 'docker compose'). Установите docker-compose-plugin."
    fi
    if ! docker info >/dev/null 2>&1; then
        die "Docker daemon не запущен или нет прав у пользователя. Проверьте: docker info"
    fi
}

ensure_env_file() {
    [[ -f "$ENV_FILE" ]] \
        || die "Нет файла $ENV_FILE. Сначала выполните: deploy/test/01-prepare-env.sh"
}

# --- Работа с .env ----------------------------------------------------
# env_get KEY [file] — возвращает значение ключа (без кавычек)
env_get() {
    local key=$1
    local file=${2:-$ENV_FILE}
    local val
    val="$(grep -E "^${key}=" "$file" | tail -1 | cut -d= -f2- | tr -d '"')"
    if [[ -z "$val" ]]; then
        die "Переменная ${key} не задана в $file"
    fi
    printf '%s' "$val"
}

# --- Docker Compose (всегда из корня проекта, с нашим .env) -----------
compose_prod() {
    (cd "$PROJECT_ROOT" && docker compose --env-file "$ENV_FILE" -f "$COMPOSE_PROD" "$@")
}

compose_db() {
    (cd "$PROJECT_ROOT" && docker compose --env-file "$ENV_FILE" -f "$COMPOSE_DB" "$@")
}

# --- Ожидание healthcheck ---------------------------------------------
wait_healthy() {
    local container=$1
    local attempts=${2:-30}
    local delay=${3:-3}
    info "Ожидание healthcheck контейнера '$container' (до $((attempts * delay)) c)..."
    for ((i = 1; i <= attempts; i++)); do
        local status
        status="$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo missing)"
        if [[ "$status" == "healthy" ]]; then
            ok "Контейнер '$container' healthy"
            return 0
        fi
        if [[ "$status" == "missing" ]]; then
            err "Контейнер '$container' не найден"
            return 1
        fi
        sleep "$delay"
    done
    err "Контейнер '$container' не стал healthy за $((attempts * delay)) c"
    return 1
}