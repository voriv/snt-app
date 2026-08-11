#!/usr/bin/env node

/**
 * CLI-утилита для работы с глобальным беклогом
 *
 * Использование:
 *   node scripts/backlog.js list                    — список всех задач
 *   node scripts/backlog.js list --status todo      — фильтр по статусу
 *   node scripts/backlog.js list --epic COMMS       — фильтр по эпику
 *   node scripts/backlog.js list --format json      — вывод в JSON
 *   node scripts/backlog.js next                    — следующая задача по приоритету
 *   node scripts/backlog.js next --format json      — следующая задача в JSON
 *   node scripts/backlog.js update B-009 --status in_progress — обновить статус
 *   node scripts/backlog.js update B-009 --phase code         — обновить фазу
 *   node scripts/backlog.js add --title "..." --priority high  — добавить задачу
 *   node scripts/backlog.js done B-009              — отметить как завершённую
 *   node scripts/backlog.js report                  — Markdown-отчёт
 *   node scripts/backlog.js validate                — проверить целостность беклога
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// =============================================================================
// КОНФИГУРАЦИЯ
// =============================================================================

const BACKLOG_DIR = path.join(__dirname, '..', 'docs', 'backlog');
const BACKLOG_FILE = path.join(BACKLOG_DIR, 'backlog.yaml');
const TAGS_FILE = path.join(BACKLOG_DIR, 'tags.yaml');
const PIPELINE_STATE_FILE = path.join(BACKLOG_DIR, 'pipeline-state.md');
const LOCK_FILE = path.join(BACKLOG_DIR, '.backlog.lock');

const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low', 'backlog'];
const PHASE_ORDER = ['idea', 'req', 'us', 'model', 'plan', 'design', 'spec', 'code', 'test', 'doc', 'done'];
const VALID_STATUSES = ['todo', 'in_progress', 'review', 'done', 'blocked', 'cancelled'];

// =============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =============================================================================

function log(message) {
  console.log(message);
}

function error(message) {
  console.error('❌ Ошибка:', message);
  process.exit(1);
}

function warn(message) {
  console.warn('⚠️  Предупреждение:', message);
}

function success(message) {
  console.log('✅', message);
}

/**
 * Чтение и парсинг backlog.yaml через js-yaml
 */
function readBacklog() {
  if (!fs.existsSync(BACKLOG_FILE)) {
    error(`Файл беклога не найден: ${BACKLOG_FILE}`);
  }

  const doc = yaml.load(fs.readFileSync(BACKLOG_FILE, 'utf-8'));

  if (!doc || !doc.tasks || !Array.isArray(doc.tasks)) {
    error('Неверный формат backlog.yaml: отсутствует поле tasks');
  }

  return doc.tasks;
}

/**
 * Запись backlog.yaml через js-yaml
 */
function writeBacklog(tasks) {
  const doc = { tasks };
  const yamlStr = yaml.dump(doc, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    quotingType: '"',
    forceQuotes: true,
    styles: {
      '!!null': 'canonical'
    }
  });

  const header = `# Глобальный беклог задач проекта СНТ "Берёзки-НТ"
# Версия: 1.0
# Дата: ${new Date().toISOString().split('T')[0]}
# Автообновление: scripts/backlog.js

`;

  fs.writeFileSync(BACKLOG_FILE, header + yamlStr, 'utf-8');
}

/**
 * Попытка захватить блокировку
 */
function acquireLock() {
  if (fs.existsSync(LOCK_FILE)) {
    const lockTime = parseInt(fs.readFileSync(LOCK_FILE, 'utf-8').trim(), 10);
    if (Date.now() - lockTime < 30000) {
      // Блокировка активна (младше 30 секунд)
      return false;
    }
    // Блокировка устарела — удаляем
    fs.unlinkSync(LOCK_FILE);
  }
  fs.writeFileSync(LOCK_FILE, String(Date.now()), 'utf-8');
  return true;
}

/**
 * Освободить блокировку
 */
function releaseLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
  } catch (e) {
    // Игнорируем ошибки при освобождении блокировки
  }
}

