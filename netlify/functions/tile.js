// Relaie les tuiles MapTiler via notre propre domaine (même origine côté navigateur).
// Pourquoi : les navigateurs avec protection anti-tracking (ex: "Empêcher le suivi
// intersite" sur Safari) bloquent silencieusement les requêtes tierces vers
// api.maptiler.com (Cloudflare y pose un cookie de protection anti-bot, ce qui la
// fait ressembler à un traceur). En passant par /tiles/:z/:x/:y sur notre propre
// domaine, la requête n'est plus cross-site du point de vue du téléphone.
// Bonus : la clé API MapTiler reste côté serveur (variable d'env MAPTILER_KEY),
// elle n'apparaît plus jamais dans le code envoyé au navigateur.

exports.handler = async (event) => {
  const { z, x, y } = event.queryStringParameters || {};
  if (!/^[0-9]{1,2}$/.test(z) || !/^[0-9]{1,7}$/.test(x) || !/^[0-9]{1,7}$/.test(y)) {
    return { statusCode: 400, body: 'Invalid tile coordinates' };
  }

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
