(function () {
  "use strict";

  var raiz = document.documentElement;
  raiz.classList.add("js");

  /* ---------- Preferências guardadas no navegador ---------- */
  function ler(chave) {
    try { return window.localStorage.getItem("historias:" + chave); } catch (e) { return null; }
  }
  function guardar(chave, valor) {
    try { window.localStorage.setItem("historias:" + chave, valor); } catch (e) { /* sem armazenamento */ }
  }

  var avisos = document.getElementById("avisos");
  var aoAnunciar = null; // a "Voz do site" também fala os avisos
  function anunciar(texto) {
    if (aoAnunciar) aoAnunciar(texto);
    if (!avisos) return;
    avisos.textContent = "";
    window.setTimeout(function () { avisos.textContent = texto; }, 60);
  }

  function frasesDe(texto) {
    var partes = (texto || "").replace(/\s+/g, " ").match(/[^.!?…]+[.!?…]+["”]?|[^.!?…]+$/g) || [];
    return partes.map(function (p) { return p.trim(); }).filter(Boolean);
  }

  /* ---------- Opções de leitura ---------- */
  var TAMANHO_MAX = 4;
  var tamanho = parseInt(ler("tamanho") || "0", 10) || 0;

  function aplicarTamanho() {
    if (tamanho > 0) raiz.setAttribute("data-tamanho", String(tamanho));
    else raiz.removeAttribute("data-tamanho");
    var menor = document.getElementById("texto-menor");
    var maior = document.getElementById("texto-maior");
    if (menor) menor.disabled = tamanho === 0;
    if (maior) maior.disabled = tamanho === TAMANHO_MAX;
  }

  function alternar(botaoId, atributo, valorLigado, chave, nomeLigado, nomeDesligado) {
    var botao = document.getElementById(botaoId);
    if (!botao) return;
    function aplicar(ligado, avisar) {
      if (ligado) raiz.setAttribute(atributo, valorLigado);
      else raiz.removeAttribute(atributo);
      botao.setAttribute("aria-pressed", ligado ? "true" : "false");
      guardar(chave, ligado ? "1" : "0");
      if (avisar) anunciar(ligado ? nomeLigado : nomeDesligado);
    }
    var salvo = ler(chave);
    var inicial = salvo === null
      ? (chave === "escuro" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
      : salvo === "1";
    aplicar(inicial, false);
    botao.addEventListener("click", function () {
      aplicar(botao.getAttribute("aria-pressed") !== "true", true);
    });
  }

  aplicarTamanho();
  var botaoMenor = document.getElementById("texto-menor");
  var botaoMaior = document.getElementById("texto-maior");
  if (botaoMenor) botaoMenor.addEventListener("click", function () {
    if (tamanho > 0) { tamanho--; guardar("tamanho", String(tamanho)); aplicarTamanho(); anunciar("Texto menor"); }
  });
  if (botaoMaior) botaoMaior.addEventListener("click", function () {
    if (tamanho < TAMANHO_MAX) { tamanho++; guardar("tamanho", String(tamanho)); aplicarTamanho(); anunciar("Texto maior"); }
  });

  alternar("modo-escuro", "data-tema", "escuro", "escuro", "Modo escuro ligado", "Modo escuro desligado");
  alternar("alto-contraste", "data-contraste", "alto", "contraste", "Alto contraste ligado", "Alto contraste desligado");
  alternar("espacamento", "data-espaco", "amplo", "espaco", "Espaçamento maior ligado", "Espaçamento maior desligado");

  /* ---------- Os botões do site não devem ser "capturados" pelo VLibras ----------
     Com o avatar aberto, o VLibras traduz qualquer coisa clicada e bloqueia o clique.
     Elementos com a classe "vlibras-links" ficam de fora disso. */
  var SELETOR_PROTEGIDO = "button, a, label, select, input, textarea, summary, .trecho, .cartao, .alternativa";
  function proteger(raizBusca) {
    var base = raizBusca || document;
    Array.prototype.forEach.call(base.querySelectorAll(SELETOR_PROTEGIDO), function (el) {
      el.classList.add("vlibras-links");
      Array.prototype.forEach.call(el.querySelectorAll("*"), function (filho) {
        if (filho.classList) filho.classList.add("vlibras-links");
      });
    });
  }
  proteger(document);

  /* ---------- Tempo por extenso, para leitores de tela ---------- */
  function relogio(segundos) {
    segundos = Math.max(0, Math.floor(segundos || 0));
    var m = Math.floor(segundos / 60);
    var s = segundos % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }
  function porExtenso(segundos) {
    segundos = Math.max(0, Math.floor(segundos || 0));
    var m = Math.floor(segundos / 60);
    var s = segundos % 60;
    var partes = [];
    if (m > 0) partes.push(m + (m === 1 ? " minuto" : " minutos"));
    if (s > 0 || m === 0) partes.push(s + (s === 1 ? " segundo" : " segundos"));
    return partes.join(" e ");
  }

  /* =========================================================
     Libras (avatar do VLibras)
     ========================================================= */
  var libras = {
    ligado: false,      // "Libras junto com o áudio"
    ocupado: false,     // avatar ainda sinalizando a última frase enviada
    viuSinalizar: false,
    desde: 0,
    aoTerminar: null,   // chamado quando o avatar fica livre
    filaId: 0
  };
  var caixaLibras = document.getElementById("libras-junto");
  var avisoLibras = document.getElementById("libras-aviso");

  function vlibras() {
    return window.plugin && window.plugin.player && typeof window.plugin.translate === "function" ? window.plugin : null;
  }
  // O VLibras só baixa a parte principal (window.plugin) quando o avatar é aberto
  function librasCarregou() {
    return !!(vlibras() || (window.VLibras && window.VLibras.Widget) || document.getElementById("vlibras-access-wrapper"));
  }
  function avatarAberto() {
    var v = vlibras();
    return !!(v && v.player.isOpen && v.player.isLoaded);
  }
  function abrirAvatar() {
    if (avatarAberto()) return;
    var host = document.getElementById("vlibras-access-wrapper");
    var botao = host && host.shadowRoot && host.shadowRoot.getElementById("vlibras-button");
    if (botao) botao.click();
  }
  function sinalizar(texto) {
    var v = vlibras();
    if (!v) return;
    libras.ocupado = true;
    libras.viuSinalizar = false;
    libras.desde = Date.now();
    try { v.translate(texto); } catch (e) { libras.ocupado = false; }
  }
  function pararLibras() {
    libras.ocupado = false;
    libras.aoTerminar = null;
    libras.filaId++;
    var v = vlibras();
    if (v) { try { v.player.stop(); } catch (e) { /* nada */ } }
  }
  function pausarAvatar() {
    var v = vlibras();
    if (v && v.player.status === "playing") { try { v.player.pause(); } catch (e) { /* nada */ } }
  }
  function retomarAvatar() {
    var v = vlibras();
    if (v && v.player.status === "paused") { try { v.player.play(); } catch (e) { /* nada */ } }
  }
  // Espera o avatar abrir (na primeira vez ele demora alguns segundos)
  function quandoAvatarPronto(feito) {
    abrirAvatar();
    var inicio = Date.now();
    (function checar() {
      if (avatarAberto()) { window.setTimeout(feito, 600); return; }
      if (Date.now() - inicio > 90000) { feito(); return; }
      window.setTimeout(checar, 250);
    })();
  }
  // Sinaliza várias frases, uma depois da outra
  function sinalizarFila(lista, aoFrase, aoFim) {
    if (!librasCarregou()) {
      anunciar("O VLibras não carregou. Confira a conexão com a internet e recarregue a página.");
      return function () {};
    }
    pararLibras();
    var id = libras.filaId;
    var i = -1;
    function proxima() {
      if (id !== libras.filaId) return;
      i++;
      if (i >= lista.length) { if (aoFim) aoFim(); return; }
      if (aoFrase) aoFrase(i);
      libras.aoTerminar = proxima;
      sinalizar(lista[i]);
    }
    quandoAvatarPronto(proxima);
    return function cancelar() { if (id === libras.filaId) pararLibras(); };
  }

  // Enquanto a janela do avatar estiver aberta, a página abre espaço para ela (telas largas)
  window.setInterval(function () {
    var v = vlibras();
    var aberto = !!(v && v.player.isOpen);
    if (aberto !== raiz.hasAttribute("data-avatar")) {
      if (aberto) raiz.setAttribute("data-avatar", "aberto"); else raiz.removeAttribute("data-avatar");
    }
  }, 1000);

  window.setInterval(function () {
    if (!libras.ocupado) return;
    var v = vlibras();
    if (!v) { libras.ocupado = false; return; }
    var st = v.player.status;
    if (st === "playing" || st === "paused") libras.viuSinalizar = true;
    var espera = Date.now() - libras.desde;
    var acabou = (st === "idle" && libras.viuSinalizar) ||
                 (!libras.viuSinalizar && espera > 15000) ||  // a tradução não chegou
                 (st !== "paused" && espera > 60000);         // trava de segurança
    if (acabou) {
      libras.ocupado = false;
      if (libras.aoTerminar) { var f = libras.aoTerminar; libras.aoTerminar = null; f(); }
    }
  }, 150);

  // Se o VLibras não carregar (sem internet), avisa e desliga as opções de Libras
  window.addEventListener("load", function () {
    window.setTimeout(function () {
      if (librasCarregou()) return;
      if (caixaLibras) {
        caixaLibras.checked = false;
        caixaLibras.disabled = true;
        libras.ligado = false;
        marcarLibras();
        if (avisoLibras) {
          avisoLibras.textContent = "O VLibras não carregou. Confira a conexão com a internet e recarregue a página.";
          avisoLibras.hidden = false;
        }
      }
      Array.prototype.forEach.call(document.querySelectorAll("[data-libras]"), function (b) {
        b.disabled = true;
        b.title = "O VLibras não carregou. Confira a internet.";
      });
    }, 9000);
  });

  /* =========================================================
     Leitura em voz alta (voz do navegador), com voz reserva
     ========================================================= */
  var fala = { id: 0, voz: null, quebradas: [], pendente: null };
  var temVoz = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

  function escolherVoz() {
    if (!temVoz) return;
    var vozes = window.speechSynthesis.getVoices().filter(function (v) {
      return /^pt/i.test(v.lang) && fala.quebradas.indexOf(v.name) < 0;
    });
    function primeira(teste) { return vozes.filter(teste)[0]; }
    // Preferência: voz brasileira instalada > brasileira online > portuguesa instalada > qualquer português
    fala.voz = primeira(function (v) { return /pt[-_]BR/i.test(v.lang) && v.localService; }) ||
               primeira(function (v) { return /pt[-_]BR/i.test(v.lang); }) ||
               primeira(function (v) { return v.localService; }) ||
               vozes[0] || null;
  }
  // Se uma voz não funcionar (ex.: voz online da Microsoft fora do ar), passa para a próxima
  function trocarVoz() {
    if (fala.voz) fala.quebradas.push(fala.voz.name);
    else fala.quebradas.push("(padrão)");
    escolherVoz();
  }
  if (temVoz) {
    escolherVoz();
    if (window.speechSynthesis.addEventListener) window.speechSynthesis.addEventListener("voiceschanged", escolherVoz);
  }

  // Alguns navegadores só deixam falar depois do primeiro clique ou tecla na página
  var avisoClique = null;
  function pedirClique() {
    if (!avisoClique) {
      avisoClique = document.createElement("div");
      avisoClique.className = "aviso-voz";
      avisoClique.setAttribute("role", "status");
      document.body.appendChild(avisoClique);
    }
    avisoClique.textContent = "Para a voz começar, clique em qualquer lugar da página ou aperte uma tecla.";
    avisoClique.hidden = false;
  }
  function liberarPendente() {
    if (avisoClique) avisoClique.hidden = true;
    if (!fala.pendente) return;
    var p = fala.pendente;
    fala.pendente = null;
    falar(p.lista, p.aoFrase, p.aoFim);
  }
  document.addEventListener("pointerdown", liberarPendente, true);
  document.addEventListener("keydown", liberarPendente, true);
  document.addEventListener("click", liberarPendente, true);

  function pararFala() {
    fala.id++;
    if (temVoz) window.speechSynthesis.cancel();
  }

  function falar(lista, aoFrase, aoFim) {
    pararFala();
    if (!temVoz) { anunciar("Este navegador não tem leitura em voz alta."); if (aoFim) aoFim(); return; }
    var ativo = navigator.userActivation;
    if (ativo && !ativo.hasBeenActive) {
      fala.pendente = { lista: lista, aoFrase: aoFrase, aoFim: aoFim };
      pedirClique();
      return;
    }
    var id = fala.id;
    var i = 0;
    var tentativas = 0;
    function proxima() {
      if (id !== fala.id) return;
      if (i >= lista.length) { if (aoFim) aoFim(); return; }
      if (aoFrase) aoFrase(i);
      var u = new window.SpeechSynthesisUtterance(lista[i]);
      u.lang = fala.voz ? fala.voz.lang : "pt-BR";
      if (fala.voz) u.voice = fala.voz;
      u.rate = 1;
      var comecou = false, acabou = false;
      function tentarDeNovo() {
        if (acabou) return;
        acabou = true;
        if (tentativas++ < 4) { trocarVoz(); window.speechSynthesis.cancel(); window.setTimeout(proxima, 60); }
        else { i++; tentativas = 0; proxima(); }
      }
      var vigia = window.setTimeout(function () { if (!comecou && id === fala.id) tentarDeNovo(); }, 2500);
      u.onstart = function () { comecou = true; tentativas = 0; };
      u.onend = function () {
        window.clearTimeout(vigia);
        if (acabou || id !== fala.id) return;
        acabou = true;
        i++; proxima();
      };
      u.onerror = function (ev) {
        window.clearTimeout(vigia);
        if (acabou || id !== fala.id) return;
        if (ev.error === "interrupted" || ev.error === "canceled") return;
        if (ev.error === "not-allowed") {
          acabou = true;
          fala.pendente = { lista: lista.slice(i), aoFrase: aoFrase, aoFim: aoFim };
          pedirClique();
          return;
        }
        if (!comecou) tentarDeNovo();
        else { acabou = true; i++; proxima(); }
      };
      window.speechSynthesis.speak(u);
    }
    proxima();
  }

  // Botões genéricos "Ouvir" e "Ver em Libras" (ex.: página Aprender)
  var botaoFalando = null;
  function restaurarBotaoFala() {
    if (!botaoFalando) return;
    var r = botaoFalando.querySelector(".rotulo");
    if (r) r.textContent = "Ouvir";
    botaoFalando.setAttribute("aria-pressed", "false");
    botaoFalando = null;
  }
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("[data-ouvir]");
    if (b) {
      if (botaoFalando === b) { pararFala(); restaurarBotaoFala(); return; }
      restaurarBotaoFala();
      var alvo = document.getElementById(b.getAttribute("data-ouvir"));
      if (!alvo) return;
      botaoFalando = b;
      b.setAttribute("aria-pressed", "true");
      var r = b.querySelector(".rotulo");
      if (r) r.textContent = "Parar";
      falar(frasesDe(alvo.innerText), null, restaurarBotaoFala);
      return;
    }
    var bl = ev.target.closest && ev.target.closest("[data-libras]");
    if (bl) {
      var alvoL = document.getElementById(bl.getAttribute("data-libras"));
      if (!alvoL) return;
      anunciar("Abrindo o avatar de Libras");
      sinalizarFila(frasesDe(alvoL.innerText));
    }
  });

  /* =========================================================
     Player de cada história
     ========================================================= */
  var historias = Array.prototype.slice.call(document.querySelectorAll(".historia"));
  var atual = null;
  var seguirOuvindo = document.getElementById("seguir-ouvindo");
  if (seguirOuvindo) {
    seguirOuvindo.checked = ler("seguir") === "1";
    seguirOuvindo.addEventListener("change", function () { guardar("seguir", seguirOuvindo.checked ? "1" : "0"); });
  }
  var velocidadeSalva = ler("velocidade") || "1";

  function marcarLibras() {
    // Em telas largas, abre espaço à direita para a janela do avatar
    if (libras.ligado) raiz.setAttribute("data-libras", "sim");
    else raiz.removeAttribute("data-libras");
  }

  // Mostra embaixo da opção se o avatar ainda está carregando ou já está pronto
  function avisarCarregamento() {
    if (avatarAberto()) { anunciar("Libras junto com o áudio ligado"); return; }
    if (avisoLibras) {
      avisoLibras.textContent = "Carregando o avatar de Libras… Na primeira vez pode levar até um minuto.";
      avisoLibras.hidden = false;
    }
    anunciar("Libras junto com o áudio ligado. Carregando o avatar.");
    quandoAvatarPronto(function () {
      if (!libras.ligado || !avisoLibras) return;
      if (avatarAberto()) {
        avisoLibras.textContent = "Avatar de Libras pronto. Aperte Ouvir em uma história.";
        anunciar("Avatar de Libras pronto");
      } else {
        avisoLibras.textContent = "O avatar está demorando para abrir. Confira a internet ou clique no botão azul do VLibras.";
      }
    });
  }

  if (caixaLibras) {
    caixaLibras.checked = ler("libras") === "1";
    libras.ligado = caixaLibras.checked;
    marcarLibras();
    caixaLibras.addEventListener("change", function () {
      libras.ligado = caixaLibras.checked;
      guardar("libras", libras.ligado ? "1" : "0");
      marcarLibras();
      if (libras.ligado) {
        avisarCarregamento();
      } else {
        if (avisoLibras) avisoLibras.hidden = true;
        if (atual) atual.sairDaLibras();
        pararLibras();
        anunciar("Libras junto com o áudio desligado");
      }
    });
  } else {
    raiz.removeAttribute("data-libras");
  }

  function montar(el) {
    var audio = el.querySelector("audio");
    var titulo = el.getAttribute("data-titulo");
    var botao = el.querySelector(".botao-tocar");
    var rotulo = botao.querySelector(".rotulo");
    var player = el.querySelector(".player");
    var posicao = el.querySelector(".posicao");
    var tempo = el.querySelector(".tempo");
    var situacao = el.querySelector(".situacao-libras");
    var voltar = el.querySelector(".voltar");
    var avancar = el.querySelector(".avancar");
    var velocidade = el.querySelector(".velocidade");
    var botaoTexto = el.querySelector(".botao-texto");
    var texto = el.querySelector(".texto");
    var trechos = texto ? Array.prototype.slice.call(texto.querySelectorAll(".trecho")) : [];
    var frases = trechos.map(function (t) {
      return { inicio: parseFloat(t.getAttribute("data-inicio")), fim: parseFloat(t.getAttribute("data-fim")), texto: t.textContent };
    });
    var duracaoConhecida = parseFloat(el.getAttribute("data-duracao")) || 0;
    var trechoAtual = null;

    // Estado do modo Libras desta história
    var fraseLibras = -1;          // última frase enviada ao avatar
    var esperandoLibras = false;   // áudio parado esperando o avatar
    var abrindoAvatar = false;
    var pausaNossa = false;        // a pausa veio do modo Libras, não da pessoa

    audio.removeAttribute("controls");
    velocidade.value = velocidadeSalva;

    function duracao() {
      return isFinite(audio.duration) && audio.duration > 0 ? audio.duration : duracaoConhecida;
    }

    function fraseEm(t) {
      var idx = -1;
      for (var i = 0; i < frases.length; i++) {
        if (frases[i].inicio <= t + 0.05) idx = i; else break;
      }
      return idx;
    }

    function mostrarSituacao(msg) {
      if (!situacao) return;
      situacao.textContent = msg || "";
      situacao.hidden = !msg;
    }

    function atualizarPosicao() {
      var d = duracao();
      var t = audio.currentTime;
      posicao.max = String(Math.round(d));
      posicao.value = String(Math.floor(t));
      posicao.style.setProperty("--progresso", (d ? (t / d) * 100 : 0) + "%");
      posicao.setAttribute("aria-valuetext", porExtenso(t) + " de " + porExtenso(d));
      tempo.textContent = relogio(t) + " / " + relogio(d);
      marcarTrecho(t);
    }

    function marcarTrecho(t) {
      if (!trechos.length) return;
      var achado = null;
      for (var i = 0; i < frases.length; i++) {
        if (t >= frases[i].inicio && t < frases[i].fim + 0.3) { achado = trechos[i]; break; }
      }
      if (esperandoLibras && fraseLibras > -1) achado = trechos[fraseLibras];
      if (achado === trechoAtual) return;
      if (trechoAtual) trechoAtual.classList.remove("agora");
      trechoAtual = achado;
      if (achado) {
        achado.classList.add("agora");
        if (!texto.hidden && (!audio.paused || esperandoLibras)) {
          var caixa = texto.getBoundingClientRect();
          var linha = achado.getBoundingClientRect();
          if (linha.top < caixa.top || linha.bottom > caixa.bottom) {
            texto.scrollTop += linha.top - caixa.top - caixa.height / 3;
          }
        }
      }
    }

    function tocando() {
      return (!audio.paused && !audio.ended) || esperandoLibras || abrindoAvatar;
    }

    function estado() {
      var t = tocando();
      botao.setAttribute("data-estado", t ? "tocando" : "parado");
      rotulo.textContent = t ? "Pausar" : (audio.currentTime > 0 && !audio.ended ? "Continuar" : "Ouvir");
      botao.setAttribute("aria-label", rotulo.textContent + ": " + titulo);
    }

    /* --- Sincronia com o avatar --- */
    function seguirLibras() {
      if (!libras.ligado || !frases.length || audio.paused) return;
      var t = audio.currentTime;
      // A frase do áudio acabou, mas o avatar ainda está sinalizando: o áudio espera
      if (libras.ocupado && fraseLibras > -1 && t >= frases[fraseLibras].fim - 0.12) {
        esperarLibras();
        return;
      }
      var j = fraseEm(t);
      if (j > fraseLibras && !libras.ocupado) {
        fraseLibras = j;
        sinalizar(frases[j].texto.replace(/^\[|\]$/g, ""));
      }
    }

    function esperarLibras() {
      esperandoLibras = true;
      pausaNossa = true;
      audio.pause();
      mostrarSituacao("Esperando o avatar terminar a frase em Libras…");
      libras.aoTerminar = function () {
        if (!esperandoLibras) return;
        esperandoLibras = false;
        mostrarSituacao("");
        pausaNossa = true;
        tocarAudio();
      };
      estado();
    }

    function sairDaLibras() {
      libras.aoTerminar = null;
      fraseLibras = fraseEm(audio.currentTime);
      mostrarSituacao("");
      if (esperandoLibras) {
        esperandoLibras = false;
        tocarAudio();
      }
    }

    function reiniciarLibras() {
      // Depois de pular para outro ponto, o avatar recomeça da frase certa
      if (!libras.ligado) return;
      pararLibras();
      fraseLibras = fraseEm(audio.currentTime) - 1;
      if (esperandoLibras) {
        esperandoLibras = false;
        mostrarSituacao("");
        tocarAudio();
      }
    }

    var vigia = null;
    function vigiar(ligar) {
      if (ligar && !vigia) vigia = window.setInterval(seguirLibras, 100);
      if (!ligar && vigia) { window.clearInterval(vigia); vigia = null; }
    }

    function tocarAudio() {
      var p = audio.play();
      if (p && p.catch) p.catch(function () { anunciar("Não foi possível tocar o áudio. Tente de novo."); });
    }

    function ativar() {
      if (atual && atual !== api) atual.parar();
      atual = api;
      pararFala();
      restaurarBotaoFala();
      el.classList.add("ativa");
      player.hidden = false;
    }

    function tocar() {
      ativar();
      if (audio.ended || audio.currentTime >= duracao() - 0.2) { audio.currentTime = 0; fraseLibras = -1; }
      if (libras.ligado && !avatarAberto()) {
        abrindoAvatar = true;
        mostrarSituacao("Abrindo o avatar de Libras… Na primeira vez pode levar até um minuto.");
        estado();
        quandoAvatarPronto(function () {
          if (!abrindoAvatar) return;
          abrindoAvatar = false;
          mostrarSituacao("");
          tocarAudio();
        });
        return;
      }
      if (libras.ligado) retomarAvatar();
      tocarAudio();
    }

    function pausar() {
      if (abrindoAvatar) mostrarSituacao("");
      abrindoAvatar = false;
      pausaNossa = false;
      if (esperandoLibras) {
        esperandoLibras = false;
        libras.aoTerminar = null;
        mostrarSituacao("");
      }
      if (libras.ligado) pausarAvatar();
      audio.pause();
      vigiar(false);
      estado();
    }

    botao.addEventListener("click", function () {
      if (tocando()) pausar(); else tocar();
    });

    audio.addEventListener("play", function () {
      estado();
      vigiar(true);
      if (!pausaNossa) anunciar("Tocando: " + titulo);
      pausaNossa = false;
    });
    audio.addEventListener("pause", function () {
      estado();
      if (!esperandoLibras) vigiar(false);
      if (!audio.ended && !pausaNossa) anunciar("Pausado");
    });
    audio.addEventListener("ended", function () {
      vigiar(false);
      estado();
      var i = historias.indexOf(el);
      var proximaEl = i > -1 ? historias[i + 1] : null;
      var mesmaLista = proximaEl && proximaEl.closest(".lista") === el.closest(".lista");
      var seguir = seguirOuvindo && seguirOuvindo.checked && mesmaLista;
      function proxima() {
        if (seguir) {
          anunciar("Fim de " + titulo + ". A seguir: " + proximaEl.getAttribute("data-titulo"));
          window.setTimeout(function () { proximaEl._api.tocar(); }, 1200);
        } else {
          anunciar("Fim de " + titulo);
        }
      }
      // Com Libras, espera o avatar terminar a última frase antes de seguir
      if (libras.ligado && libras.ocupado) libras.aoTerminar = proxima; else proxima();
      fraseLibras = -1;
    });
    audio.addEventListener("timeupdate", atualizarPosicao);
    audio.addEventListener("loadedmetadata", atualizarPosicao);

    posicao.addEventListener("input", function () {
      audio.currentTime = parseFloat(posicao.value) || 0;
      atualizarPosicao();
      reiniciarLibras();
    });

    voltar.addEventListener("click", function () {
      audio.currentTime = Math.max(0, audio.currentTime - 10);
      atualizarPosicao();
      reiniciarLibras();
    });
    avancar.addEventListener("click", function () {
      audio.currentTime = Math.min(duracao(), audio.currentTime + 10);
      atualizarPosicao();
      reiniciarLibras();
    });

    velocidade.addEventListener("change", function () {
      velocidadeSalva = velocidade.value;
      guardar("velocidade", velocidadeSalva);
      historias.forEach(function (h) {
        h.querySelector("audio").playbackRate = parseFloat(velocidadeSalva);
        h.querySelector(".velocidade").value = velocidadeSalva;
      });
    });
    audio.playbackRate = parseFloat(velocidadeSalva);

    // Atalho dentro do player: K (ou espaço no texto) toca/pausa
    el.addEventListener("keydown", function (ev) {
      var alvo = ev.target;
      if (alvo.tagName === "SELECT" || alvo.tagName === "BUTTON" || alvo.tagName === "A" || alvo.tagName === "SUMMARY") return;
      if (ev.key === "k" || ev.key === "K" || (ev.key === " " && alvo === texto)) {
        ev.preventDefault();
        botao.click();
      }
    });

    if (botaoTexto && texto) {
      botaoTexto.addEventListener("click", function () {
        var abrir = botaoTexto.getAttribute("aria-expanded") !== "true";
        botaoTexto.setAttribute("aria-expanded", abrir ? "true" : "false");
        botaoTexto.querySelector(".rotulo").textContent = abrir ? "Esconder o texto" : "Ler o texto";
        texto.hidden = !abrir;
      });
      texto.addEventListener("click", function (ev) {
        var t = ev.target.closest(".trecho");
        if (!t) return;
        audio.currentTime = parseFloat(t.getAttribute("data-inicio")) || 0;
        atualizarPosicao();
        reiniciarLibras();
        if (!tocando()) tocar();
      });
    }

    var api = {
      parar: function () {
        abrindoAvatar = false;
        esperandoLibras = false;
        mostrarSituacao("");
        if (libras.ligado) pararLibras();
        fraseLibras = -1;
        audio.pause();
        vigiar(false);
        el.classList.remove("ativa");
        estado();
      },
      tocar: tocar,
      sairDaLibras: sairDaLibras
    };
    el._api = api;
    estado();
    atualizarPosicao();
  }

  historias.forEach(montar);

  // Ao chegar por um link como index.html#historia-5, destaca a história
  if (location.hash) {
    var alvoHash = document.getElementById(location.hash.slice(1));
    if (alvoHash && alvoHash.classList.contains("historia")) {
      alvoHash.classList.add("ativa");
      var h3 = alvoHash.querySelector("h3");
      if (h3) { h3.setAttribute("tabindex", "-1"); h3.focus(); }
    }
  }


  /* =========================================================
     Audiodescrição (modo ativável)
     Ligada, fala o que está embaixo do mouse ou do dedo, ou com o
     foco do Tab, e o que acontece ao clicar.
     ========================================================= */
  var vozSite = { ligada: ler("voz-site") === "1" };
  var botoesVoz = Array.prototype.slice.call(document.querySelectorAll("#voz-site, [data-alternar-voz]"));
  var PAGINAS_NOME = {
    "index.html": "Histórias, a página inicial", "aprender.html": "Aprender", "quiz.html": "Quiz",
    "criar.html": "Criar história", "pesquisa.html": "Pesquisa", "acessibilidade.html": "Acessibilidade"
  };
  var SELETOR_LEITURA = "a[href], button, input, select, textarea, summary, label, img[alt], [role=img], " +
    "h1, h2, h3, h4, p, li, td, th, dt, dd, figcaption, legend, .trecho, .dado-numero, #vlibras-access-wrapper";

  function limpar(t) { return (t || "").replace(/\s+/g, " ").trim(); }

  function nomeDe(el) {
    if (el.getAttribute("aria-label")) return el.getAttribute("aria-label");
    var por = el.getAttribute("aria-labelledby");
    if (por) {
      var partes = por.split(/\s+/).map(function (id) { var a = document.getElementById(id); return a ? a.innerText : ""; });
      if (limpar(partes.join(" "))) return partes.join(" ");
    }
    if (el.labels && el.labels.length) return el.labels[0].innerText;
    if (el.tagName === "IMG") return el.alt;
    // Textos em várias linhas viram frases separadas
    var texto = (el.innerText || "").split(/\n+/).map(limpar).filter(Boolean).join(". ");
    return texto || el.value || el.title || "";
  }

  // Devolve o que dizer: { texto, acao } (acao é o que acontece ao clicar)
  function descricaoDe(el) {
    if (!el || el === document.body || el === document.documentElement) return null;
    if (el.id === "vlibras-access-wrapper") return { texto: "Botão do VLibras", acao: "para abrir o avatar que traduz o site para Libras" };
    if (el.tagName === "LABEL") {
      var controle = el.control || el.querySelector("input, select, textarea");
      if (controle) el = controle;
    }
    var nome = limpar(nomeDe(el)).slice(0, 260).replace(/[\s.,;:]+$/, "");
    var tag = el.tagName;
    var tipo = (el.getAttribute("type") || "").toLowerCase();
    if (/^H[1-6]$/.test(tag)) return { texto: "Título: " + nome };
    if (tag === "A") {
      var href = el.getAttribute("href") || "";
      var pagina = href.split("#")[0].split("/").pop();
      if (el.hasAttribute("download")) return { texto: nome + ", link", acao: "para baixar o áudio" };
      if (/^https?:/i.test(href)) return { texto: nome + ", link para outro site", acao: el.target === "_blank" ? "para abrir o site em outra aba" : "para abrir o site" };
      if (href.charAt(0) === "#") return { texto: nome + ", link", acao: "para ir até essa parte da página" };
      if (PAGINAS_NOME[pagina]) {
        var destino = PAGINAS_NOME[pagina];
        var parte = href.indexOf("#") > -1 ? ", direto na parte certa" : "";
        return { texto: nome + ", link", acao: "e você irá para a página " + destino + parte };
      }
      if (/\.webp$/i.test(pagina)) return { texto: nome + ", link", acao: "para abrir a imagem em tamanho grande" };
      return { texto: nome + ", link", acao: "para abrir" };
    }
    if (tag === "SUMMARY") {
      var aberto = el.parentElement && el.parentElement.open;
      return { texto: nome + (aberto ? ", aberto" : ", fechado"), acao: aberto ? "para fechar" : "para abrir e ver o conteúdo" };
    }
    if (tag === "BUTTON") {
      var extra = "";
      if (el.hasAttribute("aria-pressed")) extra = el.getAttribute("aria-pressed") === "true" ? ", ligado" : ", desligado";
      if (el.disabled) return { texto: nome + ", botão indisponível agora" };
      if (el.classList.contains("botao-tocar")) {
        var tocando = el.getAttribute("data-estado") === "tocando";
        return { texto: nome + ", botão", acao: tocando ? "para pausar" : "para começar a ouvir" };
      }
      if (el.classList.contains("botao-texto")) {
        var exp = el.getAttribute("aria-expanded") === "true";
        return { texto: nome + ", botão", acao: exp ? "para esconder o texto" : "para mostrar o texto escrito" };
      }
      if (el.hasAttribute("aria-pressed")) return { texto: nome + ", botão" + extra, acao: el.getAttribute("aria-pressed") === "true" ? "para desligar" : "para ligar" };
      if (el.getAttribute("aria-haspopup") === "dialog") return { texto: nome + ", botão", acao: "para abrir o painel de acessibilidade" };
      return { texto: nome + ", botão", acao: "para apertar" };
    }
    if (tag === "INPUT" && tipo === "checkbox") return { texto: nome + ", caixa de marcar, " + (el.checked ? "marcada" : "desmarcada"), acao: el.checked ? "para desmarcar" : "para marcar" };
    if (tag === "INPUT" && tipo === "radio") return { texto: nome + ", opção" + (el.checked ? " escolhida" : ""), acao: el.checked ? null : "para escolher" };
    if (tag === "INPUT" && tipo === "range") return { texto: nome + ", barra de posição: " + (el.getAttribute("aria-valuetext") || el.value), acao: "num ponto da barra para ir até ele. Com o teclado, use as setas" };
    if (tag === "SELECT") return { texto: nome + ", lista. Escolhido: " + limpar(el.selectedOptions[0] ? el.selectedOptions[0].text : ""), acao: "para trocar" };
    if (tag === "TEXTAREA" || tag === "INPUT") return { texto: nome + ", campo para escrever" + (el.value ? ". Escrito: " + el.value.slice(0, 120) : ", vazio"), acao: "para escrever" };
    if (tag === "IMG" || el.getAttribute("role") === "img") return nome ? { texto: "Imagem: " + nome } : null;
    if (el.classList.contains("trecho")) return { texto: nome, acao: "para ouvir a história a partir desta frase" };
    if (el.getAttribute("role") === "region") return { texto: nome + ". Use as setas para rolar o texto." };
    if (el.id === "conteudo") return { texto: "Conteúdo principal da página." };
    return nome ? { texto: nome.slice(0, 400) } : null;
  }

  function frase(desc, modo) {
    if (!desc) return "";
    if (!desc.acao) return desc.texto;
    var verbo = modo === "toque" ? "Toque de novo" : modo === "teclado" ? "Aperte Enter" : "Clique";
    var acao = desc.acao.charAt(0) === "e" && desc.acao.indexOf("e você") === 0 ? " " + desc.acao : " " + desc.acao;
    return desc.texto + ". " + verbo + acao + ".";
  }

  // Contorno amarelo no que está sendo lido
  var lendoAgora = null;
  function destacar(el) {
    if (lendoAgora && lendoAgora !== el) lendoAgora.classList.remove("lendo-agora");
    lendoAgora = el;
    if (el && el.classList) el.classList.add("lendo-agora");
  }

  var ultimoLido = null;
  function lerElemento(el, modo, forcar) {
    if (!vozSite.ligada || !el) return;
    if (el === ultimoLido && !forcar) return;
    var desc = descricaoDe(el);
    if (!desc) return;
    ultimoLido = el;
    destacar(el);
    falar([frase(desc, modo)]);
  }

  function alvoDe(no) {
    if (!no || !no.closest) return null;
    if (no.closest("#vlibras-access-wrapper")) return document.getElementById("vlibras-access-wrapper");
    return no.closest(SELETOR_LEITURA);
  }

  function aplicarVoz(ligada, avisar) {
    vozSite.ligada = ligada;
    guardar("voz-site", ligada ? "1" : "0");
    botoesVoz.forEach(function (b) {
      if (b.id === "voz-site") b.setAttribute("aria-pressed", ligada ? "true" : "false");
      var r = b.querySelector(".rotulo") || (b.id === "voz-site" ? null : b);
      if (r) r.textContent = ligada ? "Desativar a audiodescrição" : "Ativar a audiodescrição";
    });
    raiz.classList.toggle("modo-ad", ligada);
    if (!ligada) { destacar(null); ultimoLido = null; }
    if (!avisar) return;
    if (ligada) {
      falar(["Audiodescrição ativada. Passe o mouse ou o dedo sobre a tela, ou use a tecla Tab, e eu falo onde você está e o que acontece ao clicar."]);
    } else {
      anunciar("Audiodescrição desativada");
      falar(["Audiodescrição desativada."]);
    }
  }

  botoesVoz.forEach(function (b) {
    b.addEventListener("click", function () { aplicarVoz(!vozSite.ligada, true); });
  });
  aplicarVoz(vozSite.ligada, false);

  // Mouse: lê o que estiver embaixo, depois de uma pausa curta
  var esperaMouse = null;
  document.addEventListener("pointerover", function (ev) {
    if (!vozSite.ligada || ev.pointerType === "touch") return;
    var alvo = alvoDe(ev.target);
    window.clearTimeout(esperaMouse);
    if (!alvo || alvo === ultimoLido) return;
    esperaMouse = window.setTimeout(function () { lerElemento(alvo, "mouse"); }, 220);
  });

  // Dedo: arrastar o dedo lê o que passa embaixo; um toque lê, o segundo toque clica
  var armado = null, armadoEm = 0, ultimoPonteiro = "mouse";
  document.addEventListener("pointerdown", function (ev) { ultimoPonteiro = ev.pointerType || "mouse"; }, true);
  document.addEventListener("touchmove", function (ev) {
    if (!vozSite.ligada || !ev.touches.length) return;
    var t = ev.touches[0];
    var alvo = alvoDe(document.elementFromPoint(t.clientX, t.clientY));
    if (alvo && alvo !== ultimoLido) lerElemento(alvo, "toque");
  }, { passive: true });
  document.addEventListener("click", function (ev) {
    if (!vozSite.ligada || ultimoPonteiro !== "touch") return;
    var alvo = alvoDe(ev.target);
    if (!alvo) return;
    var interativo = alvo.matches("a[href], button, input, select, textarea, summary, label, .trecho") || alvo.id === "vlibras-access-wrapper";
    if (!interativo) { lerElemento(alvo, "toque", true); return; }
    if (armado === alvo && Date.now() - armadoEm < 6000) { armado = null; return; } // segundo toque: clica
    ev.preventDefault();
    ev.stopPropagation();
    armado = alvo;
    armadoEm = Date.now();
    lerElemento(alvo, "toque", true);
  }, true);

  // Teclado: lê o item que recebe o foco
  document.addEventListener("focusin", function (ev) {
    if (!vozSite.ligada || ultimoPonteiro === "touch") return;
    if (ev.target.matches && ev.target.matches(":focus-visible")) lerElemento(ev.target, "teclado", true);
  });
  document.addEventListener("keydown", function () { ultimoPonteiro = "teclado"; }, true);
  document.addEventListener("change", function (ev) {
    if (!vozSite.ligada) return;
    var t = ev.target;
    if (t.type === "checkbox" || t.type === "radio") lerElemento(t, "teclado", true);
  });
  // Os avisos da página (ex.: "Resposta certa") também são falados
  aoAnunciar = function (texto) {
    if (vozSite.ligada && !/^(Tocando|Pausado)/.test(texto)) window.setTimeout(function () { falar([texto]); }, 350);
  };

  /* ---------- Painel de acessibilidade (botão no lado direito) ---------- */
  var painel = document.getElementById("painel-acess");
  var botaoPainel = document.getElementById("abrir-acess");
  var fecharPainel = document.getElementById("fechar-acess");
  var focoAntesDoPainel = null;

  function painelAberto() { return !!(painel && painel.open); }

  function abrirPainel(focar) {
    if (!painel || painelAberto()) return;
    focoAntesDoPainel = document.activeElement;
    if (typeof painel.showModal === "function") painel.showModal(); else painel.setAttribute("open", "");
    if (botaoPainel) botaoPainel.setAttribute("aria-expanded", "true");
    var alvo = focar || painel.querySelector("#audiodescricao-pagina .botao-tocar") || fecharPainel;
    if (alvo) alvo.focus();
  }

  function fecharOPainel() {
    if (!painelAberto()) return;
    if (typeof painel.close === "function") painel.close(); else painel.removeAttribute("open");
  }

  if (painel) {
    painel.addEventListener("close", function () {
      if (botaoPainel) botaoPainel.setAttribute("aria-expanded", "false");
      var volta = focoAntesDoPainel && document.contains(focoAntesDoPainel) ? focoAntesDoPainel : botaoPainel;
      if (volta && volta.focus) volta.focus();
      anunciar("Painel de acessibilidade fechado");
    });
    // Clicar fora do painel (no fundo escuro) também fecha
    painel.addEventListener("click", function (ev) {
      if (ev.target === painel) fecharOPainel();
    });
  }
  if (botaoPainel) {
    botaoPainel.setAttribute("aria-expanded", "false");
    botaoPainel.addEventListener("click", function () { abrirPainel(); });
  }
  if (fecharPainel) fecharPainel.addEventListener("click", fecharOPainel);

  Array.prototype.forEach.call(document.querySelectorAll("[data-abrir-vlibras]"), function (b) {
    b.addEventListener("click", function () {
      fecharOPainel();
      anunciar("Abrindo o avatar de Libras");
      abrirAvatar();
    });
  });

  /* ---------- Audiodescrição da página: abre o painel e toca ---------- */
  function tocarAudiodescricao() {
    var ad = document.getElementById("audiodescricao-pagina");
    if (!ad || !ad._api) return false;
    pararFala();
    abrirPainel(ad.querySelector(".botao-tocar"));
    ad._api.tocar();
    return true;
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-ouvir-ad]"), function (a) {
    a.addEventListener("click", function (ev) {
      if (tocarAudiodescricao()) ev.preventDefault();
    });
  });

  /* ---------- Atalhos do teclado ---------- */
  document.addEventListener("keydown", function (ev) {
    if (ev.altKey && ev.shiftKey && !ev.ctrlKey) {
      var k = (ev.key || "").toLowerCase();
      if (k === "d" || k === "v" || ev.code === "KeyD" || ev.code === "KeyV") { ev.preventDefault(); aplicarVoz(!vozSite.ligada, true); return; }
      if (k === "a" || ev.code === "KeyA") {
        ev.preventDefault();
        var ad = document.getElementById("audiodescricao-pagina");
        var tocandoAD = ad && ad.querySelector(".botao-tocar").getAttribute("data-estado") === "tocando";
        if (tocandoAD) ad.querySelector(".botao-tocar").click(); // aperta de novo: pausa
        else tocarAudiodescricao();
        return;
      }
    }
    if (ev.key === "Escape" && vozSite.ligada) { pararFala(); destacar(null); }
  });

  /* ---------- Roda das crianças: clicar num rosto leva ao cartão dela ---------- */
  document.addEventListener("click", function (ev) {
    var link = ev.target.closest && ev.target.closest(".roda-rosto");
    if (!link || ev.defaultPrevented) return;
    var hash = link.getAttribute("href");
    var cartao = document.getElementById(hash.slice(1));
    if (!cartao) return;
    ev.preventDefault();
    var suave = !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (history.pushState) history.pushState(null, "", hash);
    cartao.scrollIntoView({ behavior: suave ? "smooth" : "auto", block: "start" });
    // Faz o cartão piscar de novo, mesmo se já estiver selecionado
    Array.prototype.forEach.call(document.querySelectorAll(".personagem.chegou"), function (c) { c.classList.remove("chegou"); });
    void cartao.offsetWidth;
    cartao.classList.add("chegou");
    // O foco vai para o cartão depois da rolagem (o leitor de tela lê a criança).
    // Se a rolagem suave não andar (ex.: aba em segundo plano), pula direto.
    window.setTimeout(function () {
      var r = cartao.getBoundingClientRect();
      if (r.top < -10 || r.top > window.innerHeight * 0.5) cartao.scrollIntoView({ behavior: "instant", block: "start" });
      cartao.focus({ preventScroll: true });
    }, suave ? 900 : 0);
  });

  /* ---------- Ferramentas para as outras páginas (quiz, criar) ---------- */
  window.Circulo = {
    ler: ler,
    guardar: guardar,
    anunciar: anunciar,
    frasesDe: frasesDe,
    proteger: proteger,
    falar: falar,
    pararFala: pararFala,
    temVoz: temVoz,
    sinalizarFila: sinalizarFila,
    pararLibras: pararLibras,
    librasDisponivel: librasCarregou,
    avatarAberto: avatarAberto
  };
})();
