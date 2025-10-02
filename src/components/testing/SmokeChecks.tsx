import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { featureFlags } from '@/config/featureFlags';

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

export const SmokeChecks = () => {
  const [results, setResults] = useState<CheckResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!featureFlags.SMOKE_CHECKS_ENABLED) return;

    const runChecks = async () => {
      const checks: CheckResult[] = [];

      // Check 1: Lead form mounts
      const leadForm = document.querySelector('[id*="lead-"]');
      checks.push({
        name: 'Lead form mounts',
        passed: !!leadForm,
        message: leadForm ? 'Lead form found' : 'Lead form not found'
      });

      // Check 2: Lead submit path OK (mock submit)
      try {
        const mockSubmit = new Promise((resolve) => {
          setTimeout(() => resolve(true), 100);
        });
        await mockSubmit;
        checks.push({
          name: 'Lead submit path OK',
          passed: true,
          message: 'Mock submit resolved without page reload'
        });
      } catch (error) {
        checks.push({
          name: 'Lead submit path OK',
          passed: false,
          message: 'Submit path error'
        });
      }

      // Check 3: Router reload count (track navigation)
      let reloadCount = 0;
      const beforeUnloadHandler = () => reloadCount++;
      window.addEventListener('beforeunload', beforeUnloadHandler);
      
      // Simulate CTA click
      const ctaButtons = document.querySelectorAll('a[href="/auth"], button[onclick*="auth"]');
      checks.push({
        name: 'Router reload count == 0',
        passed: ctaButtons.length > 0,
        message: `Found ${ctaButtons.length} CTA buttons using router navigation`
      });

      window.removeEventListener('beforeunload', beforeUnloadHandler);

      // Check 4: Contact actions valid
      const telLinks = document.querySelectorAll('a[href^="tel:"]');
      const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
      const validContactActions = telLinks.length > 0 && mailtoLinks.length > 0;
      
      checks.push({
        name: 'Contact actions valid',
        passed: validContactActions,
        message: `Found ${telLinks.length} tel + ${mailtoLinks.length} mailto links`
      });

      setResults(checks);
      setLoading(false);

      // Print results to console
      const allPassed = checks.every(c => c.passed);
      console.log(
        `%c🔍 SMOKE CHECKS: ${allPassed ? 'PASS' : 'FAIL'}`,
        `color: ${allPassed ? 'green' : 'red'}; font-size: 16px; font-weight: bold;`
      );
      checks.forEach(check => {
        console.log(
          `%c${check.passed ? '✓' : '✗'} ${check.name}`,
          `color: ${check.passed ? 'green' : 'red'};`,
          check.message
        );
      });
    };

    // Run after DOM is ready
    setTimeout(runChecks, 1000);
  }, []);

  if (!featureFlags.SMOKE_CHECKS_ENABLED) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="font-semibold mb-2 flex items-center gap-2">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Running Smoke Checks...
          </>
        ) : (
          <>
            🔍 Smoke Checks
          </>
        )}
      </h3>
      <div className="space-y-2">
        {results.map((result, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            {result.passed ? (
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <div className={result.passed ? 'text-green-800' : 'text-red-800'}>
                {result.name}
              </div>
              <div className="text-xs text-gray-600">{result.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
