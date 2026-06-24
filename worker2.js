/* ============================================================
   PROXY football-data.org  —  Cloudflare Worker v2 (gratuit)
   ------------------------------------------------------------
   Garde le token cote serveur + ajoute le CORS pour le navigateur.

   DEPLOIEMENT (3 min) :
   1) dash.cloudflare.com -> Workers & Pages -> Create -> Worker
   2) Nomme-le (ex: radio-foot) -> Deploy
   3) "Edit code", colle TOUT ce fichier, "Deploy"
   4) Copie l'URL et colle-la dans WORKER_URL de radio-foot__9_.html

   Routes :
     /standings/PL     -> classement actuel
     /matches/PL       -> matchs de la saison en cours
     /team/86          -> details d'un club (fondation, stade, couleurs...)
   Ligues : PL PD SA BL1 FL1
   ============================================================ */

const TOKEN = "4b4e5fc41d0e4f1c81a87c5ff9579eef"; // ton token football-data.org

const ALLOW_ORIGIN = "*"; // mets tes domaines pour verrouiller, ou "*" pour tout

const CORS = {
  "Access-Control-Allow-Origin": ALLOW_ORIGIN,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

const VALID_LEAGUES = ["PL", "PD", "SA", "BL1", "FL1"];

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean); // [resource, param]
    const resource = parts[0];
    const param = parts[1];

    let target = null;

    if (resource === "standings" || resource === "matches") {
      if (!VALID_LEAGUES.includes(param)) {
        return json({ error: "Ligue invalide. Utilise PL PD SA BL1 FL1" }, 400);
      }
      target = "https://api.football-data.org/v4/competitions/" + param + "/" + resource;
    } else if (resource === "team") {
      if (!/^\d+$/.test(param || "")) {
        return json({ error: "ID equipe invalide. Ex: /team/86" }, 400);
      }
      target = "https://api.football-data.org/v4/teams/" + param;
    } else {
      return json({ error: "Routes: /standings/PL  /matches/PL  /team/{id}" }, 400);
    }

    try {
      const upstream = await fetch(target, { headers: { "X-Auth-Token": TOKEN } });
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
