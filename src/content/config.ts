import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		type: z.string().default('Blog'),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string(),
		tag: z.string().default('coding'),
		status: z.enum(['draft', 'published']).default('draft'),
	}),
});

export const collections = { blog };