// =============================================================================
// КОМАНДЫ
// =============================================================================

/**
 * Команда: list — список задач
 */
function cmdList(args) {
  const tasks = readBacklog();
  const statusFilter = args['--status'] || null;
  const priorityFilter = args['--priority'] || null;
  const epicFilter = args['--epic'] || null;
  const phaseFilter = args['--phase'] || null;
  const format = args['--format'] || 'table';

  let filtered = tasks;

  if (statusFilter) {
    filtered = filtered.filter(t => t.status === statusFilter);
  }
  if (priorityFilter) {
    filtered = filtered.filter(t => t.priority === priorityFilter);
  }
  if (epicFilter) {
    filtered = filtered.filter(t => t.epic === epicFilter);
  }
  if (phaseFilter) {
    filtered = filtered.filter(t => t.phase === phaseFilter);
  }

  // Сортировка по приоритету (critical → ... → backlog)
  filtered.sort((a, b) => {
    const pa = PRIORITY_ORDER.indexOf(a.priority);
    const pb = PRIORITY_ORDER.indexOf(b.priority);
    return pa - pb;
  });

  if (format === 'json') {
    console.log(JSON.stringify(filtered, null, 2));
    return;
  }

  // Табличный вывод
  if (filtered.length === 0) {
    log('Нет задач, соответствующих фильтру.');
    return;
  }

  log('┌───────┬──────────────────────────────────────┬──────────┬──────────────┬────────┐');
  log('│ ID    │ Название                             │ Приоритет │ Статус       │ Фаза   │');
  log('├───────┼──────────────────────────────────────┼──────────┼──────────────┼────────┤');

  for (const task of filtered) {
    const id = task.id.padEnd(7).slice(0, 7);
    const title = (task.title.length > 36 ? task.title.slice(0, 33) + '...' : task.title).padEnd(36);
    const priority = PRIORITY_COLORS[task.priority] || '●     ';
    const status = STATUS_ICONS[task.status] || '○';
    const statusStr = `${status} ${task.status.padEnd(10)}`.slice(0, 12);
    const phase = task.phase.padEnd(6).slice(0, 6);

    log(`│ ${id} │ ${title} │ ${priority} │ ${statusStr}│ ${phase}│`);
  }

  log('└───────┴──────────────────────────────────────┴──────────┴──────────────┴────────┘');
  log(`Всего: ${filtered.length} задач(и)`);
}

const PRIORITY_COLORS = {
  critical: '🔴 crit',
  high: '🟠 high',
  medium: '🟡 med ',
  low: '🟢 low ',
  backlog: '⚪ bckl',
};

const STATUS_ICONS = {
  todo: '⏳',
  in_progress: '🔄',
  review: '👁️',
  done: '✅',
  blocked: '🚫',
  cancelled: '❌',
};

/**
 * Команда: next — следующая задача по приоритету
 */
function cmdNext(args) {
  const tasks = readBacklog();
  const format = args['--format'] || 'text';

  // Ищем самую приоритетную todo-задачу, не заблокированную зависимостями
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const doneIds = new Set(tasks.filter(t => t.status === 'done').map(t => t.id));

  const available = todoTasks
    .filter(t => !t.depends || t.depends.every(d => doneIds.has(d)))
    .sort((a, b) => {
      const pa = PRIORITY_ORDER.indexOf(a.priority);
      const pb = PRIORITY_ORDER.indexOf(b.priority);
      if (pa !== pb) return pa - pb;
      return (a.created || '').localeCompare(b.created || '');
    });

  if (available.length === 0) {
    if (format === 'json') {
      console.log(JSON.stringify(null));
    } else {
      log('📭 Нет доступных задач. Беклог пуст или все задачи заблокированы.');
    }
    return;
  }

  const next = available[0];

  // Проверяем блокировки зависимостей
  const blockedBy = (next.depends || []).filter(d => !doneIds.has(d));

  if (blockedBy.length > 0) {
    if (format === 'json') {
      console.log(JSON.stringify({ ...next, blockedBy }));
    } else {
      log(`🚫 Задача ${next.id} («${next.title}») заблокирована: ждёт ${blockedBy.join(', ')}`);
    }
    return;
  }

  if (format === 'json') {
    console.log(JSON.stringify(next, null, 2));
  } else {
    log(`📋 Следующая задача:`);
    log(`   ID:         ${next.id}`);
    log(`   Название:   ${next.title}`);
    log(`   Приоритет:  ${next.priority}`);
    log(`   Эпик:       ${next.epic}`);
    log(`   Фаза:       ${next.phase}`);
    log(`   Описание:   ${next.description || '—'}`);
    if (next.artifacts?.requirements?.length > 0) {
      log(`   REQ:        ${next.artifacts.requirements.join(', ')}`);
    }
    if (next.artifacts?.user_stories?.length > 0) {
      log(`   US:         ${next.artifacts.user_stories.join(', ')}`);
    }
    log('');
    log(`   Выполните: backlog update ${next.id} --status in_progress`);
  }
}

