
'use server';
/**
 * @fileOverview An AI flow to generate a redemption dare for a user.
 *
 * - generateDare - Generates a short, thematic, and friendly dare.
 * - DareInput - The input type for the dare generation function.
 * - DareOutput - The return type for the dare generation function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

const DareInputSchema = z.object({
  level: z.number().describe("The user's current level."),
  taskName: z.string().describe("The name of the task for which the streak was broken."),
  isGlobalStreak: z.boolean().describe("Whether this dare is for a global consistency breach or a specific task's Dark Streak."),
});
export type DareInput = z.infer<typeof DareInputSchema>;

const DareOutputSchema = z.object({
  dare: z.string().describe('A single, actionable, and thematic dare, 1-2 sentences max. The tone should be slightly mysterious and evocative, like a quest from a spirit. Examples: "Sketch a mythical creature from memory" or "Write a three-line poem about a forgotten king."'),
});
export type DareOutput = z.infer<typeof DareOutputSchema>;


export async function generateDare(input: DareInput): Promise<DareOutput> {
  return dareFlow(input);
}

const darePrompt = ai.definePrompt({
  name: 'darePrompt',
  model: googleAI.model('gemini-1.5-flash'),
  input: { schema: DareInputSchema },
  output: { schema: DareOutputSchema },
  prompt: `
    You are a friendly, slightly mischievous spirit within the S.I.G.I.L. system. A user has faltered on their path. Your role is to give them a fun, simple, and thematic "dare" to get them back on track.

    The dare should be:
    - A single, short, actionable sentence.
    - Thematically related to fantasy, myth, or personal growth, delivered with a mysterious tone.
    - A simple task (5-15 minutes), not a real punishment.
    - Creative or mindful, NOT related to the specific task they failed.

    User's Level: {{level}}
    {{#if isGlobalStreak}}
    The user broke their overall daily consistency streak.
    {{else}}
    The user broke their "Dark Streak" for the task: "{{taskName}}".
    {{/if}}

    Example Dares:
    - "The archives demand a tribute. Write a three-line poem about a forgotten king."
    - "A moment of creation is required. Spend 5 minutes sketching a mythical creature from memory."
    - "Your mind must be cleared. Listen to one new song with your eyes closed and describe the world it creates."
    - "Whisper a secret to a houseplant. If you have no houseplant, a pet or an inanimate object will suffice."
    - "Find the oldest object in your room and write down one sentence about its imagined history."

    Generate one, single, concise dare for the user.
  `,
});

const dareFlow = ai.defineFlow(
  {
    name: 'dareFlow',
    inputSchema: DareInputSchema,
    outputSchema: DareOutputSchema,
  },
  async (input) => {
    const { output } = await darePrompt(input);
    if (!output) {
      throw new Error("The AI failed to generate a dare. The output was empty.");
    }
    return output;
  }
);
