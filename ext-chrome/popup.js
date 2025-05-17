const API_KEY = "a95afb6fb7b3b5297397e8a618dd608b";
const API_SECRET = "c8367b4dd5b996b72d622bafed127392";
const API_URL = "https://ws.audioscrobbler.com/2.0/";

document.addEventListener("DOMContentLoaded", async () => {
  const authBtn = document.getElementById("auth-btn");
  const continuarBtn = document.getElementById("continuar-btn");
  const sortearBtn = document.getElementById("sortear");
  const logoutBtn = document.getElementById("logout-btn");
  const resultadoDiv = document.getElementById("resultado");
  const historicoDiv = document.getElementById("historico");

  verificarSessao();
  exibirHistorico();

  authBtn.addEventListener("click", async () => {
    try {
      const tokenRes = await fetch(
        `${API_URL}?method=auth.getToken&api_key=${API_KEY}&api_sig=${geraAssinatura(
          { method: "auth.getToken" }
        )}&format=json`
      );
      const tokenData = await tokenRes.json();
      const token = tokenData.token;

      if (!token) {
        alert("Erro ao obter token de autenticação.");
        return;
      }

      localStorage.setItem("lastfm_token", token);

      alert(
        "Após autorizar na aba que será aberta, volte aqui e clique em 'Já autorizei, continuar'"
      );

      window.open(
        `https://www.last.fm/api/auth/?api_key=${API_KEY}&token=${token}`,
        "_blank"
      );
    } catch (e) {
      alert("Erro ao iniciar autenticação: " + e.message);
    }
  });

  continuarBtn.addEventListener("click", async () => {
    const token = localStorage.getItem("lastfm_token");
    if (!token) {
      return alert(
        "Nenhum token encontrado. Clique em 'Vincular com Last.fm' primeiro."
      );
    }

    const sigParams = {
      method: "auth.getSession",
      api_key: API_KEY,
      token: token,
    };

    const api_sig = geraAssinatura(sigParams);

    const sessionRes = await fetch(
      `${API_URL}?method=auth.getSession&api_key=${API_KEY}&token=${token}&api_sig=${api_sig}&format=json`
    );

    const sessionData = await sessionRes.json();

    if (sessionData?.session) {
      localStorage.setItem("sessionKey", sessionData.session.key);
      localStorage.setItem("username", sessionData.session.name);
      localStorage.setItem(
        "lastfm_session",
        JSON.stringify(sessionData.session)
      );

      verificarSessao();
    } else {
      console.error("Resposta da API:", sessionData);
      alert("Erro ao autenticar com o Last.fm: " + JSON.stringify(sessionData));
    }
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    verificarSessao();
    resultadoDiv.innerText = "";
    historicoDiv.innerHTML = "";
  });

  sortearBtn.addEventListener("click", async () => {
    try {
      const username = localStorage.getItem("username");
      if (!username) throw new Error("Usuário não autenticado");

      const totalRes = await fetch(
        `${API_URL}?method=library.getArtists&user=${username}&api_key=${API_KEY}&format=json&limit=1`
      );
      const totalData = await totalRes.json();
      const totalArtists = parseInt(totalData.artists["@attr"].total, 10);

      if (!totalArtists) throw new Error("Total de artistas não encontrado");

      const randomPos = Math.floor(Math.random() * totalArtists) + 1;
      const page = Math.ceil(randomPos / 50);
      const indexNaPagina = (randomPos - 1) % 50;

      const pageRes = await fetch(
        `${API_URL}?method=library.getArtists&user=${username}&api_key=${API_KEY}&format=json&limit=50&page=${page}`
      );
      const pageData = await pageRes.json();
      const artistas = pageData.artists?.artist;

      if (!artistas || artistas.length === 0) {
        throw new Error("Nenhum artista encontrado nesta página.");
      }

      const artistaSorteado = artistas[indexNaPagina];
      if (!artistaSorteado) {
        throw new Error("Artista não encontrado na posição sorteada.");
      }

      const sorteado = {
        nome: artistaSorteado.name,
        posicao: randomPos,
        scrobbles: artistaSorteado.playcount || 0,
      };

      resultadoDiv.innerText = `🎧 Que tal ouvir: ${sorteado.nome} (🎲 nº ${sorteado.posicao}, ${sorteado.scrobbles} scrobbles feitos por você)`;

      atualizarHistorico(sorteado);
      exibirHistorico(); // tudo junto, artista atual + últimos 3
    } catch (err) {
      resultadoDiv.innerText = "Erro: " + err.message;
    }
  });
});

function geraAssinatura(params) {
  const keys = Object.keys(params).sort();
  let str = "";
  for (const key of keys) {
    str += key + params[key];
  }
  str += API_SECRET;
  return md5(str); // usando blueimp-md5
}

function verificarSessao() {
  const session = localStorage.getItem("lastfm_session");
  const authSection = document.getElementById("auth-section");
  const mainSection = document.getElementById("main-section");

  if (session) {
    authSection.style.display = "none";
    mainSection.style.display = "block";
  } else {
    authSection.style.display = "block";
    mainSection.style.display = "none";
  }
}

function atualizarHistorico(novoItem) {
  let historico = JSON.parse(
    localStorage.getItem("historico_sorteios") || "[]"
  );

  historico.unshift(novoItem); // Coloca o atual no topo
  if (historico.length > 4) historico = historico.slice(0, 4); // 1 atual + 3 anteriores
  localStorage.setItem("historico_sorteios", JSON.stringify(historico));
}

function exibirHistorico() {
  const historicoDiv = document.getElementById("historico");
  const historico = JSON.parse(
    localStorage.getItem("historico_sorteios") || "[]"
  );

  if (historico.length === 0) {
    historicoDiv.innerHTML = "<p>Nenhum sorteio ainda.</p>";
    return;
  }

  let html = "<h3>Últimos sorteios:</h3><ul>";
  historico.forEach((item, index) => {
    const destaque = index === 0 ? "<strong>" : "";
    const fimDestaque = index === 0 ? "</strong>" : "";
    html += `<li>🎶 ${destaque}${item.nome} (nº ${item.posicao} - ${item.scrobbles} scrobbles)${fimDestaque}</li>`;
  });
  html += "</ul>";

  historicoDiv.innerHTML = html;
}
