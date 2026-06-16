import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // The data-fetching hooks in this app use the standard
      // "loading flag + setState on resolve" idiom (no React Query/SWR),
      // which this rule flags even though it's safe and not cascading.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    // shadcn/ui-style primitive files and context providers intentionally
    // co-export small helpers/hooks alongside their component.
    files: ['src/components/ui/**/*.tsx', 'src/context/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
