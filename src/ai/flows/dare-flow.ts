
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
  dare: z.string().describe('A single, actionable, and simple real-world dare, 1-2 sentences max. The tone should be slightly mysterious and mischievous, like a quest from a spirit, but the action should be easy and quick (under 5 minutes). Examples: "Text a friend a compliment out of the blue" or "Go outside, close your eyes, and listen for 60 seconds."'),
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
    - A simple real-world task that takes 5 minutes or less. It should be fun and easy, not a punishment.
    - Examples of good actions: a small physical activity, sending a text, a moment of mindfulness, interacting with an object in a funny way.
    - The tone should be delivered like a mysterious quest, but the action itself must be simple.

    User's Level: {{level}}
    {{#if isGlobalStreak}}
    The user broke their overall daily consistency streak.
    {{else}}
    The user broke their "Dark Streak" for the task: "{{taskName}}".
    {{/if}}

    Example Dares:
    - "The currents of fate must be stirred. Text a friend a compliment you've never given them."
    - "A moment of creation is required. Spend 5 minutes sketching a mythical creature from memory."
    - "Your mind must be cleared. Go outside, close your eyes, and just listen for one full minute."
    - "Whisper a secret to a houseplant. If you have no houseplant, a pet or an inanimate object will suffice."
    - "Find the oldest object in your room and write down one sentence about its imagined history."
    - "Animate the inanimate. Give a name to the closest object to your left."

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
