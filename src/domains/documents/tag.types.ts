/**
 * @type DocumentTag
 * @domain documents
 * @description Полная сущность тега документа
 *
 * @spec
 * - name уникален глобально (@unique)
 * - Теги создаются автоматически (upsert) при назначении на документ
 *
 * @traces US-22-04 AC-4, US-22-07 AC-3, AC-4
 * @task DOCS-T2.1.3
 */
export interface DocumentTag {
  id: string;
  name: string;
  createdAt: Date;
}

/**
 * @type TagWithName
 * @domain documents
 * @description Упрощённый тег для отображения в UI-списках
 *
 * @traces US-22-04, US-22-07
 * @task DOCS-T2.1.3
 */
export interface TagWithName {
  id: string;
  name: string;
}
