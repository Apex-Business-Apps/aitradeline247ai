/**
 * Wire Next - Phase 2 integrations
 * Imports and initializes auth protection, audit, and retention systems
 */
export async function wireNext(app) {
  try {
    // Import and wire auth protection
    const { wireAuthProtect } = await import('./auth.protect.wire.mjs');
    wireAuthProtect && wireAuthProtect(app);

    // Import and wire audit viewer
    const { wireAuditViewer } = await import('../routes/internal.audit.view.mjs');
    wireAuditViewer && wireAuditViewer(app);

    // Import and wire retention job
    const { wireRetention } = await import('../routes/internal.retention.run.mjs');
    wireRetention && wireRetention(app);

    console.log('✅ Phase 2 (Next) wiring complete');
  } catch (err) {
    console.error('❌ Wire Next failed:', err);
  }
}