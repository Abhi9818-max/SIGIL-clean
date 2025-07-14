
'use server';
/**
 * @fileOverview An AI flow to generate a personal sigil/emblem image.
 *
 * - generateSigil - Generates an image for a user's sigil.
 * - SigilInput - The input type for the sigil generation function.
 * - SigilOutput - The return type for the sigil generation function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

const SigilInputSchema = z.object({
  levelName: z.string().describe('The name of the user\'s current level (e.g., "Ashborn", "Vow Eater").'),
  tierName: z.string().describe('The name of the user\'s current tier (e.g., "Unknown Blades", "Silent Names").'),
});
export type SigilInput = z.infer<typeof SigilInputSchema>;

const SigilOutputSchema = z.object({
  imageUrl: z.string().describe("The data URI of the generated image. Expected format: 'data:image/png;base64,<encoded_data>'."),
});
export type SigilOutput = z.infer<typeof SigilOutputSchema>;


export async function generateSigil(input: SigilInput): Promise<SigilOutput> {
  return sigilFlow(input);
}

const sigilFlow = ai.defineFlow(
  {
    name: 'sigilFlow',
    inputSchema: SigilInputSchema,
    outputSchema: SigilOutputSchema,
  },
  async (input) => {
    
    const prompt = `Generate a dark fantasy sigil, a powerful emblem for a warrior known as '${input.levelName}' of the '${input.tierName}'.
    The style should be an intricate, ancient, carved stone emblem. The design should be circular, with a central icon that represents the level name, surrounded by details reflecting the tier.
    It should be monochrome, like etched stone or metal, with deep shadows and high contrast. The background should be transparent or neutral gray.`;
    
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
      throw new Error("The AI failed to generate a sigil image.");
    }

    return { imageUrl: media.url };
  }
);
