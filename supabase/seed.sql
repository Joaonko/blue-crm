-- Seed inicial: Blue Ape Organization
-- IMPORTANTE: Execute apenas após rodar 001_initial_schema.sql
-- e após criar pelo menos um usuário via Supabase Auth.

-- Inserir organização Blue Ape
INSERT INTO organizations (id, name, slug, settings)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Blue Ape',
    'blueape',
    '{"currency": "BRL", "timezone": "America/Sao_Paulo"}'::jsonb
);

-- Criar funil padrão: Vendas B2B
-- Substitua o created_by pelo UUID do seu usuário se preferir
INSERT INTO funnels (id, organization_id, name, description, active, created_by)
VALUES (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Vendas B2B',
    'Funil principal para projetos de desenvolvimento de software',
    true,
    (SELECT id FROM auth.users LIMIT 1)
);

-- Criar etapas padrão
INSERT INTO stages (organization_id, funnel_id, name, "order", color, probability) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Prospecção',       1, '#6C7A89', 10),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Qualificação',     2, '#3498DB', 25),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Proposta Enviada', 3, '#2E86C1', 50),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Negociação',       4, '#F39C12', 75),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Fechamento',       5, '#27AE60', 90);

-- Adicionar o primeiro usuário como owner da organização
-- Substitua pelo UUID real do seu usuário se necessário
INSERT INTO organization_members (organization_id, user_id, role, active)
SELECT
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    id,
    'owner',
    true
FROM auth.users
LIMIT 1;
