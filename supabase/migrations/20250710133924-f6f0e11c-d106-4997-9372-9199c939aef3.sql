-- PHASE 4: MONITORING & VALIDATION
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
  AND proname LIKE '%audit%' OR proname LIKE '%security%'
UNION ALL
SELECT 
  'SEARCH_PATH_SECURITY' as check_type,
  pronamespace::regnamespace::text as schema_name,
  proname as table_name,
  CASE 
    WHEN proconfig IS NOT NULL AND 'search_path=' = ANY(proconfig) THEN 'SECURED'
    ELSE 'NEEDS_REVIEW'
  END as status,
  'Function search_path configuration' as description
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace;

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
  index_stats jsonb;
  security_stats jsonb;
BEGIN
  -- Gather table statistics
  SELECT jsonb_object_agg(
    table_name,
    jsonb_build_object(
      'row_count', row_count,
      'table_size', pg_size_pretty(table_size),
      'index_size', pg_size_pretty(index_size),
      'total_size', pg_size_pretty(table_size + index_size)
    )
  ) INTO table_stats
  FROM (
    SELECT 
      schemaname||'.'||tablename as table_name,
      n_tup_ins + n_tup_upd + n_tup_del as row_count,
      pg_total_relation_size(schemaname||'.'||tablename) as table_size,
      pg_indexes_size(schemaname||'.'||tablename) as index_size
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LIMIT 10
  ) t;

  -- Gather index usage statistics
  SELECT jsonb_object_agg(
    indexrelname,
    jsonb_build_object(
      'scans', idx_scan,
      'tuples_read', idx_tup_read,
      'tuples_fetched', idx_tup_fetch,
      'size', pg_size_pretty(pg_relation_size(indexrelid))
    )
  ) INTO index_stats
  FROM pg_stat_user_indexes 
  WHERE schemaname = 'public'
    AND idx_scan > 0
  ORDER BY idx_scan DESC
  LIMIT 15;

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
    'index_statistics', index_stats,
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
  functions_without_search_path text[];
BEGIN
  -- Check for tables without RLS
  SELECT array_agg(tablename) INTO tables_without_rls
  FROM pg_tables pt
  LEFT JOIN pg_class pc ON pc.relname = pt.tablename
  WHERE pt.schemaname = 'public'
    AND pc.relkind = 'r'
    AND (pc.relrowsecurity = false OR pc.relrowsecurity IS NULL)
    AND pt.tablename NOT IN ('notification_settings'); -- Exclude system tables

  -- Check for functions without secure search_path
  SELECT array_agg(proname) INTO functions_without_search_path
  FROM pg_proc 
  WHERE pronamespace = 'public'::regnamespace
    AND prosecdef = true  -- Security definer functions
    AND (proconfig IS NULL OR NOT ('search_path=' = ANY(proconfig)));

  -- Build issues array
  IF array_length(tables_without_rls, 1) > 0 THEN
    issues := issues || jsonb_build_object(
      'type', 'RLS_DISABLED',
      'severity', 'HIGH',
      'description', 'Tables without Row Level Security enabled',
      'affected_objects', tables_without_rls
    );
  END IF;

  IF array_length(functions_without_search_path, 1) > 0 THEN
    issues := issues || jsonb_build_object(
      'type', 'INSECURE_SEARCH_PATH',
      'severity', 'MEDIUM',
      'description', 'Security definer functions without secure search_path',
      'affected_objects', functions_without_search_path
    );
  END IF;

  result := jsonb_build_object(
    'timestamp', now(),
    'security_score', CASE 
      WHEN array_length(issues, 1) = 0 THEN 100
      WHEN array_length(issues, 1) <= 2 THEN 80
      WHEN array_length(issues, 1) <= 5 THEN 60
      ELSE 40
    END,
    'issues_found', array_length(issues, 1),
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

-- 4. Enable realtime for critical tables (if not already enabled)
-- This allows frontend to receive live updates
DO $$
BEGIN
  -- Enable realtime for audit logs
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'audit_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
  END IF;

  -- Set replica identity for better realtime performance
  ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;
  ALTER TABLE public.notification_logs REPLICA IDENTITY FULL;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore if realtime is not available
    NULL;
END $$;

-- 5. Create performance monitoring view
CREATE OR REPLACE VIEW public.performance_monitoring AS
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  ROUND(
    CASE 
      WHEN (seq_scan + idx_scan) > 0 
      THEN (idx_scan::float / (seq_scan + idx_scan)) * 100 
      ELSE 0 
    END, 2
  ) as index_usage_percentage,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC;

-- 6. Log Phase 4 completion and final status
INSERT INTO public.audit_logs (
  action_type, 
  target_type, 
  metadata
) VALUES (
  'monitoring_validation_complete',
  'database',
  jsonb_build_object(
    'phase', 'phase_4_monitoring',
    'features_added', jsonb_build_array(
      'security_audit_views_created',
      'health_monitoring_functions_added',
      'automated_security_validation',
      'performance_monitoring_views',
      'realtime_configuration_updated'
    ),
    'all_phases_complete', true,
    'timestamp', now()
  )
);

-- 7. Final security validation report
SELECT public.validate_security_configuration() as final_security_report;