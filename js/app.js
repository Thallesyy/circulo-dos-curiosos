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
     Leitura em voz alta (voz do navegador)
     ========================================================= */
  var fala = { id: 0, voz: null };
  var temVoz = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  function escolherVoz() {
    if (!temVoz) return;
    var vozes = window.speechSynthesis.getVoices();
    fala.voz = vozes.filter(function (v) { return /pt[-_]BR/i.test(v.lang); })[0] ||
               vozes.filter(function (v) { return /^pt/i.test(v.lang); })[0] || null;
  }
  if (temVoz) {
    escolherVoz();
    window.speechSynthesis.addEventListener && window.speechSynthesis.addEventListener("voiceschanged", escolherVoz);
  }
  function pararFala() {
    fala.id++;
    if (temVoz) window.speechSynthesis.cancel();
  }
  function falar(lista, aoFrase, aoFim) {
    pararFala();
    if (!temVoz) { anunciar("Este navegador não tem leitura em voz alta."); if (aoFim) aoFim(); return; }
    var id = fala.id;
    var i = 0;
    (function proxima() {
      if (id !== fala.id) return;
      if (i >= lista.length) { if (aoFim) aoFim(); return; }
      if (aoFrase) aoFrase(i);
      var u = new window.SpeechSynthesisUtterance(lista[i]);
      u.lang = "pt-BR";
      if (fala.voz) u.voice = fala.voz;
      u.rate = 0.95;
      u.onend = function () { i++; proxima(); };
      u.onerror = function () { if (id === fala.id) { i++; proxima(); } };
      window.speechSynthesis.speak(u);
    })();
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
     Voz do site: para quem não usa leitor de tela.
     Fala em voz alta o nome de cada botão, link ou campo
     quando ele recebe o foco (tecla Tab).
     ========================================================= */
  var vozSite = { ligada: ler("voz-site") === "1" };
  var botoesVoz = Array.prototype.slice.call(document.querySelectorAll("#voz-site, [data-alternar-voz]"));

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
    return el.innerText || el.value || el.title || "";
  }

  function descrever(el) {
    if (!el || el === document.body) return "";
    var nome = limpar(nomeDe(el)).slice(0, 220);
    var tag = el.tagName;
    var tipo = (el.getAttribute("type") || "").toLowerCase();
    var extra = [];
    if (/^H[1-6]$/.test(tag)) return "Título: " + nome;
    if (tag === "A") return "Link: " + nome;
    if (tag === "SUMMARY") {
      var aberto = el.parentElement && el.parentElement.open;
      return nome + ", botão para " + (aberto ? "fechar" : "abrir");
    }
    if (tag === "BUTTON") {
      if (el.hasAttribute("aria-pressed")) extra.push(el.getAttribute("aria-pressed") === "true" ? "ligado" : "desligado");
      if (el.hasAttribute("aria-expanded")) extra.push(el.getAttribute("aria-expanded") === "true" ? "aberto" : "fechado");
      if (el.disabled) extra.push("indisponível");
      return nome + ", botão" + (extra.length ? ", " + extra.join(", ") : "");
    }
    if (tag === "INPUT" && tipo === "checkbox") return nome + ", caixa de marcar, " + (el.checked ? "marcada" : "desmarcada");
    if (tag === "INPUT" && tipo === "radio") return nome + ", opção " + (el.checked ? "escolhida" : "não escolhida") + ". Use as setas para trocar.";
    if (tag === "INPUT" && tipo === "range") return nome + ", barra de posição: " + (el.getAttribute("aria-valuetext") || el.value) + ". Use as setas para andar.";
    if (tag === "SELECT") return nome + ", lista. Escolhido: " + limpar(el.selectedOptions[0] ? el.selectedOptions[0].text : "") + ". Use as setas para trocar.";
    if (tag === "TEXTAREA" || tag === "INPUT") return nome + ", campo para escrever" + (el.value ? ". Escrito: " + el.value.slice(0, 120) : ", vazio");
    if (el.getAttribute("role") === "region") return nome + ". Use as setas para rolar o texto.";
    if (el.id === "conteudo") return "Conteúdo principal da página.";
    return nome;
  }

  function falarVoz(texto) {
    if (!vozSite.ligada || !texto) return;
    falar([texto]);
  }

  function aplicarVoz(ligada, avisar) {
    vozSite.ligada = ligada;
    guardar("voz-site", ligada ? "1" : "0");
    botoesVoz.forEach(function (b) {
      if (b.id === "voz-site") b.setAttribute("aria-pressed", ligada ? "true" : "false");
      var r = b.querySelector(".rotulo") || (b.id === "voz-site" ? null : b);
      if (r) r.textContent = ligada ? "Desligar a voz do site" : "Ligar a voz do site";
    });
    if (!avisar) return;
    if (ligada) {
      falar(["Voz do site ligada. Use a tecla Tab para andar pelos botões e links. Aperte Esc para calar a voz."]);
    } else {
      pararFala();
      anunciar("Voz do site desligada");
      if (temVoz) falar(["Voz do site desligada."]);
    }
  }

  botoesVoz.forEach(function (b) {
    b.addEventListener("click", function () { aplicarVoz(!vozSite.ligada, true); });
  });
  aplicarVoz(vozSite.ligada, false);

  document.addEventListener("focusin", function (ev) {
    if (!vozSite.ligada) return;
    falarVoz(descrever(ev.target));
  });
  document.addEventListener("change", function (ev) {
    if (!vozSite.ligada) return;
    var t = ev.target;
    if (t.type === "checkbox" || t.type === "radio") falarVoz(descrever(t));
  });
  document.addEventListener("toggle", function (ev) {
    if (!vozSite.ligada || ev.target.tagName !== "DETAILS") return;
    falarVoz(ev.target.open ? "Aberto." : "Fechado.");
  }, true);
  // Os avisos da página (ex.: "Resposta certa") também são falados
  aoAnunciar = function (texto) {
    if (vozSite.ligada && !/^(Tocando|Pausado)/.test(texto)) window.setTimeout(function () { falarVoz(texto); }, 350);
  };

  /* ---------- Audiodescrição da página ---------- */
  function tocarAudiodescricao() {
    var ad = document.getElementById("audiodescricao-pagina");
    if (!ad || !ad._api) return false;
    pararFala();
    ad.scrollIntoView({ block: "start" });
    var b = ad.querySelector(".botao-tocar");
    if (b) b.focus({ preventScroll: true });
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
      if (k === "v" || ev.code === "KeyV") { ev.preventDefault(); aplicarVoz(!vozSite.ligada, true); return; }
      if (k === "a" || ev.code === "KeyA") { ev.preventDefault(); tocarAudiodescricao(); return; }
    }
    if (ev.key === "Escape" && vozSite.ligada) pararFala();
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
