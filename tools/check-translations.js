// Comprueba que todos los idiomas tienen los mismos textos que el español.
// Uso: node tools/check-translations.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'i18n.js'), 'utf8') + '\nthis.LANGUAGES = LANGUAGES; this.STRINGS = STRINGS;', ctx);
for (const lang of ctx.LANGUAGES) {
  vm.runInContext(fs.readFileSync(path.join(root, 'lang', lang + '.js'), 'utf8'), ctx);
}

const placeholders = (s) => JSON.stringify(s).match(/\{\w+\}/g)?.sort().join(' ') || '';
const ref = ctx.STRINGS.es;
let problems = 0;
const report = (lang, msg) => { problems++; console.log(`${lang}: ${msg}`); };

for (const lang of ctx.LANGUAGES) {
  const table = ctx.STRINGS[lang];
  if (!table) { report(lang, 'falta el archivo lang/' + lang + '.js'); continue; }
  for (const key of Object.keys(ref)) {
    if (!(key in table)) { report(lang, `falta «${key}»`); continue; }
    const a = ref[key];
    const b = table[key];
    if (Array.isArray(a) && (!Array.isArray(b) || a.length !== b.length)) report(lang, `«${key}» debe tener ${a.length} elementos`);
    if (typeof a === 'object' && !Array.isArray(a) && typeof b === 'object' && !('other' in b)) report(lang, `«${key}» necesita la forma «other»`);
    if (typeof a === 'string' && !key.startsWith('format.') && placeholders(a) !== placeholders(b)) report(lang, `«${key}» no tiene los mismos huecos que en español (${placeholders(a)})`);
  }
  for (const key of Object.keys(table)) {
    if (!(key in ref)) report(lang, `«${key}» sobra (no existe en español)`);
  }
}

console.log(problems ? `\n${problems} problemas` : `Todo correcto: ${ctx.LANGUAGES.length} idiomas, ${Object.keys(ref).length} textos cada uno.`);
process.exit(problems ? 1 : 0);
