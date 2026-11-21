import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://gizapyramidsviewguesthouse.com',
  base: '/',
  trailingSlash: 'always',
  build: { format: 'directory', assets: '_gp', inlineStylesheets: 'always' },
  compressHTML: true,
  devToolbar: { enabled: false },
  image: { responsiveStyles: false },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
