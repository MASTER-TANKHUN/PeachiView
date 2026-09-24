/**
 * GET /api/latest.json — the channel's newest uploads, fetched live on Vercel and cached at the edge.
 * YouTube's RSS feeds are gone, so this reads the public /videos page (no API key needed).
 * If YOUTUBE_API_KEY is set, the official Data API is used instead.
 */
import type { APIRoute } from 'astro';

export const prerender = false;

const HANDLE = '@PeachiView249';
const UPLOADS = 'UUEk6QSUJhVf56A_VznMpKpg';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';

interface Latest { id: string; title: string; date: string; kind: 'video'; views: number; length: string; cats: string[]; era: 'v3' }

const json = (body: unknown, status = 200, maxAge = 3600) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=300, s-maxage=${maxAge}, stale-while-revalidate=86400`,
    },
  });

/** "3 days ago" → ISO date (approximate, only used for sorting / NEW badges) */
function agoToDate(text: string): string {
  const m = /(\d+)\s+(second|minute|hour|day|week|month|year)/i.exec(text);
  const d = new Date();
  if (m) {
    const n = Number(m[1]);
    const unit = m[2].toLowerCase();
    const days = { second: 0, minute: 0, hour: 0, day: 1, week: 7, month: 30, year: 365 }[unit] ?? 0;
    d.setUTCDate(d.getUTCDate() - n * days);
  }
  return d.toISOString().slice(0, 10);
}

function walk(o: unknown, key: string, out: unknown[] = []): unknown[] {
  if (Array.isArray(o)) o.forEach((v) => walk(v, key, out));
  else if (o && typeof o === 'object') {
    for (const [k, v] of Object.entries(o)) {
      if (k === key) out.push(v);
      walk(v, key, out);
    }
  }
  return out;
}

async function fromPage(): Promise<Latest[]> {
  const res = await fetch(`https://www.youtube.com/${HANDLE}/videos?hl=en&gl=TH`, {
    headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9', 'accept-encoding': 'identity', cookie: 'CONSENT=YES+1; SOCS=CAI' },
  });
  const html = await res.text();
  const m = /var ytInitialData = (\{.*?\});<\/script>/s.exec(html);
  if (!m) throw new Error(`no initial data (status ${res.status}, ${html.length} bytes)`);
  const data = JSON.parse(m[1]);
  return (walk(data, 'lockupViewModel') as Record<string, any>[])
    .filter((v) => v.contentId)
    .slice(0, 12)
    .map((v) => {
      const meta = v.metadata?.lockupMetadataViewModel;
      const parts = (walk(meta?.metadata ?? {}, 'metadataParts')[0] as { text?: { content?: string } }[] | undefined) ?? [];
      const texts = parts.map((p) => p.text?.content ?? '');
      const badge = (walk(v.contentImage ?? {}, 'thumbnailBadgeViewModel')[0] as { text?: string } | undefined)?.text ?? '';
      const views = Number((texts.find((t) => /view/i.test(t)) ?? '').replace(/[^\d.KM]/gi, '').replace(/K/i, 'e3').replace(/M/i, 'e6')) || 0;
      return {
        id: v.contentId as string,
        title: (meta?.title?.content as string) ?? '',
        date: agoToDate(texts.find((t) => /ago/i.test(t)) ?? ''),
        kind: 'video' as const,
        views: Math.round(views),
        length: badge,
        cats: ['talk'],
        era: 'v3' as const,
      };
    });
}

async function fromApi(key: string): Promise<Latest[]> {
  const u = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=12&playlistId=${UPLOADS}&key=${key}`;
  const r = await fetch(u);
  if (!r.ok) throw new Error(`api ${r.status}`);
  const d = (await r.json()) as { items: { contentDetails: { videoId: string; videoPublishedAt: string }; snippet: { title: string } }[] };
  return d.items.map((i) => ({
    id: i.contentDetails.videoId, title: i.snippet.title, date: i.contentDetails.videoPublishedAt.slice(0, 10),
    kind: 'video' as const, views: 0, length: '', cats: ['talk'], era: 'v3' as const,
  }));
}

export const GET: APIRoute = async () => {
  try {
    const key = import.meta.env.YOUTUBE_API_KEY as string | undefined;
    const videos = key ? await fromApi(key) : await fromPage();
    return json({ ok: true, videos });
  } catch (err) {
    return json({ ok: false, videos: [], error: String(err) }, 200, 300);
  }
};