/**
 * Команда: update — обновить поля задачи
 */
function cmdUpdate(args) {
  const taskId = args._[1];
  if (!taskId) {
    error('Укажите ID задачи: backlog update B-NNN --status ...');
  }

  const tasks = readBacklog();
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    error(`Задача ${taskId} не найдена в беклоге`);
  }

  const task = tasks[taskIndex];
  let changed = false;

  if (args['--status']) {
    const newStatus = args['--status'];
    if (!VALID_STATUSES.includes(newStatus)) {
      error(`Неверный статус "${newStatus}". Допустимые: ${VALID_STATUSES.join(', ')}`);
    }
    task.status = newStatus;
    task.updated = new Date().toISOString().split('T')[0];
    if (newStatus === 'done') {
      task.completed = task.completed || new Date().toISOString().split('T')[0];
      task.phase = 'done';
    }
    changed = true;
  }

  if (args['--phase']) {
    const newPhase = args['--phase'];
    if (!PHASE_ORDER.includes(newPhase)) {
      error(`Неверная фаза "${newPhase}". Допустимые: ${PHASE_ORDER.join(', ')}`);
    }
    task.phase = newPhase;
    task.updated = new Date().toISOString().split('T')[0];
    changed = true;
  }

  if (args['--priority']) {
    const newPriority = args['--priority'];
    if (!PRIORITY_ORDER.includes(newPriority)) {
      error(`Неверный приоритет "${newPriority}". Допустимые: ${PRIORITY_ORDER.join(', ')}`);
    }
    task.priority = newPriority;
    task.updated = new Date().toISOString().split('T')[0];
    changed = true;
  }

  if (args['--blocker']) {
    task.status = 'blocked';
    task.blocker_reason = args['--blocker'];
    task.updated = new Date().toISOString().split('T')[0];
    changed = true;
  }

  if (!changed) {
    warn('Ничего не изменено. Укажите --status, --phase, --priority или --blocker');
    return;
  }

  writeBacklog(tasks);
  success(`Задача ${taskId} обновлена: ${describeChanges(args)}`);
}

function describeChanges(args) {
  const parts = [];
  if (args['--status']) parts.push(`status → ${args['--status']}`);
  if (args['--phase']) parts.push(`phase → ${args['--phase']}`);
  if (args['--priority']) parts.push(`priority → ${args['--priority']}`);
  if (args['--blocker']) parts.push('blocked');
  return parts.join(', ') || '—';
}

/**
 * Команда: done — быстро отметить как завершённую
 */
function cmdDone(args) {
  const taskId = args._[1];
  if (!taskId) {
    error('Укажите ID задачи: backlog done B-NNN');
  }

  args['--status'] = 'done';
  args['--phase'] = 'done';
  cmdUpdate(args);
}

/**
 * Команда: archive — архивировать завершённую задачу
 *
 * Переносит задачу из backlog.yaml в docs/backlog/archive/B-NNN.yaml
 * и очищает pipeline-state.md для нового старта.
 */
