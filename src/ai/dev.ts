/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,

 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// This file is for local development only.
// It is used to run the Genkit AI flows in a local server.
//
// To run this:
// 1. `npm install`
// 2. `npm run genkit:dev` in a separate terminal
//
// You will need to be logged into gcloud with `gcloud auth application-default login`

import {googleAI} from '@genkit-ai/googleai';
import {genkit} from 'genkit';
import * as path from 'path';

require('dotenv').config({path: path.resolve(__dirname, '../../.env')});

genkit({
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
