---
description: "Tests E2E avec Playwright : structure, page objects, isolation de l'API, bonnes pratiques de stabilité."
applyTo: 'e2e/**'
---

# Tests E2E (Playwright)

Squelettes : `templates/e2e.spec.template.ts`, `templates/page-object.template.ts` (`11`).

## Structure

```
e2e/
  playwright.config.ts   # webServer = ng serve, baseURL, trace: 'on-first-retry'
  pages/<page>.page.ts   # page objects
  fixtures/              # fixtures Playwright (page objects injectés, données)
  tests/<feature>/<scenario>.spec.ts
```

## Règles

- E2E = **parcours utilisateur critiques** (voir l'activité sur le dashboard, planifier une séance), pas une duplication des tests de composants.
- **Isoler le back** par défaut : réponses simulées via les handlers MSW partagés ou `page.route()`. Un petit nombre de tests « smoke » contre le vrai back est possible, taggés `@live`, hors CI par défaut.
- **Page objects** : les sélecteurs et actions vivent dans `pages/`, les specs ne contiennent que le scénario.
- Locators par rôle/label/texte (`getByRole`, `getByLabel`) ; `data-testid` seulement si rien d'accessible n'existe.
- Assertions web-first (`await expect(locator).toBeVisible()`) ; **jamais** `waitForTimeout`.
- Tests indépendants et parallélisables : pas d'ordre, pas d'état partagé.
- Trace et screenshot en cas d'échec ; vidéo désactivée par défaut.
- Navigateur par défaut : Chromium ; ajouter Firefox/WebKit seulement sur besoin.