function cmdArchive(args) {
  const taskId = args._[1];
  if (!taskId) {
    error('Укажите ID задачи: backlog archive B-NNN');
  }

  const tasks = readBacklog();
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    error(`Задача ${taskId} не найдена в беклоге`);
  }

  // Извлекаем задачу из массива
  const [task] = tasks.splice(taskIndex, 1);

  // Убеждаемся, что задача завершена
  task.status = 'done';
  task.phase = 'done';
  task.completed = task.completed || new Date().toISOString().split('T')[0];
  task.updated = new Date().toISOString().split('T')[0];

  // Создаём директорию архива, если нет
  const archiveDir = path.join(BACKLOG_DIR, 'archive');
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  // Записываем задачу в архив
  const archivePath = path.join(archiveDir, `${taskId}.yaml`);
  const archiveYaml = yaml.dump(task, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    quotingType: '"',
    forceQuotes: true,
  });
  fs.writeFileSync(archivePath, archiveYaml, 'utf-8');

  // Перезаписываем backlog.yaml без архивированной задачи
  writeBacklog(tasks);

  // Очищаем pipeline-state.md для нового старта
  fs.writeFileSync(
    PIPELINE_STATE_FILE,
    '# Состояние пайплайна\n\nНет активной задачи. Ожидание...\n',
    'utf-8'
  );

  success(`Задача ${taskId} архивирована → ${path.relative(process.cwd(), archivePath)}`);
  log(`   pipeline-state.md очищен.`);
}

/**
 * Команда: add — добавить новую задачу
 */
function cmdAdd(args) {
  if (!args['--title']) {
    error('Укажите --title');
  }

  const tasks = readBacklog();

  // Генерируем следующий ID
  const maxNum = tasks.reduce((max, t) => {
    const num = parseInt(t.id.replace('B-', ''), 10);
    return num > max ? num : max;
  }, 0);
  const newId = `B-${String(maxNum + 1).padStart(3, '0')}`;

  const newTask = {
    id: newId,
    title: args['--title'],
    description: args['--description'] || '',
    priority: args['--priority'] || 'medium',
    status: args['--status'] || 'todo',
    phase: args['--phase'] || 'idea',
    epic: args['--epic'] || 'INFRA',
    labels: args['--labels'] ? args['--labels'].split(',').map(l => l.trim()) : [],
    depends: args['--depends'] ? args['--depends'].split(',').map(d => d.trim()) : [],
    artifacts: {
      requirements: [],
      user_stories: [],
      model: [],
    },
    created: new Date().toISOString().split('T')[0],
    updated: new Date().toISOString().split('T')[0],
  };

  if (args['--req']) {
    newTask.artifacts.requirements = args['--req'].split(',').map(r => r.trim());
  }
  if (args['--us']) {
    newTask.artifacts.user_stories = args['--us'].split(',').map(u => u.trim());
  }

  tasks.push(newTask);
  writeBacklog(tasks);
  success(`Задача ${newId} добавлена: «${args['--title']}»`);
}

/**
 * Команда: report — Markdown-отчёт
 */
