-- ============================================================================
-- COMPLETE RLS POLICY FIX
-- Run this entire script in Supabase SQL Editor
-- It will create any missing policies (skips duplicates automatically)
-- ============================================================================

-- ============================================================================
-- PROJECTS TABLE POLICIES (You already have these, will skip duplicates)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can insert own projects'
  ) THEN
    CREATE POLICY "Users can insert own projects"
    ON projects FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can view own projects'
  ) THEN
    CREATE POLICY "Users can view own projects"
    ON projects FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can update own projects'
  ) THEN
    CREATE POLICY "Users can update own projects"
    ON projects FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can delete own projects'
  ) THEN
    CREATE POLICY "Users can delete own projects"
    ON projects FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- SCHEMATICS TABLE POLICIES (MISSING - CRITICAL!)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'schematics' AND policyname = 'Users can insert schematics'
  ) THEN
    CREATE POLICY "Users can insert schematics"
    ON schematics FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = schematics.project_id
        AND projects.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'schematics' AND policyname = 'Users can view own schematics'
  ) THEN
    CREATE POLICY "Users can view own schematics"
    ON schematics FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = schematics.project_id
        AND projects.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'schematics' AND policyname = 'Users can update own schematics'
  ) THEN
    CREATE POLICY "Users can update own schematics"
    ON schematics FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = schematics.project_id
        AND projects.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'schematics' AND policyname = 'Users can delete own schematics'
  ) THEN
    CREATE POLICY "Users can delete own schematics"
    ON schematics FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = schematics.project_id
        AND projects.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- ============================================================================
-- BOM_ITEMS TABLE POLICIES (MISSING - CRITICAL!)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bom_items' AND policyname = 'Users can insert bom items'
  ) THEN
    CREATE POLICY "Users can insert bom items"
    ON bom_items FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM schematics
        JOIN projects ON projects.id = schematics.project_id
        WHERE schematics.id = bom_items.schematic_id
        AND projects.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bom_items' AND policyname = 'Users can view own bom items'
  ) THEN
    CREATE POLICY "Users can view own bom items"
    ON bom_items FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM schematics
        JOIN projects ON projects.id = schematics.project_id
        WHERE schematics.id = bom_items.schematic_id
        AND projects.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bom_items' AND policyname = 'Users can update own bom items'
  ) THEN
    CREATE POLICY "Users can update own bom items"
    ON bom_items FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM schematics
        JOIN projects ON projects.id = schematics.project_id
        WHERE schematics.id = bom_items.schematic_id
        AND projects.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bom_items' AND policyname = 'Users can delete own bom items'
  ) THEN
    CREATE POLICY "Users can delete own bom items"
    ON bom_items FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM schematics
        JOIN projects ON projects.id = schematics.project_id
        WHERE schematics.id = bom_items.schematic_id
        AND projects.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- ============================================================================
-- ENCLOSURE_RECOMMENDATIONS TABLE POLICIES (MISSING - CRITICAL!)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'enclosure_recommendations' AND policyname = 'Users can insert enclosure recommendations'
  ) THEN
    CREATE POLICY "Users can insert enclosure recommendations"
    ON enclosure_recommendations FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM schematics
        JOIN projects ON projects.id = schematics.project_id
        WHERE schematics.id = enclosure_recommendations.schematic_id
        AND projects.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'enclosure_recommendations' AND policyname = 'Users can view own enclosure recommendations'
  ) THEN
    CREATE POLICY "Users can view own enclosure recommendations"
    ON enclosure_recommendations FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM schematics
        JOIN projects ON projects.id = schematics.project_id
        WHERE schematics.id = enclosure_recommendations.schematic_id
        AND projects.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'enclosure_recommendations' AND policyname = 'Users can update own enclosure recommendations'
  ) THEN
    CREATE POLICY "Users can update own enclosure recommendations"
    ON enclosure_recommendations FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM schematics
        JOIN projects ON projects.id = schematics.project_id
        WHERE schematics.id = enclosure_recommendations.schematic_id
        AND projects.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'enclosure_recommendations' AND policyname = 'Users can delete own enclosure recommendations'
  ) THEN
    CREATE POLICY "Users can delete own enclosure recommendations"
    ON enclosure_recommendations FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM schematics
        JOIN projects ON projects.id = schematics.project_id
        WHERE schematics.id = enclosure_recommendations.schematic_id
        AND projects.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- ============================================================================
-- POWER_REQUIREMENTS TABLE POLICIES (MISSING - CRITICAL!)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'power_requirements' AND policyname = 'Users can insert power requirements'
  ) THEN
    CREATE POLICY "Users can insert power requirements"
    ON power_requirements FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM schematics
        JOIN projects ON projects.id = schematics.project_id
        WHERE schematics.id = power_requirements.schematic_id
        AND projects.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'power_requirements' AND policyname = 'Users can view own power requirements'
  ) THEN
    CREATE POLICY "Users can view own power requirements"
    ON power_requirements FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM schematics
        JOIN projects ON projects.id = schematics.project_id
        WHERE schematics.id = power_requirements.schematic_id
        AND projects.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'power_requirements' AND policyname = 'Users can update own power requirements'
  ) THEN
    CREATE POLICY "Users can update own power requirements"
    ON power_requirements FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM schematics
        JOIN projects ON projects.id = schematics.project_id
        WHERE schematics.id = power_requirements.schematic_id
        AND projects.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'power_requirements' AND policyname = 'Users can delete own power requirements'
  ) THEN
    CREATE POLICY "Users can delete own power requirements"
    ON power_requirements FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM schematics
        JOIN projects ON projects.id = schematics.project_id
        WHERE schematics.id = power_requirements.schematic_id
        AND projects.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION: Show all policies that were created
-- ============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE tablename IN (
  'projects',
  'schematics',
  'bom_items',
  'enclosure_recommendations',
  'power_requirements'
)
ORDER BY tablename, cmd;
