/**
 * @component Input
 * @category ui
 * @description Component-тесты для расширения Input с поддержкой as="textarea" (B-019-T0, R-13)
 *
 * @covers AC-2 (R-13): <input> → <Input>
 * @covers AC-3 (R-13): <textarea> → <Input as="textarea">
 * @covers UI-design 3.x: backward compatibility (по умолчанию <input>)
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from '@/components/ui/Input';

describe('Input — as="textarea" (B-019-T0)', () => {
  // Backward compatibility: по умолчанию (без as) рендерится <input>
  it('backward compatibility: рендерит <input> при отсутствии as', () => {
    const { container } = render(<Input label="Email" id="email" type="text" />);
    expect(container.querySelector('input')).toBeInTheDocument();
    expect(container.querySelector('textarea')).not.toBeInTheDocument();
  });

  // AC-3: при as="textarea" рендер <textarea>
  it('AC-3: рендерит <textarea> при as="textarea"', () => {
    const { container } = render(<Input as="textarea" label="Описание" id="desc" rows={3} />);
    const textarea = container.querySelector('textarea');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('rows', '3');
  });

  // label рендерится для textarea
  it('рендерит label для textarea и связывает через htmlFor/id', () => {
    render(<Input as="textarea" label="Описание" id="desc" />);
    const label = screen.getByLabelText('Описание');
    expect(label.tagName).toBe('TEXTAREA');
  });

  // error отображается для textarea с role=alert
  it('AC-4: error рендерится с role=alert и aria-invalid для textarea', () => {
    const { container } = render(
      <Input as="textarea" label="Описание" id="desc" error="Ошибка" />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Ошибка');
    expect(container.querySelector('textarea')).toHaveAttribute('aria-invalid', 'true');
  });

  // label/error/autoResize не должны попасть в DOM-атрибуты
  it('label/error/autoResize не попадают в DOM-атрибуты textarea', () => {
    const { container } = render(
      <Input as="textarea" id="desc" label="Описание" error="ERR" autoResize placeholder="Плейсхолдер" />
    );
    const textarea = container.querySelector('textarea')!;
    expect(textarea).not.toHaveAttribute('label');
    expect(textarea).not.toHaveAttribute('error');
    expect(textarea).not.toHaveAttribute('autoResize');
    expect(textarea).toHaveAttribute('placeholder', 'Плейсхолдер');
  });

  // autoResize вызывает подгонку высоты по содержимому
  it('autoResize: подгоняет высоту при вводе (onInput)', () => {
    const { container } = render(<Input as="textarea" autoResize placeholder="Сообщение" />);
    const textarea = container.querySelector('textarea')!;
    Object.defineProperty(textarea, 'scrollHeight', { value: 80, configurable: true });

    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    expect(textarea.style.height).toBe('80px');
  });

  // Стандартный input продолжает рендерить label и error
  it('standard: label и error работают для <input> (backward compatibility)', () => {
    const { container } = render(
      <Input label="Имя" id="name" error="Введите имя" />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Введите имя');
    expect(container.querySelector('input')).toHaveAttribute('aria-invalid', 'true');
  });
});