function cmdReport() {
  const tasks = readBacklog();

  let report = `# Отчёт по беклогу\n\n`;
  report += `> Сгенерировано: ${new Date().toISOString().split('T')[0]}\n\n`;

  // Статистика
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const todo = tasks.filter(t => t.status === 'todo').length;
  const blocked = tasks.filter(t => t.status === 'blocked').length;

  report += `## 📊 Статистика\n\n`;
  report += `| Метрика | Значение |\n|---------|----------|\n`;
  report += `| Всего задач | ${total} |\n`;
  report += `| ✅ Завершено | ${done} (${total > 0 ? Math.round(done/total*100) : 0}%) |\n`;
  report += `| 🔄 В работе | ${inProgress} |\n`;
  report += `| ⏳ Ожидают | ${todo} |\n`;
  report += `| 🚫 Заблокировано | ${blocked} |\n\n`;

  // Прогресс по фазам
  report += `## 🔄 Прогресс по фазам\n\n`;
  report += `| Фаза | Задач |\n|------|------|\n`;
  for (const phase of PHASE_ORDER) {
    const count = tasks.filter(t => t.phase === phase).length;
    if (count > 0) {
      report += `| ${phase} | ${count} |\n`;
    }
  }
  report += '\n';

  // Задачи в работе
  const active = tasks.filter(t => t.status === 'in_progress');
  if (active.length > 0) {
    report += `## 🔄 Текущие задачи\n\n`;
    report += `| ID | Название | Фаза |\n|----|----------|------|\n`;
    for (const task of active) {
      report += `| ${task.id} | ${task.title} | ${task.phase} |\n`;
    }
    report += '\n';
  }

  // Следующие задачи
  const nextTasks = tasks.filter(t => t.status === 'todo').sort((a, b) => {
    return PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
  });
  if (nextTasks.length > 0) {
    report += `## ⏳ Очередь\n\n`;
    report += `| ID | Название | Приоритет | Эпик |\n|----|----------|-----------|------|\n`;
    for (const task of nextTasks.slice(0, 10)) {
      report += `| ${task.id} | ${task.title} | ${task.priority} | ${task.epic} |\n`;
    }
    if (nextTasks.length > 10) {
      report += `| ... | ещё ${nextTasks.length - 10} задач | | |\n`;
    }
    report += '\n';
  }

  // Заблокированные
  const blockedTasks = tasks.filter(t => t.status === 'blocked');
  if (blockedTasks.length > 0) {
    report += `## 🚫 Заблокированные задачи\n\n`;
    report += `| ID | Название | Причина |\n|----|----------|--------|\n`;
    for (const task of blockedTasks) {
      report += `| ${task.id} | ${task.title} | ${task.blocker_reason || '—'} |\n`;
    }
    report += '\n';
  }

  console.log(report);
}

/**
 * Команда: validate — проверить целостность беклога
 */
function cmdValidate() {
  const tasks = readBacklog();
  const errors = [];
  const warnings = [];

  const allIds = new Set(tasks.map(t => t.id));

  for (const task of tasks) {
    // Проверка обязательных полей
    if (!task.id) errors.push('Задача без id');
    if (!task.title) errors.push(`${task.id}: отсутствует title`);
    if (!task.priority) errors.push(`${task.id}: отсутствует priority`);
    if (!task.status) errors.push(`${task.id}: отсутствует status`);
    if (!task.epic) errors.push(`${task.id}: отсутствует epic`);

    // Проверка статуса
    if (task.status && !VALID_STATUSES.includes(task.status)) {
      errors.push(`${task.id}: неверный статус "${task.status}"`);
    }

    // Проверка приоритета
    if (task.priority && !PRIORITY_ORDER.includes(task.priority)) {
      errors.push(`${task.id}: неверный приоритет "${task.priority}"`);
    }

    // Проверка зависимостей
    if (task.depends) {
      for (const dep of task.depends) {
        if (!allIds.has(dep)) {
          errors.push(`${task.id}: зависимость ${dep} не найдена`);
        }
      }
    }

    // Проверка дубликатов ID
    const count = tasks.filter(t => t.id === task.id).length;
    if (count > 1 && !warnings.includes(`Дубликат ID: ${task.id}`)) {
      errors.push(`Дубликат ID: ${task.id}`);
    }

    // Предупреждение: задача done, но не все зависимости завершены
    if (task.status === 'done' && task.depends) {
      for (const dep of task.depends) {
        const depTask = tasks.find(t => t.id === dep);
        if (depTask && depTask.status !== 'done') {
          warnings.push(`${task.id}: помечена как done, но зависимость ${dep} (${depTask.status}) не завершена`);
        }
      }
    }

    // Предупреждение: задача in_progress без assigned
    if (task.status === 'in_progress' && !task.assigned) {
      warnings.push(`${task.id}: in_progress, но никто не назначен`);
    }
  }

  if (errors.length > 0) {
    log(`❌ Найдено ${errors.length} ошибок(и):`);
    for (const err of errors) {
      log(`   • ${err}`);
    }
  }

  if (warnings.length > 0) {
    log(`\n⚠️  Найдено ${warnings.length} предупреждений:`);
    for (const w of warnings) {
      log(`   • ${w}`);
    }
  }

  if (errors.length === 0 && warnings.length === 0) {
    success(`Беклог валиден. ${tasks.length} задач(и) проверено.`);
  } else if (errors.length === 0) {
    warn(`Беклог валиден, но есть предупреждения (${warnings.length}).`);
  } else {
    error(`Беклог содержит ошибки (${errors.length}).`);
  }
}

