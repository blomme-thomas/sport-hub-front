import { describe, expect, it } from 'vitest';

declare global {
  interface ImportMeta {
    glob<T>(
      pattern: string[],
      options: { query: string; import: string; eager: true },
    ): Record<string, T>;
  }
}

const HEX_COLOR = /#[0-9a-fA-F]{3,8}\b/;

const sources = import.meta.glob<string>(['./**/*.ts', '!./**/*.spec.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

describe('couleurs de la feature dashboard', () => {
  it('trouve au moins un fichier TypeScript applicatif à contrôler', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(0);
  });

  it('ne contient aucune valeur hexadécimale dans les fichiers TypeScript', () => {
    const offenders = Object.entries(sources)
      .filter(([, source]) => HEX_COLOR.test(source))
      .map(([path]) => path);

    expect(offenders).toEqual([]);
  });
});
