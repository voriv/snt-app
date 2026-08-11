#!/bin/sh
# ============================================
# Бэкап PostgreSQL с выгрузкой в Object Storage (S3-совместимое)
# Используется сервисом `backup` в docker-compose.db.yml (VPS-DB).
# Локально бэкап хранится только временно (по умолчанию KEEP_LOCAL_DAYS=0).
# ============================================
set -e

# --- Переменные (задаются через docker compose environment) ---
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="/backups/backup_${TIMESTAMP}.sql.gz"
S3_URL="${S3_PREFIX:-snt-prod}/backup_${TIMESTAMP}.sql.gz"

echo "=========================================="
echo "  Начат бэкап PostgreSQL"
echo "  Хост: $PGHOST, БД: $PGDATABASE, Пользователь: $PGUSER"
echo "  Время: $TIMESTAMP"
echo "=========================================="

# --- 1. Дамп базы и сжатие ---
echo "[1/3] Создание дампа -> $BACKUP_FILE"
pg_dump | gzip > "$BACKUP_FILE"
echo "Дамп создан: $(du -h "$BACKUP_FILE" | cut -f1)"

# --- 2. Проверка, что S3-переменные заданы ---
if [ -z "$S3_ENDPOINT" ] || [ -z "$S3_ACCESS_KEY" ] || [ -z "$S3_SECRET_KEY" ] || [ -z "$S3_BUCKET" ]; then
  echo "ОШИБКА: Переменные S3_* не заданы. Бэкап остаётся локально в /backups/"
  echo "S3_ENDPOINT=$S3_ENDPOINT, S3_BUCKET=$S3_BUCKET, S3_PREFIX=$S3_PREFIX"
  exit 1
fi

# --- 3. Выгрузка в Object Storage через curl (протокол S3 PUT) ---
echo "[2/3] Выгрузка в Object Storage: $S3_URL"
# Ожидаем, что S3_ENDPOINT — сигнатура v4. Для простоты используем unsigned URL,
# что корректно для endpoint, разрешающего анонимный PUT, ЛИБО задайте
# AWS-подпись через rclone/aws-cli на хосте (см. документацию).
# Для production ВАЖНО включить сигнатуру v4. Ниже — вариант с AWS CLI (если установлен):
if command -v aws >/dev/null 2>&1; then
  AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY" \
  AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY" \
  AWS_DEFAULT_REGION="${S3_REGION:-us-east-1}" \
  aws --endpoint-url "$S3_ENDPOINT" s3 cp "$BACKUP_FILE" "s3://${S3_BUCKET}/${S3_URL}"
  echo "Загружено через AWS CLI."
else
  # Fallback: curl без сигнатуры (только для тестовых/анонимных endpoint)
  curl -f -sS --fail-with-body \
    -X PUT \
    --upload-file "$BACKUP_FILE" \
    "${S3_ENDPOINT}/${S3_BUCKET}/${S3_URL}" || {
      echo "ОШИБКА: не удалось загрузить через curl. Установите AWS CLI для сигнатуры v4."
      exit 1
    }
  echo "Загружено через curl (unsigned)."
fi

echo "[3/3] Загрузка завершена: s3://${S3_BUCKET}/${S3_URL}"

# --- Ротация: удаление старых локальных копий ---
if [ "${KEEP_LOCAL_DAYS:-0}" -gt 0 ] 2>/dev/null; then
  find /backups -name "backup_*.sql.gz" -mtime +"$KEEP_LOCAL_DAYS" -delete
  echo "Локальная ротация: старше $KEEP_LOCAL_DAYS дней удалена."
else
  echo "Локальные бэкапы не хранятся (KEEP_LOCAL_DAYS=0)."
fi

# --- Ротация старых файлов в Object Storage (опционально, если задан S3_MAX_DAYS) ---
if [ -n "$S3_MAX_DAYS" ] && command -v aws >/dev/null 2>&1; then
  echo "Ротация в S3: удаление бэкапов старше $S3_MAX_DAYS дней..."
  AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY" \
  AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY" \
  AWS_DEFAULT_REGION="${S3_REGION:-us-east-1}" \
  aws --endpoint-url "$S3_ENDPOINT" \
    s3 ls "s3://${S3_BUCKET}/${S3_PREFIX:-snt-prod}/" --recursive | while read -r line; do
      FILE_DATE=$(echo "$line" | awk '{print $1}')
      FILE_KEY=$(echo "$line" | awk '{print $4}')
      if [ -n "$FILE_DATE" ] && [ -n "$FILE_KEY" ]; then
        DAYS=$(( ($(date +%s) - $(date -d "$FILE_DATE" +%s)) / 86400 ))
        if [ "$DAYS" -gt "$S3_MAX_DAYS" ]; then
          echo "Удаление старого бэкапа: $FILE_KEY ($DAYS дней)"
          AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY" \
          AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY" \
          AWS_DEFAULT_REGION="${S3_REGION:-us-east-1}" \
          aws --endpoint-url "$S3_ENDPOINT" s3 rm "s3://${S3_BUCKET}/${FILE_KEY}"
        fi
      fi
    done
fi

echo "Бэкап успешно завершён."
