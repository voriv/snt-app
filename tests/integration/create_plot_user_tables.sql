-- Создание таблицы plot_users
CREATE TABLE IF NOT EXISTS public.plot_users (
    id text PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    plot_id text NOT NULL,
    role integer NOT NULL,
    status text NOT NULL DEFAULT 'active',
    comment text,
    assigned_at timestamp(6) without time zone NOT NULL DEFAULT now(),
    expires_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL DEFAULT now(),
    updated_at timestamp(6) without time zone NOT NULL
);

-- Создание таблицы plot_user_history
CREATE TABLE IF NOT EXISTS public.plot_user_history (
    id text PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_user_id text NOT NULL REFERENCES public.plot_users(id) ON DELETE CASCADE,
    user_id text NOT NULL,
    plot_id text NOT NULL,
    role integer NOT NULL,
    status text NOT NULL,
    comment text,
    changed_by text NOT NULL,
    changed_at timestamp(6) without time zone NOT NULL DEFAULT now(),
    changed_reason text NOT NULL DEFAULT 'Initial assignment',
    old_values jsonb,
    new_values jsonb
);

-- Создание уникального индекса
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_plot_role ON public.plot_users(user_id, plot_id, role);

-- Создание индексов для plot_users
CREATE INDEX IF NOT EXISTS plot_user_role_user_id_idx ON public.plot_users(user_id);
CREATE INDEX IF NOT EXISTS plot_user_role_plot_id_idx ON public.plot_users(plot_id);

-- Создание индексов для plot_user_history
CREATE INDEX IF NOT EXISTS plot_user_history_plot_user_id_idx ON public.plot_user_history(plot_user_id);
CREATE INDEX IF NOT EXISTS plot_user_history_user_id_idx ON public.plot_user_history(user_id);
CREATE INDEX IF NOT EXISTS plot_user_history_plot_id_idx ON public.plot_user_history(plot_id);
