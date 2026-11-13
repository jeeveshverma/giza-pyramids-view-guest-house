import type { APIRoute } from 'astro';
import { CONTENT } from '../../data/content';

/** The content the site was built from. The dashboard reads `updated` here to know its save is live. */
export const GET: APIRoute = () => new Response(JSON.stringify(CONTENT), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
