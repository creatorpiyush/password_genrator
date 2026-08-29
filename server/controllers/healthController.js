/**
 * Health Check Controller for Zero-Downtime Monitoring
 */
export const HealthController = {
  getHealth(req, res) {
    res.json({
      status: 'ok',
      engine: 'SentinelVault Zero-Knowledge Engine v2.0',
      time: new Date().toISOString(),
    });
  },
};
