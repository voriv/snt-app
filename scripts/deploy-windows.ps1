# ============================================
# Скрипт развёртывания СНТ приложения на Windows
# ============================================
# Требования:
#   - PowerShell 5.0+
#   - Запуск от имени администратора
# ============================================

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Цвета для вывода
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
}

function Write-Log {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Test-Admin {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Check-NodeJs {
    Write-Log "Проверка Node.js..." $Colors.Info
    try {
        $nodeVersion = node -v
        Write-Log "Node.js установлен: $nodeVersion" $Colors.Success
        
        # Проверка версии (минимум 20)
        $versionNumber = [int]$nodeVersion.Substring(1).Split('.')[0]
        if ($versionNumber -lt 20) {
            Write-Log "Требуется Node.js 20+ (установлен $nodeVersion)" $Colors.Error
            return $false
        }
        return $true
    } catch {
        Write-Log "Node.js не установлен" $Colors.Warning
        return $false
    }
}

function Check-Npm {
    Write-Log "Проверка npm..." $Colors.Info
    try {
        $npmVersion = npm -v
        Write-Log "npm установлен: $npmVersion" $Colors.Success
        return $true
    } catch {
        Write-Log "npm не установлен" $Colors.Error
        return $false
    }
}

function Check-PostgreSQL {
    Write-Log "Проверка PostgreSQL..." $Colors.Info
    
    # Проверка через psql
    try {
        $psqlVersion = psql --version 2>&1
        Write-Log "PostgreSQL client установлен: $psqlVersion" $Colors.Success
        
        # Проверка подключения
        if ($env:DATABASE_URL) {
            Write-Log "DATABASE_URL найден в окружении" $Colors.Success
        } else {
            Write-Log "DATABASE_URL не найден - убедитесь, что PostgreSQL запущен" $Colors.Warning
        }
        return $true
    } catch {
        Write-Log "PostgreSQL client не найден" $Colors.Warning
        return $false
    }
}

function Install-Dependencies {
    Write-Log "Установка зависимостей npm..." $Colors.Info
    npm ci
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Зависимости установлены успешно" $Colors.Success
        return $true
    } else {
        Write-Log "Ошибка установки зависимостей" $Colors.Error
        return $false
    }
}

function Setup-Environment {
    Write-Log "Настройка окружения..." $Colors.Info
    
    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Log "Создан .env из .env.example" $Colors.Success
            Write-Log "ОТРЕДАКТИРУЙТЕ .env перед запуском!" $Colors.Warning
        } else {
            Write-Log ".env.example не найден" $Colors.Error
            return $false
        }
    } else {
        Write-Log ".env уже существует" $Colors.Info
    }
    return $true
}

function Setup-Database {
    Write-Log "Настройка базы данных..." $Colors.Info
    
    # Генерация Prisma Client
    Write-Log "Генерация Prisma Client..." $Colors.Info
    npm run db:generate
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Ошибка генерации Prisma Client" $Colors.Error
        return $false
    }
    
    # Применение миграций
    Write-Log "Применение миграций БД..." $Colors.Info
    npm run db:push
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Ошибка применения миграций" $Colors.Error
        return $false
    }
    
    Write-Log "База данных настроена успешно" $Colors.Success
    return $true
}

function Build-App {
    Write-Log "Сборка приложения..." $Colors.Info
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Приложение собрано успешно" $Colors.Success
        return $true
    } else {
        Write-Log "Ошибка сборки приложения" $Colors.Error
        return $false
    }
}

function Start-App {
    Write-Log "Запуск приложения..." $Colors.Info
    Write-Log "Приложение доступно по http://localhost:3000" $Colors.Info
    npm start
}

# ============================================
# Основная логика
# ============================================

Write-Log "========================================" $Colors.Info
Write-Log "  СНТ Приложение - Установка на Windows" $Colors.Info
Write-Log "========================================" $Colors.Info

# Проверка прав администратора
if (-not (Test-Admin)) {
    Write-Log "Скрипт должен быть запущен от имени администратора!" $Colors.Error
    exit 1
}

# Проверка Node.js
if (-not (Check-NodeJs)) {
    Write-Log "Для установки Node.js посетите: https://nodejs.org/" $Colors.Warning
    exit 1
}

# Проверка npm
if (-not (Check-Npm)) {
    Write-Log "npm должен быть установлен вместе с Node.js" $Colors.Error
    exit 1
}

# Настройка окружения
if (-not (Setup-Environment)) {
    exit 1
}

# Установка зависимостей
if (-not (Install-Dependencies)) {
    exit 1
}

# Настройка базы данных
if (-not (Setup-Database)) {
    exit 1
}

# Сборка приложения
if (-not (Build-App)) {
    exit 1
}

Write-Log "========================================" $Colors.Success
Write-Log "  Установка завершена успешно!" $Colors.Success
Write-Log "========================================" $Colors.Success
Write-Log "" $Colors.White
Write-Log "Для запуска в режиме разработки:" $Colors.Info
Write-Log "  npm run dev" $Colors.White
Write-Log "" $Colors.White
Write-Log "Для запуска в продакшене:" $Colors.Info
Write-Log "  npm start" $Colors.White
Write-Log "" $Colors.White
Write-Log "Приложение будет доступно по адресу:" $Colors.Info
Write-Log "  http://localhost:3000" $Colors.White
Write-Log "" $Colors.White

# Запуск приложения (раскомментируйте для автоматического запуска)
# Start-App
