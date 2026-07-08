// Relaie les tuiles MapTiler via notre propre domaine (même origine côté navigateur).
// Pourquoi : les navigateurs avec protection anti-tracking (ex: "Empêcher le suivi
// intersite" sur Safari) bloquent silencieusement les requêtes tierces vers
// api.maptiler.com (Cloudflare y pose un cookie de protection anti-bot, ce qui la
// fait ressembler à un traceur). En passant par /tiles/:z/:x/:y sur notre propre
// domaine, la requête n'est plus cross-site du point de vue du téléphone.
// Bonus : la clé API MapTiler reste côté serveur (variable d'env MAPTILER_KEY),
// elle n'apparaît plus jamais dans le code envoyé au navigateur.

exports.handler = async (event) => {
  // event.path est le chemin original demandé par le navigateur (/tiles/16/33510/21975),
  // pas celui de la fonction — plus fiable que de faire transiter z/x/y par des
  // placeholders de redirection Netlify, qui n'arrivaient pas correctement en query string.
  const m = event.path.match(/(\d{1,2})\/(\d{1,7})\/(\d{1,7})\/?$/);
  if (!m) {
    return { statusCode: 400, body: 'Invalid tile coordinates: ' + event.path };
  }
  const [, z, x, y] = m;

  const key = process.env.MAPTILER_KEY;
  if (!key) {
    return { statusCode: 500, body: 'Server misconfigured: MAPTILER_KEY env var missing' };
  }

  const url = `https://api.maptiler.com/maps/hybrid/${z}/${x}/${y}.jpg?key=${key}`;
  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    return { statusCode: 502, body: 'Upstream fetch failed: ' + e.message };
  }
  if (!res.ok) {
    return { statusCode: res.status, body: 'Upstream tile error' };
  }

  const buf = Buffer.from(await res.arrayBuffer());
  return {
    statusCode: 200,
    headers: {
      'Content-Type': res.headers.get('content-type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
    },
    body: buf.toString('base64'),
    isBase64Encoded: true,
  };
};
