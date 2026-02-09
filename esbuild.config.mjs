import esbuild from 'esbuild';
import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = process.argv.includes('--dev');
const outdir = join(__dirname, 'dist');

if (!existsSync(outdir)) {
  mkdirSync(outdir, { recursive: true });
}

// Copy index.html to dist
copyFileSync(
  join(__dirname, 'src', 'index.html'),
  join(outdir, 'index.html')
);

const buildOptions = {
  entryPoints: [join(__dirname, 'src', 'index.ts')],
  bundle: true,
  outfile: join(outdir, 'bundle.js'),
  format: 'iife',
  sourcemap: true,
  target: 'es2020',
  logLevel: 'info',
};

if (isDev) {
  const ctx = await esbuild.context(buildOptions);
  const { host, port } = await ctx.serve({
    servedir: outdir,
    port: 3000,
  });
  console.log(`Dev server running at http://localhost:${port}`);
} else {
  await esbuild.build({
    ...buildOptions,
    minify: true,
  });
  console.log('Build complete: dist/');
}
