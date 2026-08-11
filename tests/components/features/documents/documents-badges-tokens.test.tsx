/**
 * @component badges-tokens (documents)
 * @category features/documents
 * @description Component-тесты для миграции badge-токенов (B-021-T1a, R-27)
 *
 * @covers AC-R27-1: DocumentCard статусы используют var(--theme-badge-{default,success,warning}-{bg,color})
 * @covers AC-R27-6: DeleteCategoryDialog использует var(--theme-badge-danger-bg)
 * @covers AC-NEG-04: в мигрированных файлах нет bg-gray-100/bg-green-100/bg-yellow-100/bg-red-100 (для бейджей/иконок)
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocumentCard } from '@/components/features/documents/DocumentCard';
import { DeleteCategoryDialog } from '@/components/features/documents/DeleteCategoryDialog';
import type { DocumentWithDetails } from '@/domains/documents';

// DocumentCard без onClick рендерит next/link — мокаем, чтобы избежать реальной навигации
vi.mock('next/link', () => ({
  default: ({ children, href, 'aria-label': ariaLabel }: any) => (
    <a href={href} aria-label={ariaLabel}>{children}</a>
  ),
}));

function makeDocument(status: 'draft' | 'published' | 'archived'): DocumentWithDetails {
  return {
    id: 'doc-1',
    title: 'Тестовый документ',
    description: null,
    originalName: 'file.pdf',
    storagePath: '/uploads/file.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    categoryId: null,
    documentType: 'Договор',
    visibleRoles: ['ADMIN'],
    status,
    uploadedById: 'u1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    category: null,
    tags: [],
    uploader: { id: 'u1', name: 'Иван', email: 'i@x.ru' },
  } as DocumentWithDetails;
}

describe('B-021-T1a (R-27) — DocumentCard badge-токены', () => {
  // AC-R27-1a: "Черновик" (draft) использует default-токены
  it('AC-R27-1: status=draft использует var(--theme-badge-default-{bg,color})', () => {
    render(<DocumentCard document={makeDocument('draft')} />);
    const badge = screen.getByText('Черновик');
    expect(badge.className).toContain('bg-[var(--theme-badge-default-bg)]');
    expect(badge.className).toContain('text-[var(--theme-badge-default-color)]');
    // Негатив (AC-NEG-04): без сырых классов
    expect(badge.className).not.toMatch(/bg-gray-100|bg-green-100|bg-yellow-100/);
  });

  // AC-R27-1b: "Опубликован" (published) использует success-токены
  it('AC-R27-1: status=published использует var(--theme-badge-success-{bg,color})', () => {
    render(<DocumentCard document={makeDocument('published')} />);
    const badge = screen.getByText('Опубликован');
    expect(badge.className).toContain('bg-[var(--theme-badge-success-bg)]');
    expect(badge.className).toContain('text-[var(--theme-badge-success-color)]');
    expect(badge.className).not.toMatch(/bg-gray-100|bg-green-100|bg-yellow-100/);
  });

  // AC-R27-1c: "Архив" (archived) использует warning-токены
  it('AC-R27-1: status=archived использует var(--theme-badge-warning-{bg,color})', () => {
    render(<DocumentCard document={makeDocument('archived')} />);
    const badge = screen.getByText('Архив');
    expect(badge.className).toContain('bg-[var(--theme-badge-warning-bg)]');
    expect(badge.className).toContain('text-[var(--theme-badge-warning-color)]');
    expect(badge.className).not.toMatch(/bg-gray-100|bg-green-100|bg-yellow-100/);
  });
});

describe('B-021-T1a (R-27) — DeleteCategoryDialog опасная иконка', () => {
  // AC-R27-6: иконка предупреждения использует var(--theme-badge-danger-bg) вместо bg-red-100
  it('AC-R27-6: иконка предупреждения использует var(--theme-badge-danger-bg)', () => {
    render(
      <DeleteCategoryDialog
        isOpen
        categoryName="Категория"
        hasDocuments={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    // Иконка-обёртка — первый div с rounded-full
    const container = screen.getByRole('dialog');
    const iconWrap = container.querySelector('div.rounded-full');
    expect(iconWrap).not.toBeNull();
    expect(iconWrap!.className).toContain('bg-[var(--theme-badge-danger-bg)]');
    expect(iconWrap!.className).not.toContain('bg-red-100');
  });
});
