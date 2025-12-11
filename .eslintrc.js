module.exports = {
  root: true,

  // Global environments
  env: {
    node: true,
    es2021: true,
    jest: true,
  },

  // Base rules
  extends: [
    'eslint:recommended',
    'prettier',
  ],

  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },

  // Global rules (backend rules)
  rules: {
    // Backend only strict rules
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',

    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-undef': 'error',

    'prefer-const': 'warn',
    'no-var': 'error',
    'object-shorthand': 'warn',
    'prefer-arrow-callback': 'warn',

    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],

    // Security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
  },

  // -------------------------------
  // React / Frontend Overrides
  // -------------------------------
  overrides: [
    {
      files: ['client/**/*.{js,jsx,ts,tsx}'],
      env: {
        browser: true,
        es2021: true,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      plugins: ['react', 'react-hooks'],
      settings: {
        react: {
          version: 'detect',
        },
      },
      rules: {
        // Allow window, navigator, localStorage
        'no-undef': 'off',

        // Stop complaining about unused vars in React
        'no-unused-vars': 'warn',

        // Allow console in frontend
        'no-console': 'off',

        // JSX usage helpers
        'react/jsx-uses-react': 'warn',
        'react/jsx-uses-vars': 'warn',
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',

        // Hooks best practices
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
      },
    },

    // Test files
    {
      files: ['tests/**/*.js'],
      env: {
        jest: true,
        node: true,
      },
      rules: {
        'no-unused-vars': 'off',
      },
    },
  ],

  // Ignore heavy folders
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    'client/dist/',
    'uploads/',
    'temp/',

    '*.min.js',
  ],
};
