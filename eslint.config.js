// eslint.config.js
import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vuePlugin from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

const browserGlobals = {
    window: 'readonly',
    console: 'readonly',
    localStorage: 'readonly',
    setTimeout: 'readonly',
    clearTimeout: 'readonly',
    setInterval: 'readonly',
    clearInterval: 'readonly',
    document: 'readonly',
    alert: 'readonly',
    confirm: 'readonly',
    FormData: 'readonly',
    FileReader: 'readonly',
    Image: 'readonly',
    KeyboardEvent: 'readonly'
}

export default [
    {
        files: ['**/*.vue'],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tsParser,
                ecmaVersion: 2020,
                sourceType: 'module'
            },
            globals: browserGlobals
        },
        plugins: {
            vue: vuePlugin
        },
        rules: {
            ...vuePlugin.configs.recommended.rules
        }
    },
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2020,
            sourceType: 'module',
            globals: browserGlobals
        },
        plugins: {
            '@typescript-eslint': tseslint
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': 'off'
        }
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            globals: browserGlobals
        },
        rules: {
            ...js.configs.recommended.rules
        }
    }
]
