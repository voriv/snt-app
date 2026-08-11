# Настройка развёртывания через SSH

## 📋 Обзор

Этот документ описывает, как настроить автоматическое развёртывание приложения СНТ через SSH из GitHub Actions.

## 🔧 Требования

- GitHub репозиторий
- Ubuntu сервер с доступом по SSH
- Node.js 24+ на сервере
- PostgreSQL на сервере

## 🚀 Пошаговая настройка

### Шаг 1: Подготовка сервера

#### 1.1 Установка Node.js

```bash
# Установка NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Установка Node.js 24
nvm install 24
nvm use 24
nvm alias default 24
```

#### 1.2 Установка PostgreSQL

```bash
# Добавление репозитория
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -

# Установка
apt-get update
apt-get install -y postgresql-15 postgresql-client-15

# Создание пользователя и БД
sudo -u postgres psql -c "CREATE USER snt_user WITH PASSWORD 'snt_password';"
sudo -u postgres psql -c "CREATE DATABASE snt_db OWNER snt_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE snt_db TO snt_user;"
```

#### 1.3 Подготовка директории

```bash
# Создание директории
sudo mkdir -p /var/www/snt-app
sudo chown $USER:$USER /var/www/snt-app

# Клонирование репозитория
cd /var/www/snt-app
git clone <your-repo-url> .
```

### Шаг 2: Настройка SSH ключа

#### 2.1 Генерация ключа

```bash
# На локальной машине
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/snt_deploy
```

#### 2.2 Добавление публичного ключа на сервер

```bash
# Скопировать публичный ключ на сервер
ssh-copy-id -i ~/.ssh/snt_deploy.pub user@your-server-ip

# Или вручную:
cat ~/.ssh/snt_deploy.pub
# Скопируйте вывод и добавьте на сервер:
ssh user@your-server-ip
mkdir -p ~/.ssh
echo "публичный_ключ" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Шаг 3: Настройка GitHub Secrets

В настройках репозитория (**Settings → Secrets and variables → Actions**):

| Secret | Описание | Пример |
|--------|----------|--------|
| `SSH_HOST` | IP адрес сервера | `192.168.1.100` |
| `SSH_USER` | Имя пользователя | `deploy` |
| `SSH_PRIVATE_KEY` | Приватный SSH ключ | Содержимое файла `snt_deploy` |
| `SSH_PORT` | Порт SSH (опционально) | `22` |

```bash
# Содержимое SSH_PRIVATE_KEY:
cat ~/.ssh/snt_deploy
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

### Шаг 4: Настройка systemd сервиса

Создайте файл `/etc/systemd/system/snt-app.service`:

```ini
[Unit]
Description=SNT Application
After=network.target postgresql.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/var/www/snt-app
ExecStart=/home/deploy/.nvm/versions/node/v24.0.0/bin/node /var/www/snt-app/node_modules/.bin/next start -p 3000
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/var/www/snt-app/.env

[Install]
WantedBy=multi-user.target
```

Включите сервис:

```bash
sudo systemctl daemon-reload
sudo systemctl enable snt-app
sudo systemctl start snt-app
```

### Шаг 5: Настройка переменных окружения

Создайте файл `.env` на сервере:

```bash
cd /var/www/snt-app
cp .env.example .env
nano .env
```

Отредактируйте значения:

```bash
# База данных
DATABASE_URL="postgresql://snt_user:snt_password@localhost:5432/snt_db?schema=public"

# Next.js
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key-here"

# WebSocket сервер
WS_PORT=3001
WS_INTERNAL_SECRET="your-internal-secret-here"

# Название и описание приложения
NEXT_PUBLIC_APP_NAME="СНТ Берёнки-НТ"
NEXT_PUBLIC_APP_DESCRIPTION="Управление садоводческим товариществом"

# Файлы
MAX_FILE_SIZE=10485760
```

### Шаг 6: Тестирование

#### 6.1 Ручной запуск

В GitHub Actions → Actions → Deploy via SSH → Run workflow

#### 6.2 Проверка

```bash
# На сервере
sudo systemctl status snt-app
curl http://localhost:3000
```

## 🔒 Безопасность

### Рекомендации

1. **Ограничьте доступ по IP** в файрволе:
   ```bash
   sudo ufw allow from 192.168.1.100 to any port 22
   ```

2. **Используйте ключевую аутентификацию**, отключите пароль:
   ```bash
   # В /etc/ssh/sshd_config
   PasswordAuthentication no
   PubkeyAuthentication yes
   ```

3. **Меняйте порты SSH** (опционально):
   ```bash
   # В /etc/ssh/sshd_config
   Port 2222
   ```

4. **Настройте Fail2Ban**:
   ```bash
   sudo apt-get install fail2ban
   sudo systemctl enable fail2ban
   ```

## 📊 Процесс развёртывания

```mermaid
sequenceDiagram
    participant D as Developer
    participant G as GitHub
    participant A as Actions
    participant S as Server
    
    D->>G: git push
    G->>A: Trigger Workflow
    A->>A: Run Tests
    alt Tests Failed
        A->>G: Fail Notification
    else Tests Passed
        A->>S: SSH Connect
        S-->>A: OK
        A->>S: git pull
        A->>S: npm ci
        A->>S: npm run db:push
        A->>S: npm run build
        A->>S: systemctl restart
        S-->>A: Done
        A->>G: Success
    end
```

## 🆘 Устранение неполадок

### Ошибка подключения по SSH

```bash
# Проверьте доступность сервера
ssh -i ~/.ssh/snt_deploy deploy@your-server-ip

# Проверьте права на ключ
chmod 600 ~/.ssh/snt_deploy
```

### Ошибка при запуске сервиса

```bash
# Посмотрите логи
sudo journalctl -u snt-app -f

# Проверьте порты
sudo lsof -i :3000
```

### Ошибка с базой данных

```bash
# Проверьте подключение
psql -U snt_user -d snt_db

# Проверьте статус PostgreSQL
sudo systemctl status postgresql
```

## 📝 Ссылки

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [appleboy/ssh-action](https://github.com/appleboy/ssh-action)
- [Docker Documentation](https://docs.docker.com/)
