import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '../..');

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '__tests__') sourceFiles(full, out);
    } else if (/\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/** Remove comentários para os guardas olharem só código. */
function code(file: string): string {
  return fs
    .readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

const files = sourceFiles(SRC);

describe('guardas de design', () => {
  it('encontra os arquivos do app', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it('não usa fontWeight (com a fonte Inter no Android, use fontFamily: fonts.*)', () => {
    const offenders = files.filter((f) => /fontWeight\s*:/.test(code(f)));
    expect(offenders.map((f) => path.relative(SRC, f))).toEqual([]);
  });

  it('não usa emoji como ícone nas telas e componentes (.tsx)', () => {
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{FE0F}]/u;
    const offenders = files.filter((f) => f.endsWith('.tsx') && emoji.test(code(f)));
    expect(offenders.map((f) => path.relative(SRC, f))).toEqual([]);
  });

  it('só usa fontes do tema (Inter 400/500/600)', () => {
    const offenders = files.filter(
      (f) => /fontFamily:\s*['"]/.test(code(f)) && !f.includes('typography.ts'),
    );
    expect(offenders.map((f) => path.relative(SRC, f))).toEqual([]);
  });
});
