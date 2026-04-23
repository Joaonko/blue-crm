CREATE OR REPLACE FUNCTION public.get_invitation_details(invite_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_email TEXT;
    invite_record RECORD;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    current_email := lower(coalesce(auth.jwt() ->> 'email', ''));

    IF current_email = '' THEN
        RAISE EXCEPTION 'E-mail do usuário não encontrado';
    END IF;

    SELECT
        i.id,
        i.email,
        i.role,
        i.status,
        i.expires_at,
        i.organization_id,
        o.name AS organization_name
    INTO invite_record
    FROM invitations i
    JOIN organizations o ON o.id = i.organization_id
    WHERE i.token = invite_token
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Convite não encontrado';
    END IF;

    IF lower(invite_record.email) <> current_email THEN
        RAISE EXCEPTION 'Este convite pertence a outro e-mail';
    END IF;

    RETURN jsonb_build_object(
        'id', invite_record.id,
        'email', invite_record.email,
        'role', invite_record.role,
        'status', invite_record.status,
        'expires_at', invite_record.expires_at,
        'organization_id', invite_record.organization_id,
        'organization_name', invite_record.organization_name
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_invitation_details(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invitation_details(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_invitation(invite_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    current_email TEXT;
    invite_record invitations%ROWTYPE;
BEGIN
    current_user_id := auth.uid();

    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    current_email := lower(coalesce(auth.jwt() ->> 'email', ''));

    IF current_email = '' THEN
        RAISE EXCEPTION 'E-mail do usuário não encontrado';
    END IF;

    SELECT *
    INTO invite_record
    FROM invitations
    WHERE token = invite_token
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Convite não encontrado';
    END IF;

    IF lower(invite_record.email) <> current_email THEN
        RAISE EXCEPTION 'Este convite pertence a outro e-mail';
    END IF;

    IF invite_record.status <> 'pending' THEN
        RAISE EXCEPTION 'Este convite não está mais disponível';
    END IF;

    IF invite_record.expires_at < now() THEN
        UPDATE invitations
        SET status = 'expired'
        WHERE id = invite_record.id
          AND status = 'pending';

        RAISE EXCEPTION 'Este convite expirou';
    END IF;

    INSERT INTO organization_members (
        organization_id,
        user_id,
        role,
        active,
        invited_by
    ) VALUES (
        invite_record.organization_id,
        current_user_id,
        invite_record.role,
        true,
        invite_record.invited_by
    )
    ON CONFLICT (organization_id, user_id)
    DO UPDATE SET
        role = EXCLUDED.role,
        active = true,
        invited_by = COALESCE(organization_members.invited_by, EXCLUDED.invited_by);

    UPDATE invitations
    SET status = 'accepted'
    WHERE id = invite_record.id;

    RETURN jsonb_build_object(
        'organization_id', invite_record.organization_id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_invitation(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT) TO authenticated;
