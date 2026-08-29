import { readFile } from 'node:fs/promises';

export const DEFAULT_CONFIG = Object.freeze({
  risk: {
    highThreshold: 70,
    mediumThreshold: 35,
    largeChangeLines: 600,
    veryLargeChangeLines: 1500,
    sensitivePatterns: [
      '.github/workflows/', 'auth', 'security', 'permission', 'migration',
      'package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock',
      'dockerfile', 'terraform', '.tf', 'schema', 'database', 'secret'
    ]
  },
  ai: {
    model: 'gpt-5.6-terra',
    maxFiles: 80
  }
});

function deepMerge(base, override) {
  if (!override || typeof override !== 'object' || Array.isArray(override)) return base;
  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && base[key] && typeof base[key] === 'object') {
      out[key] = deepMerge(base[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export async function loadConfig(path = '.ossbeacon.json') {
  try {
    const raw = await readFile(path, 'utf8');
    return deepMerge(DEFAULT_CONFIG, JSON.parse(raw));
  } catch (error) {
    if (error?.code === 'ENOENT') return structuredClone(DEFAULT_CONFIG);
    throw new Error(`Failed to load ${path}: ${error.message}`);
  }
}
