CREATE TABLE IF NOT EXISTS calendar_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  color TEXT NOT NULL DEFAULT '#2E86C1',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE calendar_tasks ENABLE ROW LEVEL SECURITY;

-- Cada usuário vê e gerencia apenas suas próprias tarefas
CREATE POLICY "Users manage own calendar tasks"
  ON calendar_tasks FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX calendar_tasks_user_date ON calendar_tasks (user_id, date);
