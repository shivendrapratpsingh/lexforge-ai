/**
 * Dev-only logging. `log`/`warn` are silenced in production builds (release
 * bundles have `__DEV__ === false`) so nothing noisy or internal ever reaches
 * a real user's device console. `error` always logs — it also matters for
 * crash reporting tools that read from the console in production.
 */
export const logger = {
  log: (...args: unknown[]) => { if (__DEV__) console.log(...args); },
  warn: (...args: unknown[]) => { if (__DEV__) console.warn(...args); },
  error: (...args: unknown[]) => { console.error(...args); },
};
