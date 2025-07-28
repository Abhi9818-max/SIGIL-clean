/**
 * @fileOverview Central Genkit initialization.
 *
 * This file should be imported by all other Genkit-related files
 * to ensure that the same Genkit instance is used throughout the
 * application.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {defineDotprompt} from 'genkit/dotprompt';
import *as path from 'path';

require('dotenv').config({path: path.resolve(__dirname, '../.env')});

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
    defineDotprompt({
      prompt: {
        model: 'googleai/gemini-pro',
        input: {
          schema: {
            description: 'The user\'s prompt.',
          },
        },
      },
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
