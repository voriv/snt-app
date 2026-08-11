/**
 * @component ReadReceiptIcon
 * @category features/comms
 * @description Component-тесты для ReadReceiptIcon (B-026, US-39-02)
 *
 * @covers AC-1 (US-39-02): Одна галочка при isRead=false для DIRECT
 * @covers AC-2 (US-39-02): Две галочки при isRead=true для DIRECT
 * @covers AC-3 (US-39-02): «Прочитано: N из M» для GROUP
 * @covers AC-6 (US-39-02): «Прочитано: 0 из M» для GROUP
 * @covers AC-7 (US-39-02): aria-label для скринридеров
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReadReceiptIcon } from '@/components/features/comms/ReadReceiptIcon';

describe('ReadReceiptIcon (US-39-02)', () => {
  // AC-1: одна галочка — доставлено
  describe('S-1: DIRECT, !isRead (доставлено)', () => {
    it('должен отображать одну галочку с aria-label="Доставлено"', () => {
      render(<ReadReceiptIcon isRead={false} conversationType="DIRECT" />);
      const el = screen.getByRole('img', { name: 'Доставлено' });
      expect(el).toBeInTheDocument();
      const checks = el.querySelectorAll('svg');
      expect(checks).toHaveLength(1);
    });
  });

  // AC-2: две галочки — прочитано
  describe('S-2: DIRECT, isRead (прочитано)', () => {
    it('должен отображать две галочки с aria-label="Прочитано"', () => {
      render(<ReadReceiptIcon isRead conversationType="DIRECT" />);
      const el = screen.getByRole('img', { name: 'Прочитано' });
      expect(el).toBeInTheDocument();
      const checks = el.querySelectorAll('svg');
      expect(checks).toHaveLength(2);
    });
  });

  // AC-3: счётчик прочитавших в GROUP
  describe('S-3: GROUP — «Прочитано: N из M»', () => {
    it('должен отображать «Прочитано: 3 из 4» (AC-3)', () => {
      render(
        <ReadReceiptIcon
          conversationType="GROUP"
          readByCount={3}
          totalParticipants={4}
        />
      );
      expect(screen.getByText('Прочитано: 3 из 4')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Прочитано: 3 из 4' })).toBeInTheDocument();
    });

    // AC-6: нулевой счётчик прочитавших
    it('должен отображать «Прочитано: 0 из 4» (AC-6)', () => {
      render(
        <ReadReceiptIcon
          conversationType="GROUP"
          readByCount={0}
          totalParticipants={4}
        />
      );
      expect(screen.getByText('Прочитано: 0 из 4')).toBeInTheDocument();
    });
  });

  // AC-7: aria-label для скринридеров
  describe('AC-7: Доступность', () => {
    it('должен иметь роль img и текстовый aria-label', () => {
      render(<ReadReceiptIcon isRead conversationType="DIRECT" />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('должен использовать inline SVG (aria-hidden на svg)', () => {
      render(<ReadReceiptIcon isRead conversationType="DIRECT" />);
      const el = screen.getByRole('img', { name: 'Прочитано' });
      const svg = el.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
