
'use server';
/**
 * @fileOverview An AI flow to generate lore entries based on user progress.
 *
 * - generateLore - Generates a short story/lore entry.
 * - LoreInput - The input type for the lore generation function.
 * - LoreOutput - The return type for the lore generation function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

const LoreInputSchema = z.object({
  level: z.number().describe('The user\'s current level.'),
  levelName: z.string().describe('The name of the user\'s current level (e.g., "Ashborn", "Vow Eater").'),
  tierName: z.string().describe('The name of the user\'s current tier (e.g., "Unknown Blades", "Silent Names").'),
  tasks: z.string().describe('A JSON string of all task definitions.'),
  records: z.string().describe('A JSON string of the user\'s recent record entries.'),
});
export type LoreInput = z.infer<typeof LoreInputSchema>;

const LoreOutputSchema = z.object({
  title: z.string().describe('A short, evocative title for the lore entry.'),
  story: z.string().describe('A short story or lore entry, 2-4 paragraphs long, written in a dark, mythic, and slightly poetic style. It should be inspired by the user\'s progress but feel like a fragment of a larger, mysterious history.'),
});
export type LoreOutput = z.infer<typeof LoreOutputSchema>;


export async function generateLore(input: LoreInput): Promise<LoreOutput> {
  return loreFlow(input);
}

const lorePrompt = ai.definePrompt({
  name: 'lorePrompt',
  input: { schema: LoreInputSchema },
  output: { schema: LoreOutputSchema },
  prompt: `
    You are the Lorekeeper for S.I.G.I.L., a system of tracking one's growth. Your writing style is mythic, dark, and poetic, reminiscent of souls-like games (Dark Souls, Elden Ring) and dark fantasy. You write short, evocative fragments of a larger, mysterious history.

    The user has provided their current status. Your task is to write a new lore entry for them. The entry should be inspired by their level, level name, and recent activities, but do not mention them directly. Instead, use them as thematic inspiration.

    For example, if the user is "Level 5: Iron Howl" and has been logging "Work" and "Exercise", you could write a story about a lone warrior whose will is forged in the fires of endless labor, their cry echoing like steel on stone.

    Current User Status:
    - Level: {{level}}
    - Title: {{levelName}}
    - Tier: {{tierName}}
    - Defined Tasks: {{{tasks}}}
    - Recent Records: {{{records}}}

    Generate a new lore entry with a title and a story. The story should be 2-4 paragraphs. Make it feel ancient, powerful, and mysterious.
  `,
});

const loreFlow = ai.defineFlow(
  {
    name: 'loreFlow',
    inputSchema: LoreInputSchema,
    outputSchema: LoreOutputSchema,
  },
  async (input) => {
    const { output } = await lorePrompt(input);
    if (!output) {
      throw new Error("The AI failed to generate a lore entry. The output was empty.");
    }
    return output;
  }
);
