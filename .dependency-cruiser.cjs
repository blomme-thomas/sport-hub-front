// Garde-fou d'architecture (npm run deps:check). Règles tirées de instructions/01 :
// core et shared ne dépendent pas des features, une feature n'importe jamais une autre feature.
// Fichier en .cjs pour rester lisible quelle que soit la config "type" du package.json.

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Pas de dépendance circulaire.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'features-isolated',
      severity: 'error',
      comment: "Une feature n'importe jamais une autre feature (instructions/01).",
      from: { path: '^src/app/features/([^/]+)/' },
      to: { path: '^src/app/features/([^/]+)/', pathNot: '^src/app/features/$1/' },
    },
    {
      name: 'shared-core-no-features',
      severity: 'error',
      comment: 'Le transverse (core, shared) ne dépend pas des features.',
      from: { path: '^src/app/(core|shared)/' },
      to: { path: '^src/app/features/' },
    },
    {
      name: 'shared-no-core',
      severity: 'error',
      comment: 'shared est le niveau le plus bas : il ne dépend pas de core.',
      from: { path: '^src/app/shared/' },
      to: { path: '^src/app/core/' },
    },
    {
      name: 'not-to-spec',
      severity: 'error',
      comment: 'Le code de production ne dépend pas des fichiers de test.',
      from: { path: '^src/', pathNot: '\\.spec\\.ts$|^src/mocks/|^src/test-setup\\.ts$' },
      to: { path: '\\.spec\\.ts$|^src/mocks/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.app.json' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
    },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
