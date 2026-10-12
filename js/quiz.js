(function () {
  "use strict";

  var C = window.Circulo;
  var caixa = document.getElementById("quiz");
  if (!caixa || !C) return;

  /* =========================================================
     Perguntas
     ========================================================= */

  // Quiz desafio: 10 perguntas, todas com 4 alternativas
  var DESAFIO = [
    {
      p: "Qual destas frases sobre tributos está correta?",
      opcoes: [
        "Todo imposto é tributo, mas nem todo tributo é imposto.",
        "Todo tributo é imposto, mas nem todo imposto é tributo.",
        "Imposto e tributo são a mesma coisa, só muda o nome.",
        "Tributo é o que as empresas pagam; imposto é o que as pessoas pagam."
      ],
      certa: 0,
      explica: "O imposto é um dos tipos de tributo. As taxas e as contribuições também são tributos.",
      historia: 3
    },
    {
      p: "A coleta de lixo de uma rua é paga com um tributo cobrado por esse serviço específico. Que tipo de tributo é esse?",
      opcoes: ["Imposto", "Taxa", "Contribuição", "Multa"],
      certa: 1,
      explica: "Taxa é o tributo pago por um serviço específico, como a coleta de lixo ou tirar um documento. O imposto ajuda a pagar vários serviços ao mesmo tempo.",
      historia: 3
    },
    {
      p: "Na história “A viagem de uma moeda”, o que acontece com o dinheiro arrecadado?",
      opcoes: [
        "Cada moeda vai direto para a escola escolhida por quem pagou.",
        "Ele é juntado, planejado no orçamento e usado em serviços públicos.",
        "Ele fica guardado com o prefeito até o fim do mandato.",
        "Ele volta para quem pagou no fim do ano."
      ],
      certa: 1,
      explica: "Uma moeda não vai direto para uma escola. O dinheiro de todos é juntado, planejado no orçamento e depois vira serviço público.",
      historia: 4
    },
    {
      p: "Quem aprova o orçamento, o plano de como o dinheiro público vai ser gasto?",
      opcoes: [
        "O presidente ou o prefeito, sozinhos, sem ninguém aprovar.",
        "Os representantes eleitos, como vereadores, deputados e senadores.",
        "As empresas que pagam mais tributos.",
        "O Portal da Transparência."
      ],
      certa: 1,
      explica: "O orçamento precisa ser aprovado pelos representantes que a população escolhe pelo voto. O Portal da Transparência serve para acompanhar os gastos, não para aprovar.",
      historia: 4
    },
    {
      p: "Além de registrar a compra, a nota fiscal também ajuda…",
      opcoes: [
        "a loja a cobrar um preço maior.",
        "o consumidor a trocar produtos com defeito e os tributos a chegarem aos cofres públicos.",
        "o comprador a não pagar tributos.",
        "apenas o vendedor a organizar o estoque."
      ],
      certa: 1,
      explica: "A nota fiscal garante a troca e a garantia, e mostra que a venda foi registrada. Assim, os tributos daquela compra chegam aos cofres públicos.",
      historia: 5
    },
    {
      p: "Uma loja registra só metade das vendas, de propósito, para pagar menos tributos. Isso é…",
      opcoes: ["um erro sem importância.", "sonegação fiscal.", "corrupção.", "uma taxa."],
      certa: 1,
      explica: "Esconder vendas de propósito para pagar menos tributos é sonegação. Um erro acontece sem a intenção de esconder.",
      historia: 6
    },
    {
      p: "Onde qualquer pessoa pode ver como o governo federal gasta o dinheiro público?",
      opcoes: [
        "No Portal da Transparência.",
        "Na nota fiscal de cada compra.",
        "No orçamento da própria família.",
        "Em lugar nenhum: só os prefeitos podem ver."
      ],
      certa: 0,
      explica: "No Portal da Transparência qualquer pessoa pode ver os gastos do governo federal. Os estados e as prefeituras também têm os seus portais.",
      historia: 9
    },
    {
      p: "Alguém oferece um presente a um funcionário público para ser atendido antes de todo mundo. Isso é…",
      opcoes: ["gentileza.", "sonegação fiscal.", "corrupção.", "fiscalização."],
      certa: 2,
      explica: "Oferecer um presente para conseguir uma vantagem que não é certa é corrupção, mesmo que pareça só um favorzinho.",
      historia: 8
    },
    {
      p: "Para o Círculo dos Curiosos, fiscalizar significa…",
      opcoes: [
        "procurar culpados para castigar.",
        "acompanhar, perguntar, buscar informações e participar.",
        "deixar que só os adultos cuidem disso.",
        "reclamar sem buscar informações."
      ],
      certa: 1,
      explica: "Fiscalizar não é procurar culpados. É acompanhar, perguntar, buscar informações e participar. Quem participa ajuda a transformar.",
      historia: 9
    },
    {
      p: "Uma área do pátio quase não era usada. O que o grupo descobriu e propôs?",
      opcoes: [
        "Que o lugar era feio, e propôs pintar as paredes.",
        "Que havia um problema de acessibilidade, e propôs rampas, sinalização e comunicação inclusiva.",
        "Que faltavam brinquedos, e propôs comprar mais.",
        "Que o pátio era grande demais, e propôs fechar uma parte."
      ],
      certa: 1,
      explica: "O espaço não era acessível. O grupo propôs rampas e sinalização, informações acessíveis, comunicação inclusiva e mais uso do espaço.",
      historia: 9
    }
  ];

  // Quiz fácil (acessível): 5 perguntas curtas, todas com 3 alternativas e figuras
  var FACIL = [
    {
      p: "Dinheiro público é de quem?",
      opcoes: [{ t: "De todos", ic: "pessoas" }, { t: "Só do prefeito", ic: "coroa" }, { t: "De ninguém", ic: "nao" }],
      certa: 0,
      explica: "Dinheiro público é de todos. Ele paga escola, saúde e praça.",
      historia: 2
    },
    {
      p: "Você comprou um lanche. O que você pede?",
      opcoes: [{ t: "A nota fiscal", ic: "nota" }, { t: "Um presente", ic: "presente" }, { t: "Nada", ic: "nao" }],
      certa: 0,
      explica: "A nota fiscal mostra que a compra foi registrada.",
      historia: 5
    },
    {
      p: "A lixeira da escola quebrou. O que fazer?",
      opcoes: [{ t: "Avisar e ajudar a cuidar", ic: "coracao" }, { t: "Quebrar mais", ic: "martelo" }, { t: "Fingir que não viu", ic: "olhoFechado" }],
      certa: 0,
      explica: "A lixeira é de todos. Todos cuidam.",
      historia: 7
    },
    {
      p: "Os tributos ajudam a pagar o quê?",
      opcoes: [{ t: "Escola, saúde e praça", ic: "escola" }, { t: "Brinquedos do prefeito", ic: "bola" }, { t: "Nada", ic: "nao" }],
      certa: 0,
      explica: "Os tributos viram serviços para todo mundo.",
      historia: 2
    },
    {
      p: "A rampa ajuda quem?",
      opcoes: [{ t: "Todo mundo", ic: "acesso" }, { t: "Ninguém", ic: "nao" }, { t: "Só os professores", ic: "livro" }],
      certa: 0,
      explica: "A rampa ajuda quem usa cadeira de rodas e muita gente mais.",
      historia: 9
    }
  ];

  var TITULOS = {
    2: "O dinheiro que vai e volta", 3: "Afinal, o que são impostos?", 4: "A viagem de uma moeda", 5: "Cadê a nota?",
    6: "O segredo escondido", 7: "Isso é de quem?", 8: "O favor", 9: "Os detetives da cidadania"
  };
  var LETRAS = ["A", "B", "C", "D"];

  /* =========================================================
     Figuras
     ========================================================= */
  function svg(corpo, classe) {
    return '<svg class="' + (classe || "") + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + corpo + "</svg>";
  }
  var FIG = {
    pessoas: '<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="8.5" r="2.5"/><path d="M2.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6M13.5 14.6c.9-.4 1.9-.6 3-.6 2.8 0 5 2.4 5 5.5"/>',
    coroa: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/><path d="M5 19h14"/>',
    nao: '<circle cx="12" cy="12" r="9"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/>',
    nota: '<path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    presente: '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11"/><path d="M12 9c-1.5-3-5-4-5-1.5S10 9 12 9c2 0 5 .5 5-1.5S13.5 6 12 9z"/>',
    coracao: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10C19.5 15.4 12 20 12 20z"/>',
    martelo: '<path d="M14 4l6 6-2.5 2.5-6-6z"/><path d="M12.8 7.7L4 16.5a2.1 2.1 0 0 0 3 3l8.8-8.8"/>',
    olhoFechado: '<path d="M3 10c2.5 3 5.5 4.5 9 4.5s6.5-1.5 9-4.5"/><path d="M6 13.5L4.5 16M12 14.5V17.5M18 13.5l1.5 2.5"/>',
    escola: '<path d="M3 21h18M5 21V10l7-5 7 5v11"/><path d="M10 21v-5h4v5M12 8.5v2"/>',
    bola: '<circle cx="12" cy="12" r="9"/><path d="M12 3c-3 3-3 15 0 18M3.5 9h17M3.5 15h17"/>',
    acesso: '<circle cx="12" cy="4.5" r="1.8"/><path d="M6 8.5l6 1 6-1M12 9.5v5l-3 5.5M12 14.5l3 5.5"/>',
    livro: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
    som: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>',
    maos: '<path d="M7 11V5.5a1.5 1.5 0 0 1 3 0V10M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12M16 9.5a1.5 1.5 0 0 1 3 0V14c0 4-3 7-7 7s-6-2.5-7-5l-1.5-3.5a1.5 1.5 0 0 1 2.7-1.3L7 13"/>',
    estrela: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    alvo: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>'
  };

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function embaralhar(lista) {
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function textoOpcao(q, k) { return typeof q.opcoes[k] === "string" ? q.opcoes[k] : q.opcoes[k].t; }

  /* =========================================================
     Estado
     ========================================================= */
  var estado = null;
  var ferr = null; // botões "Ouvir" e "Ver em Libras" da pergunta atual

  // Lê em voz alta e deixa o botão "Ouvir" mostrando "Parar" enquanto fala
  function falarComBotao(frases) {
    if (!ferr) { C.falar(frases); return; }
    ferr.ouvir.setAttribute("aria-pressed", "true");
    ferr.ouvir.querySelector(".rotulo").textContent = "Parar";
    C.falar(frases, null, ferr.fimOuvir);
  }
  function calar() {
    C.pararFala();
    if (ferr) ferr.fimOuvir();
  }
  var vozAutomatica = C.ler("quiz-voz") !== "0"; // no quiz fácil, lê sozinho (pode desligar)

  function novoJogo(modo) {
    var lista = modo === "facil" ? FACIL : DESAFIO;
    estado = {
      modo: modo,
      lista: lista,
      i: 0,
      acertos: 0,
      respostas: [],
      erros: 0,
      ordens: lista.map(function (q) { return embaralhar(q.opcoes.map(function (_, k) { return k; })); })
    };
    mostrarPergunta();
  }

  /* =========================================================
     Libras e voz: pergunta + alternativas
     ========================================================= */
  function frasesDaPergunta() {
    var q = estado.lista[estado.i];
    var ordem = estado.ordens[estado.i];
    var frases = ["Pergunta " + (estado.i + 1) + " de " + estado.lista.length + ".", q.p];
    ordem.forEach(function (k, n) {
      var t = textoOpcao(q, k);
      frases.push("Alternativa " + LETRAS[n] + ": " + t + (/[.!?…]$/.test(t) ? "" : "."));
    });
    return frases;
  }

  var librasDaVez = null;   // o que o avatar deve sinalizar agora (pergunta ou resposta)
  function sinalizar(frases) {
    librasDaVez = frases;
    C.sinalizarFila(frases);
  }

  // Quando a pessoa abre o avatar do VLibras, ele já começa a sinalizar a pergunta e as alternativas
  var avatarEstavaAberto = C.avatarAberto();
  window.setInterval(function () {
    var aberto = C.avatarAberto();
    if (aberto && !avatarEstavaAberto && estado && librasDaVez) {
      C.anunciar("Avatar de Libras aberto. Sinalizando a pergunta.");
      C.sinalizarFila(librasDaVez);
    }
    if (!aberto && avatarEstavaAberto) C.pararLibras(); // fechou o avatar: para a fila
    avatarEstavaAberto = aberto;
  }, 700);

  // Sempre que aparece algo novo, se o avatar estiver aberto, ele sinaliza sozinho
  function librasAutomatica(frases) {
    librasDaVez = frases;
    if (C.avatarAberto()) C.sinalizarFila(frases);
  }

  function ligarFerramentas(frases) {
    var ouvir = document.getElementById("q-ouvir");
    var libras = document.getElementById("q-libras");
    function fimOuvir() {
      ouvir.setAttribute("aria-pressed", "false");
      ouvir.querySelector(".rotulo").textContent = estado.modo === "facil" ? "Ouvir de novo" : "Ouvir a pergunta";
    }
    ouvir.addEventListener("click", function () {
      if (ouvir.getAttribute("aria-pressed") === "true") { C.pararFala(); fimOuvir(); return; }
      ouvir.setAttribute("aria-pressed", "true");
      ouvir.querySelector(".rotulo").textContent = "Parar";
      C.falar(frases, null, fimOuvir);
    });
    libras.addEventListener("click", function () { sinalizar(librasDaVez || frases); });
    var auto = document.getElementById("q-auto");
    if (auto) {
      auto.checked = vozAutomatica;
      auto.addEventListener("change", function () {
        vozAutomatica = auto.checked;
        C.guardar("quiz-voz", vozAutomatica ? "1" : "0");
        if (!vozAutomatica) { C.pararFala(); fimOuvir(); }
      });
    }
    return { fimOuvir: fimOuvir, ouvir: ouvir };
  }

  function ferramentasHTML() {
    var facil = estado.modo === "facil";
    return '<div class="quiz-ferramentas">' +
      '<button type="button" class="botao-opcao" id="q-ouvir" aria-pressed="false">' + svg(FIG.som) +
      '<span class="rotulo">' + (facil ? "Ouvir de novo" : "Ouvir a pergunta") + "</span></button>" +
      '<button type="button" class="botao-opcao" id="q-libras">' + svg(FIG.maos) + "Ver em Libras</button>" +
      (facil ? '<label class="auto-voz"><input type="checkbox" id="q-auto"> Ler sozinho em voz alta</label>' : "") +
      "</div>";
  }

  /* =========================================================
     Telas
     ========================================================= */
  function telaInicial() {
    C.pararFala();
    ferr = null;
    estado = null;
    librasDaVez = ["Escolha o quiz.", "Quiz desafio: dez perguntas, com quatro alternativas cada.",
      "Quiz fácil: cinco perguntas curtas, com três alternativas e figuras."];
    caixa.innerHTML =
      '<h2 class="quiz-titulo" id="q-inicio" tabindex="-1">Escolha o seu quiz</h2>' +
      '<div class="modos">' +
      '<button type="button" class="modo cor-laranja" data-modo="desafio">' + svg(FIG.alvo, "modo-icone") +
      "<strong>Quiz desafio</strong><span>10 perguntas, 4 alternativas em cada uma. Para quem já ouviu as histórias e quer se testar.</span></button>" +
      '<button type="button" class="modo cor-verde" data-modo="facil">' + svg(FIG.estrela, "modo-icone") +
      "<strong>Quiz fácil</strong><span>5 perguntas curtas, 3 alternativas com figuras. Lê em voz alta e dá para tentar de novo.</span></button>" +
      "</div>" +
      '<p class="dica-libras">' + svg(FIG.maos) +
      "<span>Para ver em Libras, abra o avatar do VLibras (botão azul na lateral) ou aperte <strong>Ver em Libras</strong>. Ele sinaliza a pergunta e todas as alternativas.</span></p>";
    C.proteger(caixa);
    Array.prototype.forEach.call(caixa.querySelectorAll("[data-modo]"), function (b) {
      b.addEventListener("click", function () { novoJogo(b.getAttribute("data-modo")); });
    });
  }

  function progressoHTML(atual) {
    var facil = estado.modo === "facil";
    var lis = estado.lista.map(function (_, k) {
      var r = estado.respostas[k];
      var cls = r === undefined ? (k === atual ? "atual" : "") : (facil || r.certo ? "certa" : "errada");
      var simbolo = r === undefined ? (k + 1) : (facil ? "★" : (r.certo ? "✓" : "✗"));
      return '<li class="' + cls + '">' + simbolo + "</li>";
    }).join("");
    return '<ul class="moedas" aria-hidden="true">' + lis + "</ul>";
  }

  function mostrarPergunta() {
    C.pararFala();
    var k = estado.i;
    var q = estado.lista[k];
    var ordem = estado.ordens[k];
    var facil = estado.modo === "facil";
    var contador = "Pergunta " + (k + 1) + " de " + estado.lista.length;
    var cabecalho = progressoHTML(k) +
      (facil ? "" : '<p class="placar">Moedas no cofrinho: ' + estado.acertos + "</p>") +
      ferramentasHTML();

    if (facil) {
      var botoes = ordem.map(function (idx, n) {
        var o = q.opcoes[idx];
        return '<button type="button" class="opcao-facil" data-valor="' + idx + '">' +
          svg(FIG[o.ic], "opcao-figura") + '<span class="opcao-letra" aria-hidden="true">' + LETRAS[n] + "</span>" +
          '<span class="opcao-texto">' + esc(o.t) + '</span><span class="opcao-situacao"></span></button>';
      }).join("");
      caixa.innerHTML = cabecalho +
        '<h2 class="pergunta-facil" id="q-legenda" tabindex="-1"><span class="contador">' + contador + "</span>" + esc(q.p) + "</h2>" +
        '<div class="opcoes-faceis" role="group" aria-labelledby="q-legenda">' + botoes + "</div>" +
        '<div id="q-retorno" aria-live="polite"></div>';
    } else {
      var alternativas = ordem.map(function (idx, n) {
        return '<label class="alternativa"><input type="radio" name="resposta" value="' + idx + '">' +
          '<span><span aria-hidden="true">' + LETRAS[n] + ") </span>" + esc(q.opcoes[idx]) + "</span></label>";
      }).join("");
      caixa.innerHTML = cabecalho +
        '<form id="q-form" novalidate><fieldset>' +
        '<legend id="q-legenda" tabindex="-1"><span class="contador">' + contador + "</span>" + esc(q.p) + "</legend>" +
        '<div class="alternativas">' + alternativas + "</div></fieldset>" +
        '<p class="erro-form" id="q-erro" hidden>Escolha uma resposta antes de continuar.</p>' +
        '<div class="quiz-acoes"><button type="submit" class="botao botao-principal">Responder</button></div>' +
        "</form>" +
        '<div id="q-retorno"></div>';
    }
    C.proteger(caixa);

    var frases = frasesDaPergunta();
    ferr = ligarFerramentas(frases);
    librasAutomatica(frases);

    if (facil) {
      Array.prototype.forEach.call(caixa.querySelectorAll(".opcao-facil"), function (b) {
        b.addEventListener("click", function () { responderFacil(b); });
      });
      if (vozAutomatica) falarComBotao(frases);
    } else {
      var form = document.getElementById("q-form");
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        var marcada = form.querySelector("input[name=resposta]:checked");
        var erro = document.getElementById("q-erro");
        if (!marcada) { erro.hidden = false; form.querySelector("input").focus(); return; }
        erro.hidden = true;
        responderDesafio(parseInt(marcada.value, 10));
      });
    }
    if (k > 0 || facil) document.getElementById("q-legenda").focus();
  }

  function retornoHTML(certo, titulo, q, ultima) {
    return '<div class="retorno ' + (certo ? "cor-verde" : "cor-coral") + '">' +
      '<h3 id="q-titulo-retorno" tabindex="-1">' + esc(titulo) + "</h3>" +
      "<p>" + esc(q.explica) + "</p>" +
      '<p>Para ouvir sobre isso: <a href="index.html#historia-' + q.historia + '">História ' + q.historia + ": " + esc(TITULOS[q.historia]) + "</a></p>" +
      "</div>" +
      '<div class="quiz-acoes"><button type="button" class="botao botao-principal" id="q-proxima">' +
      (ultima ? "Ver o resultado" : "Próxima pergunta") + "</button></div>";
  }

  function depoisDeAcertarOuErrar(certo, titulo, q) {
    var ultima = estado.i === estado.lista.length - 1;
    var ret = document.getElementById("q-retorno");
    ret.innerHTML = retornoHTML(certo, titulo, q, ultima);
    C.proteger(ret);
    document.getElementById("q-titulo-retorno").focus();
    var falar = [titulo, q.explica];
    librasAutomatica(falar);
    calar();
    if (estado.modo === "facil" && vozAutomatica) falarComBotao(falar);
    document.getElementById("q-proxima").addEventListener("click", function () {
      if (ultima) { mostrarResultado(); return; }
      estado.i++;
      mostrarPergunta();
    });
    var placar = caixa.querySelector(".placar");
    if (placar) placar.textContent = "Moedas no cofrinho: " + estado.acertos;
    caixa.querySelector(".moedas").outerHTML = progressoHTML(estado.i);
  }

  function responderDesafio(escolha) {
    var q = estado.lista[estado.i];
    var certo = escolha === q.certa;
    estado.respostas[estado.i] = { escolha: escolha, certo: certo };
    if (certo) estado.acertos++;
    Array.prototype.forEach.call(caixa.querySelectorAll(".alternativa"), function (lab) {
      var inp = lab.querySelector("input");
      var v = parseInt(inp.value, 10);
      inp.disabled = true;
      if (v === q.certa) {
        lab.classList.add("e-certa");
        lab.insertAdjacentHTML("beforeend", '<span class="marca-resposta">✓ Certa</span>');
      } else if (v === escolha) {
        lab.classList.add("e-errada");
        lab.insertAdjacentHTML("beforeend", '<span class="marca-resposta">✗ Sua resposta</span>');
      }
    });
    caixa.querySelector("#q-form .quiz-acoes").hidden = true;
    depoisDeAcertarOuErrar(certo, certo ? "Isso! Mais uma moeda no cofrinho." : "Quase! A resposta certa está marcada em verde.", q);
  }

  // No quiz fácil dá para tentar de novo até acertar
  function responderFacil(botao) {
    var q = estado.lista[estado.i];
    var valor = parseInt(botao.getAttribute("data-valor"), 10);
    calar();
    if (valor !== q.certa) {
      estado.erros++;
      botao.classList.add("errada");
      botao.disabled = true;
      botao.querySelector(".opcao-situacao").textContent = "Ainda não";
      var msg = "Quase! Tente outra resposta.";
      var ret = document.getElementById("q-retorno");
      ret.innerHTML = '<p class="tente-de-novo">' + msg + "</p>";
      librasAutomatica([msg]);
      if (vozAutomatica) falarComBotao([msg]);
      var proximo = caixa.querySelector(".opcao-facil:not(:disabled)");
      if (proximo) proximo.focus();
      return;
    }
    var dePrimeira = !caixa.querySelector(".opcao-facil.errada");
    estado.respostas[estado.i] = { escolha: valor, certo: true, dePrimeira: dePrimeira };
    if (dePrimeira) estado.acertos++;
    botao.classList.add("certa");
    botao.querySelector(".opcao-situacao").textContent = "Certa!";
    Array.prototype.forEach.call(caixa.querySelectorAll(".opcao-facil"), function (b) { b.disabled = true; });
    depoisDeAcertarOuErrar(true, "Muito bem!", q);
  }

  function mostrarResultado() {
    C.pararFala();
    ferr = null;
    var total = estado.lista.length;
    var a = estado.acertos;
    var facil = estado.modo === "facil";
    var titulo, msg, grande;
    if (facil) {
      titulo = "Você respondeu as " + total + " perguntas!";
      grande = new Array(total + 1).join("★");
      msg = a === total ? "Acertou todas de primeira. Parabéns!" : "Acertou " + a + " de primeira. Cada tentativa também ensina!";
    } else {
      titulo = "Você acertou " + a + " de " + total + "!";
      grande = a + "/" + total;
      msg = a === total ? "Incrível! Você é um verdadeiro detetive da cidadania."
        : a >= 7 ? "Muito bem! Você entendeu quase tudo sobre educação fiscal."
        : a >= 4 ? "Bom trabalho! Que tal ouvir as histórias de novo e tentar mais uma vez?"
        : "Todo curioso começa assim. Ouça as histórias e tente de novo!";
    }
    var revisao = facil ? "" : '<div class="revisao"><h3>As respostas</h3><ol>' + estado.lista.map(function (q, k) {
      var r = estado.respostas[k];
      return "<li><strong>" + esc(q.p) + "</strong><br>" +
        (r.certo ? "✓ Você acertou: " : "✗ A resposta certa é: ") + esc(q.opcoes[q.certa]) + "</li>";
    }).join("") + "</ol></div>";
    var outro = facil ? "desafio" : "facil";
    caixa.innerHTML =
      '<div class="resultado">' +
      '<h2 id="q-resultado" tabindex="-1">' + esc(titulo) + "</h2>" +
      '<p class="grande" aria-hidden="true">' + grande + "</p>" +
      progressoHTML(-1) +
      "<p>" + esc(msg) + "</p>" +
      '<div class="quiz-acoes" style="justify-content:center">' +
      '<button type="button" class="botao botao-principal" id="q-denovo">Jogar de novo</button>' +
      '<button type="button" class="botao" id="q-outro">' + (facil ? "Fazer o quiz desafio" : "Fazer o quiz fácil") + "</button>" +
      '<button type="button" class="botao" id="q-inicio-btn">Escolher outro quiz</button></div>' +
      revisao + "</div>";
    C.proteger(caixa);
    document.getElementById("q-resultado").focus();
    var modo = estado.modo;
    document.getElementById("q-denovo").addEventListener("click", function () { novoJogo(modo); });
    document.getElementById("q-outro").addEventListener("click", function () { novoJogo(outro); });
    document.getElementById("q-inicio-btn").addEventListener("click", function () {
      telaInicial();
      document.getElementById("q-inicio").focus();
    });
    var falar = [titulo, msg];
    librasAutomatica(falar);
    if (facil && vozAutomatica) C.falar(falar);
    C.anunciar(titulo);
  }

  telaInicial();
})();
