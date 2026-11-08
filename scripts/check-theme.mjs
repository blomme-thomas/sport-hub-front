// Vérifie le thème : contraste WCAG AA des paires texte/fond de src/tokens.css, et absence d'hexadécimal
// dans les styles des composants (les couleurs passent par les tokens).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const TOKENS_FILE = 'src/tokens.css';
const COMPONENTS_DIR = 'src/app';
const MIN_CONTRAST = 4.5;

const PAIRS = [
  ['sh-text', 'sh-surface'],
  ['sh-text', 'sh-bg'],
  ['sh-text-muted', 'sh-surface'],
  ['sh-text-muted', 'sh-bg'],
  ['sh-accent-text', 'sh-surface'],
  ['sh-text-on-accent', 'sh-accent'],
];

const HEX = /#[0-9a-fA-F]{3,8}\b/;

const tokens = readFileSync(TOKENS_FILE, 'utf8');

function tokenValue(name) {
  const match = new RegExp('--' + name + ':\\s*(#[0-9a-fA-F]{6})\\s*;').exec(tokens);
  if (!match) {
    throw new Error('Token --' + name + ' introuvable ou non hexadécimal dans ' + TOKENS_FILE);
  }
  return match[1];
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground, background) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      yield* walk(path);
    } else if (path.endsWith('.scss')) {
      yield path;
    }
  }
}

const failures = [];

for (const [foreground, background] of PAIRS) {
  const ratio = contrast(tokenValue(foreground), tokenValue(background));
  if (ratio < MIN_CONTRAST) {
    failures.push(
      '--' +
        foreground +
        ' sur --' +
        background +
        ' : ' +
        ratio.toFixed(2) +
        ':1 (minimum ' +
        MIN_CONTRAST +
        ':1)',
    );
  }
}

for (const file of walk(COMPONENTS_DIR)) {
  if (HEX.test(readFileSync(file, 'utf8'))) {
    failures.push('valeur hexadécimale dans ' + relative('.', file) + ' (utiliser un token)');
  }
}

if (failures.length > 0) {
  console.error(failures.map((line) => '✘ ' + line).join('\n'));
  process.exit(1);
}
console.log(
  '✔ thème : ' +
    PAIRS.length +
    ' paires de contraste ≥ ' +
    MIN_CONTRAST +
    ':1, aucun hexadécimal hors tokens',
);
