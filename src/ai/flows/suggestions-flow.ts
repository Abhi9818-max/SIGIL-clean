
'use server';
/**
 * @fileOverview An AI flow to generate performance suggestions for the user.
 *
 * - generateSuggestions - Generates a helpful suggestion.
 * - SuggestionsInput - The input type for the suggestion generation function.
 * - SuggestionsOutput - The return type for the suggestion generation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SuggestionsInputSchema = z.object({
  level: z.number().describe('The user\'s current level.'),
  levelName: z.string().describe('The name of the user\'s current level.'),
  tasks: z.string().describe('A JSON string of all task definitions.'),
  records: z.string().describe('A JSON string of the user\'s recent record entries.'),
});
export type SuggestionsInput = z.infer<typeof SuggestionsInputSchema>;

const SuggestionsOutputSchema = z.object({
  suggestion: z.string().describe('A single, concise, and actionable suggestion for the user based on their recent activity. The tone should be like a wise and slightly mysterious coach.'),
});
export type SuggestionsOutput = z.infer<typeof SuggestionsOutputSchema>;


export async function generateSuggestions(input: SuggestionsInput): Promise<SuggestionsOutput> {
  return suggestionsFlow(input);
}

const suggestionsPrompt = ai.definePrompt({
  name: 'suggestionsPrompt',
  input: { schema: SuggestionsInputSchema },
  output: { schema: SuggestionsOutputSchema },
  prompt: `
    You are a Performance Coach for the S.I.G.I.L. system. Your tone is wise, encouraging, but slightly mysterious. You provide concise, actionable advice.

    Analyze the user's current status and recent records to give them one single, powerful suggestion to help them improve or reflect.

    - Look at their tasks. Is one being neglected?
    - Look at their records. Is there a pattern? A lack of consistency? A recent achievement to build on?
    - Look at their level. Are they new, or a veteran? Tailor your advice.

    Current User Status:
    - Level: {{level}} (Title: {{levelName}})
    - Defined Tasks: {{{tasks}}}
    - Recent Records: {{{records}}}

    Generate a single, actionable suggestion.
  `,
});

const suggestionsFlow = ai.defineFlow(
  {
    name: 'suggestionsFlow',
    inputSchema: SuggestionsInputSchema,
    outputSchema: SuggestionsOutputSchema,
  },
  async (input) => {
    const llmResponse = await ai.generate({
        prompt: suggestionsPrompt.prompt,
        model: 'googleai/gemini-pro',
        input,
        output: {
            schema: SuggestionsOutputSchema,
        },
    });

    const output = llmResponse.output;
    if (!output) {
      throw new Error("The AI failed to generate a suggestion. The output was empty.");
    }
    return output;
  }
);