/**
 * Команда: help
 */
function cmdHelp() {
  log(`
📋 backlog.js — CLI-утилита для работы с глобальным беклогом

Использование:
  node scripts/backlog.js <команда> [параметры]

Команды:
  list      Список задач
            --status FILTER      Фильтр по статусу (todo|in_progress|done|blocked)
            --priority FILTER    Фильтр по приоритету (critical|high|medium|low|backlog)
            --epic FILTER        Фильтр по эпику (AUTH, PLOTS, COMMS, ...)
            --phase FILTER       Фильтр по фазе
            --format json        Вывод в JSON

  next      Следующая задача по приоритету
            --format json        Вывод в JSON

  update    Обновить задачу
            node backlog.js update B-NNN --status in_progress
            node backlog.js update B-NNN --phase code
            node backlog.js update B-NNN --priority high
            node backlog.js update B-NNN --blocker "Причина блокировки"

  done      Отметить как завершённую
            node backlog.js done B-NNN

  archive   Архивировать завершённую задачу
            node backlog.js archive B-NNN
            Переносит задачу в docs/backlog/archive/ и очищает pipeline-state.md

  add       Добавить задачу
            --title "Название"
            --description "Описание"
            --priority high|medium|low|backlog
            --epic EPIC_CODE
            --status todo|in_progress
            --phase idea|req|us|...
            --labels "api,ui,db"
            --depends "B-001,B-002"
            --req "REQ-XXX-001"
            --us "US-NN"

  report    Сгенерировать Markdown-отчёт

  validate  Проверить целостность беклога

Примеры:
  node scripts/backlog.js list
  node scripts/backlog.js list --status todo --priority high
  node scripts/backlog.js next
  node scripts/backlog.js update B-010 --status in_progress --phase code
  node scripts/backlog.js done B-010
  node scripts/backlog.js add --title "Чат-бот" --priority low --epic COMMS
  `);
}

// =============================================================================
// ГЛАВНАЯ ФУНКЦИЯ
// =============================================================================

function main() {
  const args = {};
  args._ = [];

  // Парсинг аргументов
  const rawArgs = process.argv.slice(2);
  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg.startsWith('--')) {
      const eqIndex = arg.indexOf('=');
      if (eqIndex !== -1) {
        args[arg.slice(0, eqIndex)] = arg.slice(eqIndex + 1);
      } else if (i + 1 < rawArgs.length && !rawArgs[i + 1].startsWith('--')) {
        args[arg] = rawArgs[++i];
      } else {
        args[arg] = true;
      }
    } else {
      args._.push(arg);
    }
  }

  const command = args._[0] || 'help';

  // Попытка захватить блокировку для мутирующих команд
  const mutatingCommands = ['update', 'done', 'add', 'archive'];
  if (mutatingCommands.includes(command)) {
    if (!acquireLock()) {
      warn('Беклог заблокирован другим процессом. Повторите попытку позже.');
      process.exit(1);
    }
  }

  try {
    switch (command) {
      case 'list':
        cmdList(args);
        break;
      case 'next':
        cmdNext(args);
        break;
      case 'update':
        cmdUpdate(args);
        break;
      case 'done':
        cmdDone(args);
        break;
      case 'add':
        cmdAdd(args);
        break;
      case 'archive':
        cmdArchive(args);
        break;
      case 'report':
        cmdReport();
        break;
      case 'validate':
        cmdValidate();
        break;
      case 'help':
      default:
        cmdHelp();
        break;
    }
  } finally {
    releaseLock();
  }
}

main();
