import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tokensPath = resolve(__dirname, '../src/styles/tokens.json');
const outputPath = resolve(__dirname, '../src/styles/tokens.css');

const tokens = JSON.parse(readFileSync(tokensPath, 'utf-8'));

const lines = [
  '/**',
  ' * AUTO-GENERATED DESIGN TOKENS — DO NOT EDIT DIRECTLY',
  ' * Generated from tokens.json',
  ' */',
  '',
  ':root {'
];

// Typography
lines.push('  /* Typography - Fonts */');
for (const [key, val] of Object.entries(tokens.typography.fonts)) {
  lines.push(`  --font-${key}: ${val};`);
}

lines.push('\n  /* Typography - Font Sizes */');
for (const [key, val] of Object.entries(tokens.typography.fontSizes)) {
  lines.push(`  --text-${key}: ${val};`);
}

lines.push('\n  /* Typography - Font Weights */');
for (const [key, val] of Object.entries(tokens.typography.fontWeights)) {
  lines.push(`  --font-weight-${key}: ${val};`);
}

lines.push('\n  /* Typography - Line Heights */');
for (const [key, val] of Object.entries(tokens.typography.lineHeights)) {
  lines.push(`  --leading-${key}: ${val};`);
}

lines.push('\n  /* Typography - Letter Spacings */');
for (const [key, val] of Object.entries(tokens.typography.letterSpacings)) {
  lines.push(`  --tracking-${key}: ${val};`);
}

// Spacing
lines.push('\n  /* Spacing */');
for (const [key, val] of Object.entries(tokens.spacing)) {
  lines.push(`  --space-${key}: ${val};`);
}

// Radii
lines.push('\n  /* Radii */');
for (const [key, val] of Object.entries(tokens.radii)) {
  lines.push(`  --radius-${key}: ${val};`);
}

// Default to light theme in :root
lines.push('\n  /* Default theme values (Light - Ink & Blue) */');
for (const [key, val] of Object.entries(tokens.themes.light.colors)) {
  lines.push(`  --color-${key}: ${val};`);
}
lines.push('}');

// Explicit light theme
lines.push('\n[data-theme="light"] {');
for (const [key, val] of Object.entries(tokens.themes.light.colors)) {
  lines.push(`  --color-${key}: ${val};`);
}
lines.push('}');

// Dark theme
lines.push('\n[data-theme="dark"] {');
for (const [key, val] of Object.entries(tokens.themes.dark.colors)) {
  lines.push(`  --color-${key}: ${val};`);
}
lines.push('}');

// Journey theme
lines.push('\n[data-theme="journey"] {');
for (const [key, val] of Object.entries(tokens.themes.journey.colors)) {
  lines.push(`  --color-${key}: ${val};`);
}
lines.push('}');

writeFileSync(outputPath, lines.join('\n') + '\n', 'utf-8');
console.log(`Successfully generated CSS variables at: ${outputPath}`);
