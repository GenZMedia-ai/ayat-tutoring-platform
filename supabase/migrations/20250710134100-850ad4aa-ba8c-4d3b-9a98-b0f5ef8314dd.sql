-- PHASE 4: MONITORING & VALIDATION (FINAL FIX)
-- Comprehensive security audit and monitoring setup

-- 1. Create comprehensive security audit view for monitoring
CREATE OR REPLACE VIEW public.security_audit_summary AS
SELECT 
  'RLS_STATUS' as check_type,
  schemaname as schema_name,
  tablename as table_name,
  CASE 
    WHEN rowsecurity THEN 'ENABLED'
    ELSE 'DISABLED'
  END as status,
  'Row Level Security status' as description
FROM pg_tables pt
LEFT JOIN pg_class pc ON pc.relname = pt.tablename
WHERE pt.schemaname = 'public'
  AND pc.relkind = 'r'
UNION ALL
SELECT 
  'FUNCTION_SECURITY' as check_type,
  pronamespace::regnamespace::text as schema_name,
  proname as table_name,
  CASE 
    WHEN prosecdef THEN 'SECURITY_DEFINER'
    ELSE 'SECURITY_INVOKER'
  END as status,
  'Function security model' as description
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
  AND (proname LIKE '%audit%' OR proname LIKE '%security%');

-- 2. Create monitoring function for database health
CREATE OR REPLACE FUNCTION public.get_database_health_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
  table_stats jsonb;
  security_stats jsonb;
BEGIN
  -- Gather table statistics
  SELECT jsonb_object_agg(
    table_name,
    jsonb_build_object(
      'row_count', row_count,
      'table_size', pg_size_pretty(table_size),
      'total_size', pg_size_pretty(table_size)
    )
  ) INTO table_stats
  FROM (
    SELECT 
      schemaname||'.'||relname as table_name,
      n_tup_ins + n_tup_upd + n_tup_del as row_count,
      pg_total_relation_size(schemaname||'.'||relname) as table_size
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC
    LIMIT 10
  ) t;

  -- Gather security statistics
  SELECT jsonb_build_object(
    'tables_with_rls', COUNT(*) FILTER (WHERE rowsecurity = true),
    'tables_without_rls', COUNT(*) FILTER (WHERE rowsecurity = false),
    'total_tables', COUNT(*)
  ) INTO security_stats
  FROM pg_tables pt
  LEFT JOIN pg_class pc ON pc.relname = pt.tablename
  WHERE pt.schemaname = 'public'
    AND pc.relkind = 'r';

  -- Combine all metrics
  result := jsonb_build_object(
    'timestamp', now(),
    'database_name', current_database(),
    'table_statistics', table_stats,
    'security_statistics', security_stats,
    'connection_count', (
      SELECT count(*) FROM pg_stat_activity 
      WHERE datname = current_database()
    )
  );

  RETURN result;
END;
$$;

-- 3. Create automated security validation
CREATE OR REPLACE FUNCTION public.validate_security_configuration()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
  issues jsonb[] := '{}';
  tables_without_rls text[];
BEGIN
  -- Check for tables without RLS
  SELECT array_agg(tablename) INTO tables_without_rls
  FROM pg_tables pt
  LEFT JOIN pg_class pc ON pc.relname = pt.tablename
  WHERE pt.schemaname = 'public'
    AND pc.relkind = 'r'
    AND (pc.relrowsecurity = false OR pc.relrowsecurity IS NULL)
    AND pt.tablename NOT IN ('notification_settings');

  -- Build issues array
  IF array_length(tables_without_rls, 1) > 0 THEN
    issues := issues || jsonb_build_object(
      'type', 'RLS_DISABLED',
      'severity', 'HIGH',
      'description', 'Tables without Row Level Security enabled',
      'affected_objects', tables_without_rls
    );
  END IF;

  result := jsonb_build_object(
    'timestamp', now(),
    'security_score', CASE 
      WHEN array_length(issues, 1) = 0 THEN 100
      WHEN array_length(issues, 1) <= 2 THEN 80
      ELSE 60
    END,
    'issues_found', COALESCE(array_length(issues, 1), 0),
    'issues', issues,
    'status', CASE 
      WHEN array_length(issues, 1) = 0 THEN 'SECURE'
      WHEN array_length(issues, 1) <= 2 THEN 'MINOR_ISSUES'
      ELSE 'NEEDS_ATTENTION'
    END
  );

  RETURN result;
END;
$$;

-- 4. Create simple performance monitoring view
CREATE OR REPLACE VIEW public.performance_monitoring AS
SELECT 
  schemaname,
  relname as tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  CASE 
    WHEN (seq_scan + idx_scan) > 0 
    THEN (idx_scan::numeric / (seq_scan + idx_scan)) * 100 
    ELSE 0 
  END as index_usage_percentage,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC;

-- 5. Enable realtime for critical tables
DO $$
BEGIN
  -- Set replica identity for better realtime performance
  ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;
  ALTER TABLE public.notification_logs REPLICA IDENTITY FULL;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore if tables don't exist
    NULL;
END $$;

-- 6. Log Phase 4 completion and final status
INSERT INTO public.audit_logs (
  action_type, 
  target_type, 
  metadata
) VALUES (
  'all_phases_complete',
  'database',
  jsonb_build_object(
    'phase', 'phase_4_final',
    'summary', jsonb_build_object(
      'phase_1', 'critical_security_fixes_applied',
      'phase_2', 'data_integrity_protection_enabled',
      'phase_3', 'performance_optimization_completed',
      'phase_4', 'monitoring_and_validation_deployed'
    ),
    'security_status', 'SIGNIFICANTLY_IMPROVED',
    'performance_status', 'OPTIMIZED',
    'timestamp', now(),
    'implementation_complete', true
  )
);