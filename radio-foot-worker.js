// ============================================================
//  Cloudflare Worker — proxy CORS pour football-data.org
//  Colle ce code dans ton Worker, puis "Deploy".
//  Ta cle API reste cachee ici (cote serveur), invisible au public.
// ============================================================

export default {
  async fetch(request) {
    // Reponse au preflight CORS du navigateur
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*'
        }
      });
    }

    // On reconstruit l'URL cible : tout ce qui vient apres le domaine
    // du worker est renvoye tel quel vers football-data.org
    const url = new URL(request.url);
    const target = 'https://api.football-data.org' + url.pathname + url.search;

    // Appel cote serveur (pas de blocage CORS ici) avec TA cle
    const upstream = await fetch(target, {
      headers: { 'X-Auth-Token': '4b4e5fc41d0e4f1c81a87c5ff9579eef' }
    });

    const body = await upstream.text();

    // On renvoie au navigateur AVEC l'en-tete CORS
    return new Response(body, {
      status: upstream.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
