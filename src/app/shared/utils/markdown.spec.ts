import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('rend le markdown courant : titres, listes, gras et liens', () => {
    const html = renderMarkdown(
      '## Bilan\n\n- **bien** : tenue\n- à revoir\n\n[site](https://example.com)',
    );

    expect(html).toContain('<h2');
    expect(html).toContain('Bilan');
    expect(html).toContain('<strong>bien</strong>');
    expect(html).toContain('<li>');
    expect(html).toContain('href="https://example.com"');
  });

  it('supprime les scripts, les gestionnaires d’événements et les liens javascript:', () => {
    const html = renderMarkdown(
      '<script>alert(1)</script>\n\n<img src="x" onerror="alert(2)">\n\n[piège](javascript:alert(3))',
    );

    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('javascript:');
  });

  it('renvoie une chaîne vide pour un texte vide', () => {
    expect(renderMarkdown('')).toBe('');
  });
});
