/**
 * @fileOverview Central Genkit initialization.
 *
 * This file should be imported by all other Genkit-related files
 * to ensure that the same Genkit instance is used throughout the
 * application.
 */
'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
  // Log developer-friendly errors
  telemetry: {
    instrumentation: {
      enabled: true,
      logLevel: 'error',
    },
    // Don't send telemetry for local dev
    enabled: false,
  },
});
