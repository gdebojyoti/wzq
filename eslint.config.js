import neostandard from 'neostandard'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const webFiles = ['apps/web/**/*.{js,jsx,mjs,ts,tsx}']

export default [
  {
    ignores: ['**/dist/', '**/.next/', '**/next-env.d.ts']
  },
  ...neostandard({ ts: true }),
  ...[...nextCoreWebVitals, ...nextTypescript].map(config => ({
    ...config,
    files: webFiles,
    settings: { ...config.settings, next: { rootDir: 'apps/web/' } }
  }))
]
