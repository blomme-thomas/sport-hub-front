---
description: 'Tests unitaires et de composants : Vitest, Testing Library, MSW, quoi tester et comment.'
applyTo: '**/*.spec.ts,src/mocks/**'
---

# Tests unitaires et composants

Squelettes : `templates/component.spec.template.ts`, `templates/service.spec.template.ts`, `templates/msw-handlers.template.ts` (`11`). E2E : `09b`.

## Outils

- **Vitest** (runner), **@testing-library/angular** (+ `@testing-library/user-event`, `jest-dom`/équivalent) pour les composants, **MSW** pour simuler l'API.
- `provideHttpClientTesting` toléré pour un test de service très simple ; MSW préféré dès qu'un scénario HTTP réaliste est nécessaire.

## Que tester (et à quel niveau)

| Cible                       | Niveau                | Ce qu'on vérifie                                           |
| --------------------------- | --------------------- | ---------------------------------------------------------- |
| Mapper, pipe, fonction pure | Unitaire pur          | Entrées → sorties, cas limites (null, vide, unités)        |
| Service API                 | Unitaire + MSW        | URL/méthode/payload, mapping de la réponse, erreurs HTTP   |
| State service / store       | Unitaire              | Transitions d'état, `computed`, états loading/error        |
| Composant de présentation   | Testing Library       | Rendu selon les `input()`, `output()` émis à l'interaction |
| Page                        | Testing Library + MSW | Rendu des états loading / vide / erreur / succès           |
| Parcours complet            | E2E (`09b`)           | Scénarios utilisateur de bout en bout                      |

## Règles

- Tester le **comportement observable** (texte, rôle ARIA, événements émis), pas l'implémentation (pas d'accès aux signals privés ni aux méthodes internes).
- Requêtes Testing Library par rôle/label/texte (`getByRole`, `findByText`), jamais par classe CSS ; `data-testid` en dernier recours.
- `render()` avec `inputs`/`providers` explicites ; pas d'état partagé entre tests.
- Un test = un comportement. Nom : `it('affiche … quand …')`. Structure Arrange / Act / Assert.
- Pas de `setTimeout`/`sleep` : `findBy*`, `waitFor`, `await fixture.whenStable()`.
- Les handlers MSW par défaut vivent dans `src/mocks/handlers/` ; un test surcharge avec `server.use(...)` pour les cas d'erreur.
- Pas de snapshot de DOM complet ; à la rigueur sur de petits fragments stables.
- Un bug corrigé = un test qui échoue avant le correctif.
- Les tests ne doivent jamais être affaiblis pour passer (`10`).
