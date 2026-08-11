#!/bin/bash
# ============================================
# Скрипт развёртывания СНТ приложения на Ubuntu
# ============================================
# Требования:
#   - Ubuntu 20.04+
#   - Права sudo
# ============================================

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Логирование
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

info() {
    log "${CYAN}[INFO]${NC} $1"
}

success() {
    log "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    log "${YELLOW}[WARN]${NC} $1"
}

error() {
    log "${RED}[ERROR]${NC} $1"
}

# Проверка прав sudo
check_sudo() {
    if [[ $EUID -ne 0 ]]; then
        error "Скрипт должен быть запущен с правами sudo!"
        exit 1
    fi
}

# Проверка версии Ubuntu
check_ubuntu_version() {
    info "Проверка версии Ubuntu..."
    
    if [[ ! -f /etc/os-release ]]; then
        error "Не удалось определить версию ОС"
        exit 1
    fi
    
    . /etc/os-release
    ubuntu_version=$(echo "$VERSION_ID" | cut -d. -f1)
    
    if [[ "$ubuntu_version" -lt 20 ]]; then
        error "Требуется Ubuntu 20.04+ (текущая: $VERSION_ID)"
        exit 1
    fi
    
    success "Ubuntu версия: $VERSION_ID"
}

# Установка Node.js через NVM
install_nodejs() {
    info "Проверка Node.js..."
    
    if command -v node &> /dev/null; then
        node_version=$(node -v)
        node_major=$(echo "$node_version" | cut -d'v' -f2 | cut -d'.' -f1)
        
        if [[ "$node_major" -ge 20 ]]; then
            success "Node.js уже установлен: $node_version"
            return 0
        else
            warn "Установлена старая версия Node.js: $node_version (требуется 20+)"
        fi
    fi
    
    info "Установка Node.js 24 через NVM..."
    
    # Установка NVM если нет
    if ! command -v nvm &> /dev/null; then
        export NVM_DIR="$HOME/.nvm"
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi
    
    # Установка Node.js
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 24
    nvm use 24
    nvm alias default 24
    
    node_version=$(node -v)
    success "Node.js установлен: $node_version"
}

# Установка PostgreSQL
install_postgresql() {
    info "Проверка PostgreSQL..."
    
    if command -v psql &> /dev/null; then
        psql_version=$(psql --version)
        success "PostgreSQL client уже установлен: $psql_version"
        
        # Проверка запущен ли сервис
        if systemctl is-active --quiet postgresql; then
            success "PostgreSQL сервис запущен"
        else
            warn "PostgreSQL сервис не запущен. Запуск..."
            systemctl start postgresql
            systemctl enable postgresql
        fi
        
        return 0
    fi
    
    info "Установка PostgreSQL 15..."
    
    # Добавление репозитория PostgreSQL
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
    
    # Обновление и установка
    apt-get update
    apt-get install -y postgresql-15 postgresql-client-15
    
    # Запуск и включение сервиса
    systemctl start postgresql
    systemctl enable postgresql
    
    psql_version=$(psql --version)
    success "PostgreSQL установлен: $psql_version"
}

# Настройка базы данных
setup_database() {
    info "Настройка базы данных..."
    
    # Создание пользователя и БД если не существуют
    sudo -u postgres psql -c "CREATE USER snt_user WITH PASSWORD 'snt_password';" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE DATABASE snt_db OWNER snt_user;" 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE snt_db TO snt_user;" 2>/dev/null || true
    
    success "База данных настроена"
}

# Установка зависимостей
install_dependencies() {
    info "Установка системных зависимостей..."
    apt-get install -y git curl wget build-essential
    
    info "Установка зависимостей npm..."
    npm ci
    success "Зависимости установлены"
}

# Настройка окружения
setup_environment() {
    info "Настройка окружения..."
    
    if [[ ! -f .env ]]; then
        if [[ -f .env.example ]]; then
            cp .env.example .env
            success "Создан .env из .env.example"
            warn "ОТРЕДАКТИРУЙТЕ .env перед запуском!"
        else
            error ".env.example не найден"
            exit 1
        fi
    else
        info ".env уже существует"
    fi
}

# Настройка Prisma и БД
setup_prisma() {
    info "Настройка Prisma..."
    
    npm run db:generate
    success "Prisma Client сгенерирован"
    
    npm run db:push
    success "Миграции применены"
}

# Сборка приложения
build_app() {
    info "Сборка приложения..."
    npm run build
    success "Приложение собрано"
}

# Настройка systemd сервиса
setup_systemd() {
    info "Настройка systemd сервиса..."
    
    cat > /etc/systemd/system/snt-app.service << EOF
[Unit]
Description=SNT Application
After=network.target postgresql.service

[Service]
Type=simple
User=${USER}
WorkingDirectory=$(pwd)
ExecStart=$(which node) $(pwd)/node_modules/.bin/next start -p 3000
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable snt-app
    systemctl start snt-app
    
    success "Systemd сервис настроен и запущен"
}

# ============================================
# Основная логика
# ============================================

echo -e "${CYAN}"
echo "========================================"
echo "  СНТ Приложение - Установка на Ubuntu"
echo "========================================"
echo -e "${NC}"

# Проверка прав
check_sudo

# Проверка версии Ubuntu
check_ubuntu_version

# Установка Node.js
install_nodejs

# Установка PostgreSQL
install_postgresql

# Настройка окружения
setup_environment

# Установка зависимостей
install_dependencies

# Настройка Prisma и БД
setup_prisma

# Сборка приложения
build_app

# Настройка systemd (опционально)
read -p "Настроить systemd сервис? (y/n): " setup_systemd_answer
if [[ "$setup_systemd_answer" == "y" || "$setup_systemd_answer" == "Y" ]]; then
    setup_systemd
fi

echo -e "${GREEN}"
echo "========================================"
echo "  Установка завершена успешно!"
echo "========================================"
echo -e "${NC}"
echo ""
echo -e "${CYAN}Для запуска в режиме разработки:${NC}"
echo "  npm run dev"
echo ""
echo -e "${CYAN}Для запуска в продакшене:${NC}"
echo "  npm start"
echo ""
echo -e "${CYAN}Приложение будет доступно по адресу:${NC}"
echo "  http://localhost:3000"
echo ""
