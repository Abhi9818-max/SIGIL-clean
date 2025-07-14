
'use server';
/**
 * @fileOverview An AI flow to generate a summary for a shareable "Echo" card.
 *
 * - generateEcho - Generates a short, thematic summary of recent progress.
 * - EchoInput - The input type for the echo generation function.
 * - EchoOutput - The return type for the echo generation function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

const EchoInputSchema = z.object({
  levelName: z.string().describe('The user\'s current level title (e.g., "Ashborn").'),
  tierName: z.string().describe('The name of the user\'s current tier (e.g., "Unknown Blades").'),
  recentRecords: z.string().describe('A JSON string of the user\'s recent record entries.'),
});
export type EchoInput = z.infer<typeof EchoInputSchema>;

const EchoOutputSchema = z.object({
  summary: z.string().describe('A one-sentence, poetic, and dark-fantasy summary of the user\'s recent activity, inspired by their title and records. It should sound like a prophecy or a line from an ancient text.'),
});
export type EchoOutput = z.infer<typeof EchoOutputSchema>;

export async function generateEcho(input: EchoInput): Promise<EchoOutput> {
  return echoFlow(input);
}

const echoPrompt = ai.definePrompt({
  name: 'echoPrompt',
  model: googleAI.model('gemini-pro'),
  input: { schema: EchoInputSchema },
  output: { schema: EchoOutputSchema },
  prompt: `
    You are the Chronicler of S.I.G.I.L., a being who observes and records deeds in a cryptic, mythic style.

    A user, known as {{levelName}} of the {{tierName}}, has performed deeds. Your task is to distill their recent actions into a single, powerful, and poetic sentence.

    Do not state what they did. Instead, hint at the nature of their efforts. For example, if they logged "Exercise" and "Work", you might write: "The echo of a will forged in both sweat and steel reverberates through the void."

    User's Recent Records:
    {{{recentRecords}}}

    Generate one single, evocative sentence that captures the essence of their recent journey.
  `,
});

const echoFlow = ai.defineFlow(
  {
    name: 'echoFlow',
    inputSchema: EchoInputSchema,
    outputSchema: EchoOutputSchema,
  },
  async (input) => {
    const { output } = await echoPrompt(input);
    if (!output) {
      throw new Error("The AI Chronicler fell silent and failed to generate an echo.");
    }
    return output;
  }
);
