-- Prevent family-scoped records from referencing a parent in another family.
--
-- RLS authorizes against family_id. Without this relational invariant, a row
-- could be authorized for one family while pointing at another family's parent.
-- Fail the migration rather than silently rewriting clinical data if legacy
-- inconsistencies exist; those records require an explicit security review.

DO $$
DECLARE
    target_table TEXT;
    inconsistent_rows BIGINT;
BEGIN
    FOREACH target_table IN ARRAY ARRAY[
        'documents',
        'medicines',
        'appointments',
        'timeline_events',
        'saved_places',
        'location_visits',
        'tasks',
        'sos_events',
        'healthcare_expenses',
        'insurance_policies'
    ]
    LOOP
        EXECUTE format(
            'SELECT count(*) FROM public.%I child '
            'JOIN public.parent_profiles parent ON parent.id = child.parent_id '
            'WHERE child.family_id <> parent.family_id',
            target_table
        ) INTO inconsistent_rows;

        IF inconsistent_rows > 0 THEN
            RAISE EXCEPTION
                'Security migration blocked: table % contains % cross-family parent reference(s)',
                target_table,
                inconsistent_rows;
        END IF;
    END LOOP;
END
$$;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.parent_profiles'::regclass
          AND conname = 'uq_parent_profiles_id_family'
    ) THEN
        ALTER TABLE public.parent_profiles
            ADD CONSTRAINT uq_parent_profiles_id_family UNIQUE (id, family_id);
    END IF;
END
$$;

DO $$
DECLARE
    target_table TEXT;
    constraint_name TEXT;
BEGIN
    FOREACH target_table IN ARRAY ARRAY[
        'documents',
        'medicines',
        'appointments',
        'timeline_events',
        'saved_places',
        'location_visits',
        'tasks',
        'sos_events',
        'healthcare_expenses',
        'insurance_policies'
    ]
    LOOP
        constraint_name := 'fk_' || target_table || '_parent_family';
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid = format('public.%I', target_table)::regclass
              AND conname = constraint_name
        ) THEN
            EXECUTE format(
                'ALTER TABLE public.%I ADD CONSTRAINT %I '
                'FOREIGN KEY (parent_id, family_id) '
                'REFERENCES public.parent_profiles (id, family_id) ON DELETE CASCADE',
                target_table,
                constraint_name
            );
        END IF;
    END LOOP;
END
$$;
