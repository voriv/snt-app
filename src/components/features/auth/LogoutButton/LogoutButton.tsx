/**
 * @component LogoutButton
 * @category features
 * @description Кнопка выхода из системы с модальным окном подтверждения
 *
 * @description
 * Компонент отображает кнопку «Выйти» в навбаре. При нажатии открывается
 * модальное окно подтверждения. После подтверждения вызывается signOut() из next-auth/react.
 *
 * @example
 * ```tsx
 * <LogoutButton onLogoutComplete={() => console.log('Logged out')} />
 * ```
 *
 * @spec
 * - При нажатии на кнопку открывается ConfirmDialog с текстом «Вы действительно хотите выйти?»
 * - При подтверждении вызывается signOut({ callbackUrl: '/' }) из next-auth/react
 * - При isLoading=true в модальном окне: кнопка «Выйти» блокируется
 * - После signOut пользователь перенаправляется на /
 * - Обработка ошибок: при ошибке signOut показывается error toast (вне скелета)
 *
 * @data-flow
 * - Клик на «Выйти» → isOpen=true → ConfirmDialog
 * - Клик на «Выйти» (danger) → onConfirm → signOut({ callbackUrl: '/' })
 * - signOut завершён → redirect to /
 */
'use client';

import React, { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export interface LogoutButtonProps {
  /** Callback функция после успешного logout */
  onLogoutComplete?: () => void;
}

/**
 * Хук для управления состоянием logout
 *
 * @spec
 * - isOpen=false по умолчанию
 * - При handleLogoutClick → isOpen=true
 * - При handleCloseModal → isOpen=false
 * - При handleLogout → isLoggingOut=true, вызывается signOut, затем isLoggingOut=false
 * - signOut использует callbackUrl: '/'
 *
 * @see https://next-auth.js.org/getting-started/client#signout
 */
function useLogout(props: LogoutButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutClick = () => {
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ callbackUrl: '/' });
      props.onLogoutComplete?.();
    } catch (error) {
      console.error('Error during logout:', error);
      // Здесь можно добавить toast notification об ошибке
    } finally {
      setIsLoggingOut(false);
    }
  };

  return {
    isOpen,
    isLoggingOut,
    handleLogoutClick,
    handleCloseModal,
    handleLogout,
  };
}

/**
 * Кнопка выхода из системы
 *
 * @spec
 * - Отображает кнопку «Выйти» (variant='ghost')
 * - При клике вызывает handleLogoutClick
 * - Внутри использует ConfirmDialog для подтверждения
 */
export function LogoutButton({ onLogoutComplete }: LogoutButtonProps): React.JSX.Element {
  const { isOpen, isLoggingOut, handleLogoutClick, handleCloseModal, handleLogout } = useLogout({ onLogoutComplete });

  return (
    <>
      <Button variant="ghost" onClick={handleLogoutClick}>
        Выйти
      </Button>
      <ConfirmDialog
        isOpen={isOpen}
        onClose={handleCloseModal}
        title="Выход из системы"
        message="Вы действительно хотите выйти?"
        confirmLabel="Выйти"
        cancelLabel="Отмена"
        onConfirm={handleLogout}
        isLoading={isLoggingOut}
        variant="danger"
      />
    </>
  );
}
