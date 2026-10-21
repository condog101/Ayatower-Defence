import { describe, expect, it } from 'vitest';
import '../web/src/data/enemies';
import '../web/src/data/levels';
import '../web/src/data/towers';
import '../web/src/sim/sim';

// Everything the headless tests import must stay free of Phaser and the DOM: Device.ts reads
// `location` at import and balance.ts imports Device.ts.
const sources = import.meta.glob(['../web/src/sim/*.ts', '../web/src/data/**/*.ts', '!../web/src/data/balance.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describe('sim and data stay headless', () => {
  it('importing them never touches the DOM', () => {
    expect(typeof document).toBe('undefined');
    expect(typeof location).toBe('undefined');
  });

  it('no sim or data module imports Phaser, systems/ or balance.ts', () => {
    const files = Object.keys(sources);
    expect(files.length).toBeGreaterThan(10);
    for (const [file, src] of Object.entries(sources)) {
      expect(src, file).not.toMatch(/from ['"]phaser['"]/);
      expect(src, file).not.toMatch(/from ['"][./]*systems\//);
      expect(src, file).not.toMatch(/from ['"][./]*(data\/)?balance['"]/);
      // The sim is deterministic: one seeded PRNG, no wall clock.
      if (file.includes('/sim/')) expect(src, file).not.toMatch(/Math\.random|Date\.now|performance\.now/);
    }
  });
});
