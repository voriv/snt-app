-- Создание таблицы plot_user_history
CREATE TABLE IF NOT EXISTS public.plot_user_history (
    id text PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_user_id text NOT NULL REFERENCES public.plot_users(id) ON DELETE CASCADE,
    user_id text NOT NULL,
    plot_id text NOT NULL,
    role integer NOT NULL,
    status text NOT NULL DEFAULT 'active',
    comment text,
    changed_by text NOT NULL,
    changed_at timestamp(6) without time zone DEFAULT now(),
    changed_reason text NOT NULL DEFAULT 'Initial assignment',
    old_values jsonb,
    new_values jsonb
);

CREATE INDEX IF NOT EXISTS idx_plot_user_history_plot_user_id ON public.plot_user_history(plot_user_id);
CREATE INDEX IF NOT EXISTS idx_plot_user_history_user_id ON public.plot_user_history(user_id);
CREATE INDEX IF NOT EXISTS idx_plot_user_history_plot_id ON public.plot_user_history(plot_id);
