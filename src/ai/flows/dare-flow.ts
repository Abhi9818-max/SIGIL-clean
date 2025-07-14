
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
  dare: z.string().describe('A single, actionable, friendly, and slightly funny dare for the user to complete. It should be a simple task that can be reasonably completed, like "sketch a mythical creature" or "write a three-line poem about a forgotten king".'),
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
    - Actionable and simple (can be done in 5-15 minutes).
    - Friendly and a little bit funny, not a real punishment.
    - Thematically related to fantasy, myth, or personal growth.

    DO NOT make the dare about the specific task they failed. Instead, make it a creative or mindful activity.

    User's Level: {{level}}
    {{#if isGlobalStreak}}
    The user broke their overall daily consistency streak.
    {{else}}
    The user broke their "Dark Streak" for the task: "{{taskName}}".
    {{/if}}

    Example Dares:
    - "The archives demand a tribute! Write a three-line poem about a forgotten king."
    - "A moment of creation is required. Spend 5 minutes sketching a mythical creature from memory."
    - "Your mind must be cleared. Listen to one new song with your eyes closed and describe the world it creates."
    - "Whisper a secret to a houseplant. If you have no houseplant, a pet or an inanimate object will suffice."

    Generate one, single dare for the user.
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
