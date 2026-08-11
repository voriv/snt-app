#!/usr/bin/env bash
# ============================================
# 03 — Открытие портов 80/443 в ufw (при наличии)
# ============================================
# Напоминание: в панели Ruvds (Security group / Firewall)
# тоже нужно открыть 80 и 443 для входящих TCP.
#
# Запуск: sudo deploy/test/03-open-ports.sh
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

require_root_or_sudo "$0"

if ! command -v ufw >/dev/null 2>&1; then
    warn "ufw не установлен — пропуск. Убедитесь, что порты 80/443 открыты в панели Ruvds."
    exit 0
fi

info "Открытие портов 22, 80, 443 в ufw..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status verbose

ok "Порты открыты в ufw."
warn "Не забудьте также открыть 80/443 в защитном экране (firewall) в панели Ruvds!"