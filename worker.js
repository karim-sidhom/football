/* ============================================================
   PROXY football-data.org  —  Cloudflare Worker (gratuit)
   ------------------------------------------------------------
   Pourquoi : football-data.org bloque le CORS navigateur et
   exige un token secret => on ne peut pas l'appeler directement
   depuis un fichier HTML. Ce worker garde le token cote serveur
   et renvoie les donnees avec les en-tetes CORS ouverts.

   DEPLOIEMENT (3 min, 100% gratuit) :
   1) dash.cloudflare.com  ->  Workers & Pages  ->  Create  ->  Worker
   2) Donne-lui un nom (ex: radio-foot)  ->  Deploy
   3) "Edit code", colle TOUT ce fichier, puis "Deploy"
   4) Copie l'URL  (ex: https://radio-foot.toncompte.workers.dev)
      et colle-la dans WORKER_URL de radio-foot__8_.html

   Routes exposees :
     /standings/PL        ->  classement actuel
     /matches/PL          ->  matchs de la saison en cours
   Ligues : PL PD SA BL1 FL1
   ============================================================ */

const TOKEN = "4b4e5fc41d0e4f1c81a87c5ff9579eef"; // ton token football-data.org

// Mets ici tes domaines pour verrouiller, ou "*" pour autoriser tout le monde
const ALLOW_ORIGIN = "*";

const CORS = {
  "Access-Control-Allow-Origin": ALLOW_ORIGIN,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

const VALID_RESOURCES = ["standings", "matches"];
const VALID_LEAGUES = ["PL", "PD", "SA", "BL1", "FL1"];

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean); // [resource, league]
    const resource = parts[0];
    const league = parts[1];

    if (!VALID_RESOURCES.includes(resource) || !VALID_LEAGUES.includes(league)) {
      return json(
        { error: "Utilise /standings/PL ou /matches/PL (PL PD SA BL1 FL1)" },
        400
      );
    }

    const target =
      "https://api.football-data.org/v4/competitions/" + league + "/" + resource;

    try {
      const upstream = await fetch(target, {
        headers: { "X-Auth-Token": TOKEN },
      });
      const body = await upstream.text();
      return new Response(body, {
        status: upstream.status,
        headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
      });
    } catch (e) {
      return json({ error: "upstream_failed", detail: String(e) }, 502);
    }
  },
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
  });
}
