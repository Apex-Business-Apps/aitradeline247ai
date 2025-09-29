/**
 * Security monitoring and anomaly detection endpoint
 * Runs automated security checks and anomaly detection
 */

export async function securityMonitorHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Run anomaly detection
    const { error: anomalyError } = await supabase
      .rpc('detect_and_alert_anomalies');

    if (anomalyError) {
      console.error('Anomaly detection error:', anomalyError);
      return res.status(500).json({ 
        error: 'Failed to run anomaly detection',
        details: anomalyError.message 
      });
    }

    // Get recent security alerts for summary
    const { data: recentAlerts, error: alertError } = await supabase
      .from('security_alerts')
      .select('alert_type, severity, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (alertError) {
      console.error('Failed to fetch recent alerts:', alertError);
    }

    // Log monitoring execution
    await supabase.from('analytics_events').insert({
      event_type: 'security_monitoring_executed',
      event_data: {
        recent_alerts_count: recentAlerts?.length || 0,
        execution_time: new Date().toISOString()
      },
      severity: 'info'
    });

    return res.json({
      ok: true,
      summary: {
        anomaly_detection_completed: true,
        recent_alerts_24h: recentAlerts?.length || 0,
        high_severity_alerts: recentAlerts?.filter(a => a.severity === 'high')?.length || 0,
        critical_alerts: recentAlerts?.filter(a => a.severity === 'critical')?.length || 0
      },
      recent_alerts: recentAlerts || []
    });

  } catch (error) {
    console.error('Security monitoring error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}