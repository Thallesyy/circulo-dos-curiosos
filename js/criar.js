(function () {
  "use strict";

  var C = window.Circulo;
  var form = document.getElementById("criar-form");
  if (!form || !C) return;

  var resultado = document.getElementById("resultado");
  var erro = document.getElementById("erro-form");
  var MAX_PERSONAGENS = 3;

  /* ---------- Peças da história ---------- */
  var LUGARES = {
    escola:     { em: "na escola",          perto: "da escola",          o: "a escola" },
    praca:      { em: "na praça",           perto: "da praça",           o: "a praça" },
    mercado:    { em: "no mercado",         perto: "do mercado",         o: "o mercado" },
    biblioteca: { em: "na biblioteca",      perto: "da biblioteca",      o: "a biblioteca" },
    posto:      { em: "no posto de saúde",  perto: "do posto de saúde",  o: "o posto de saúde" },
    onibus:     { em: "no ônibus",          perto: "do ponto de ônibus", o: "o ônibus" }
  };

  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

  var MISTERIOS = {
    lixeira: {
      titulo: "A lixeira misteriosa",
      inicio: function (c) {
        return [
          "Era um dia comum " + c.lugar.em + ".",
          c.grupo + " " + c.v("encontrou", "encontraram") + " uma lixeira quebrada.",
          "— De quem é isso? — perguntou " + c.primeiro + ".",
          "Então " + c.v("lembrou", "lembraram") + " do que o Círculo dos Curiosos já sabia: a lixeira é um bem público.",
          "É de todos, e todos precisam cuidar dela.",
          "E o conserto é pago com dinheiro público, que vem dos tributos pagos por todo mundo."
        ];
      },
      final: "Dias depois, a lixeira foi consertada. E todo mundo passou a cuidar melhor das coisas que são de todos.",
      licao: "cuidar do que é de todos também é cidadania",
      pensar: "O que você pode fazer para cuidar dos bens públicos da sua escola?"
    },
    nota: {
      titulo: "O caso da nota sumida",
      inicio: function (c) {
        return [
          "Era um dia comum " + c.lugar.em + ".",
          c.grupo + " " + c.v("viu", "viram") + " alguém fazer uma compra, e o vendedor não entregou a nota fiscal.",
          "— Sem nota? — estranhou " + c.primeiro + ".",
          "A nota fiscal registra a compra e ajuda a trocar um produto com defeito.",
          "Ela também faz os tributos daquela venda chegarem aos cofres públicos.",
          "Sem nota, falta dinheiro para escolas, hospitais e praças."
        ];
      },
      final: "No fim da semana, o vendedor começou a entregar a nota fiscal em todas as compras. Uma atitude pequena tinha feito diferença.",
      licao: "pedir a nota fiscal é uma atitude de cidadania",
      pensar: "Na próxima compra da sua família, alguém vai pedir a nota fiscal?"
    },
    rampa: {
      titulo: "O lugar sem rampa",
      inicio: function (c) {
        return [
          "Era um dia comum " + c.lugar.em + ".",
          c.grupo + " " + c.v("percebeu", "perceberam") + " que ali não havia rampa.",
          "Quem usa cadeira de rodas não conseguia passar.",
          "— Esse lugar é de todos, mas nem todos conseguem usar — disse " + c.primeiro + ".",
          "Um espaço público só é de todos quando todos conseguem usar.",
          "Rampas, corrimãos e piso tátil ajudam muita gente, e são construídos com dinheiro público."
        ];
      },
      final: "Algum tempo depois, a rampa foi construída. E agora todo mundo podia entrar.",
      licao: "um espaço só é público de verdade quando todos conseguem usar",
      pensar: "Que lugar da sua cidade precisa ficar mais acessível?"
    },
    luz: {
      titulo: "A rua escura",
      inicio: function (c) {
        return [
          "Perto " + c.lugar.perto + ", a rua estava escura: os postes não acendiam.",
          c.grupo + " " + c.v("ficou", "ficaram") + " com medo de passar por ali à noite.",
          "— Quem cuida da luz da rua? — perguntou " + c.primeiro + ".",
          "A iluminação pública é um serviço pago com o dinheiro dos tributos.",
          "Quem cuida dela é a prefeitura."
        ];
      },
      final: "Na semana seguinte, os postes voltaram a acender. A rua ficou clara e segura para todos.",
      licao: "os serviços públicos são pagos com o dinheiro de todos",
      pensar: "Que serviço público você usa todos os dias?"
    },
    favor: {
      titulo: "O favorzinho",
      inicio: function (c) {
        return [
          "Era um dia comum " + c.lugar.em + ".",
          c.grupo + " " + c.v("ouviu", "ouviram") + " alguém oferecer um presente para passar na frente de todo mundo.",
          "— É só um favorzinho — disse a pessoa.",
          "Mas " + c.primeiro + " lembrou da história do Ravi: oferecer ou receber uma vantagem que não é certa é corrupção.",
          "E a corrupção prejudica todo mundo."
        ];
      },
      final: "A pessoa entendeu o recado e foi para o fim da fila, como todo mundo. Honestidade também se aprende com o exemplo.",
      licao: "ser honesto nas pequenas coisas ajuda a cidade inteira",
      pensar: "Como você pode ser honesto nas pequenas coisas do dia a dia?"
    },
    merenda: {
      titulo: "O mistério da merenda",
      inicio: function (c) {
        return [
          "Era hora do lanche " + c.lugar.em + ".",
          c.primeiro + " olhou para o prato e teve uma pergunta:",
          "— De onde vem o dinheiro da merenda?",
          "A merenda das escolas públicas é paga com dinheiro público.",
          "Esse dinheiro vem dos tributos que todos pagam, até daquele que vem escondido no preço das compras."
        ];
      },
      final: "No dia seguinte, a turma toda já sabia: a merenda é um direito, e o dinheiro público precisa ser bem cuidado.",
      licao: "o dinheiro público é para atender as necessidades de todos",
      pensar: "De onde vem o dinheiro dos serviços públicos que você usa?"
    }
  };

  var ACOES = {
    investigar: function (c) {
      return [c.grupo + " " + c.v("decidiu", "decidiram") + " investigar.",
        c.v("Fez", "Fizeram") + " perguntas, " + c.v("anotou", "anotaram") + " tudo num caderno e " +
        c.v("conversou", "conversaram") + " com quem sabia mais sobre o assunto."];
    },
    campanha: function (c) {
      return [c.grupo + " " + c.v("resolveu", "resolveram") + " fazer uma campanha.",
        c.v("Desenhou", "Desenharam") + " cartazes coloridos com a frase “Cuidar do que é de todos também é cidadania” e " +
        c.v("espalhou", "espalharam") + " os cartazes pela escola."];
    },
    nota: function (c) {
      return [c.grupo + " " + c.v("resolveu", "resolveram") + " dar o exemplo.",
        "Em toda compra, " + c.v("passou", "passaram") + " a pedir a nota fiscal, e " +
        c.v("ensinou", "ensinaram") + " a família a fazer o mesmo."];
    },
    conversar: function (c) {
      return [c.grupo + " " + c.v("foi", "foram") + " conversar com a direção da escola.",
        "Depois, " + c.v("escreveu", "escreveram") + " uma carta para a prefeitura, explicando o problema com calma e respeito."];
    },
    libras: function (c) {
      return [c.grupo + " " + c.v("preparou", "prepararam") + " uma apresentação em Libras e um cartaz em braile.",
        "Assim, todo mundo pôde entender a mensagem."];
    },
    transparencia: function (c) {
      return [c.grupo + " " + c.v("pesquisou", "pesquisaram") + " no portal da transparência, com a ajuda de um adulto.",
        "Lá dá para ver como o dinheiro público está sendo usado."];
    }
  };

  /* ---------- Leitura do formulário ---------- */
  function juntarNomes(nomes) {
    if (nomes.length === 1) return nomes[0];
    return nomes.slice(0, -1).join(", ") + " e " + nomes[nomes.length - 1];
  }

  function lerFormulario() {
    var dados = new FormData(form);
    return {
      nome: (dados.get("nome") || "").toString().trim().slice(0, 30),
      personagens: dados.getAll("personagem").map(String),
      lugar: (dados.get("lugar") || "escola").toString(),
      misterio: (dados.get("misterio") || "lixeira").toString(),
      acao: (dados.get("acao") || "investigar").toString(),
      final: (dados.get("final") || "").toString().trim(),
      titulo: (dados.get("titulo") || "").toString().trim()
    };
  }

  function montarHistoria(d) {
    var nomes = d.personagens.slice();
    if (d.nome) nomes.unshift(d.nome);
    var plural = nomes.length > 1;
    var c = {
      grupo: juntarNomes(nomes),
      primeiro: d.personagens[0] || d.nome,
      lugar: LUGARES[d.lugar] || LUGARES.escola,
      v: function (sing, plur) { return plural ? plur : sing; }
    };
    var m = MISTERIOS[d.misterio] || MISTERIOS.lixeira;
    var a = ACOES[d.acao] || ACOES.investigar;
    var finalTexto = d.final || m.final;
    return {
      titulo: d.titulo || m.titulo,
      paragrafos: [
        m.inicio(c),
        a(c),
        C.frasesDe(finalTexto),
        ["E o Círculo dos Curiosos ganhou mais uma descoberta: " + m.licao + "."]
      ],
      pensar: m.pensar,
      autoria: d.nome ? "História criada por " + d.nome + "." : "História criada por um novo membro do Círculo dos Curiosos.",
      personagens: d.personagens
    };
  }

  /* ---------- Mostrar a história ---------- */
  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]; });
  }

  var IC = {
    som: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
    maos: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11V5.5a1.5 1.5 0 0 1 3 0V10M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12M16 9.5a1.5 1.5 0 0 1 3 0V14c0 4-3 7-7 7s-6-2.5-7-5l-1.5-3.5a1.5 1.5 0 0 1 2.7-1.3L7 13"/></svg>',
    imprimir: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/></svg>',
    guardar: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/></svg>',
    lapis: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1-5L16 4l4 4L9 19z"/><path d="M14 6l4 4"/></svg>'
  };

  var historiaAtual = null;
  var dadosAtuais = null;

  function mostrar(h, dados) {
    historiaAtual = h;
    dadosAtuais = dados;
    C.pararFala();
    // Falas com travessão ficam num parágrafo só delas, como nos livros
    var n = 0;
    var corpo = "";
    h.paragrafos.forEach(function (frases) {
      var grupo = [];
      function fechar() {
        if (grupo.length) corpo += "<p>" + grupo.join(" ") + "</p>";
        grupo = [];
      }
      frases.forEach(function (f) {
        var span = '<span class="frase" data-i="' + (n++) + '">' + esc(f) + "</span>";
        if (f.charAt(0) === "—") { fechar(); grupo.push(span); fechar(); }
        else grupo.push(span);
      });
      fechar();
    });
    var rostos = h.personagens.map(function (nome) { return (window.ROSTOS && window.ROSTOS[nome]) || ""; }).join("");
    resultado.innerHTML =
      '<article class="minha-historia" aria-labelledby="h-minha">' +
      '<div class="capa"><div class="rostos" aria-hidden="true">' + rostos + "</div>" +
      '<h2 id="h-minha" tabindex="-1">' + esc(h.titulo) + "</h2></div>" +
      '<div class="conteudo" id="texto-minha">' + corpo +
      '<p class="assinatura">' + esc(h.autoria) + "</p>" +
      '<div class="pensar cor-laranja"><p><strong>Hora de pensar:</strong> ' + esc(h.pensar) + "</p></div></div>" +
      '<div class="acoes-historia">' +
      '<button type="button" class="botao botao-principal" id="m-ouvir" aria-pressed="false">' + IC.som + '<span class="rotulo">Ouvir a história</span></button>' +
      '<button type="button" class="botao" id="m-libras">' + IC.maos + "Ver em Libras</button>" +
      '<button type="button" class="botao" id="m-imprimir">' + IC.imprimir + "Imprimir</button>" +
      '<button type="button" class="botao" id="m-guardar">' + IC.guardar + "Guardar</button>" +
      '<button type="button" class="botao" id="m-outra">' + IC.lapis + "Criar outra</button>" +
      "</div></article>";
    C.proteger(resultado);
    ligarAcoes();
    var titulo = document.getElementById("h-minha");
    titulo.scrollIntoView({ block: "start" });
    titulo.focus();
    C.anunciar("História montada: " + h.titulo);
  }

  function todasFrases() {
    return Array.prototype.slice.call(resultado.querySelectorAll(".frase"));
  }
  function marcar(i) {
    todasFrases().forEach(function (el, k) { el.classList.toggle("agora", k === i); });
  }

  function ligarAcoes() {
    var ouvir = document.getElementById("m-ouvir");
    var libras = document.getElementById("m-libras");
    var frases = todasFrases().map(function (el) { return el.textContent; });
    frases.push(historiaAtual.autoria, "Hora de pensar: " + historiaAtual.pensar);

    function pararOuvir() {
      ouvir.setAttribute("aria-pressed", "false");
      ouvir.querySelector(".rotulo").textContent = "Ouvir a história";
      marcar(-1);
    }
    ouvir.addEventListener("click", function () {
      if (ouvir.getAttribute("aria-pressed") === "true") { C.pararFala(); pararOuvir(); return; }
      ouvir.setAttribute("aria-pressed", "true");
      ouvir.querySelector(".rotulo").textContent = "Parar";
      C.falar(frases, marcar, pararOuvir);
    });

    libras.addEventListener("click", function () {
      C.pararFala(); pararOuvir();
      C.anunciar("Abrindo o avatar de Libras");
      C.sinalizarFila(frases, marcar, function () { marcar(-1); });
    });

    document.getElementById("m-imprimir").addEventListener("click", function () { window.print(); });
    document.getElementById("m-guardar").addEventListener("click", function () {
      var lista = lerGuardadas();
      lista.unshift({ quando: Date.now(), dados: dadosAtuais, titulo: historiaAtual.titulo });
      salvarGuardadas(lista.slice(0, 20));
      desenharGuardadas();
      C.anunciar("História guardada neste aparelho.");
      this.textContent = "Guardada!";
      this.disabled = true;
    });
    document.getElementById("m-outra").addEventListener("click", function () {
      C.pararFala();
      C.pararLibras();
      resultado.innerHTML = "";
      form.reset();
      atualizarLimite();
      var primeiro = document.getElementById("seu-nome");
      primeiro.scrollIntoView({ block: "center" });
      primeiro.focus();
    });
  }

  /* ---------- Histórias guardadas ---------- */
  function lerGuardadas() {
    try { return JSON.parse(C.ler("criadas") || "[]") || []; } catch (e) { return []; }
  }
  function salvarGuardadas(lista) {
    C.guardar("criadas", JSON.stringify(lista));
  }
  function desenharGuardadas() {
    var secao = document.getElementById("guardadas");
    var ul = document.getElementById("lista-guardadas");
    var lista = lerGuardadas();
    secao.hidden = lista.length === 0;
    ul.innerHTML = lista.map(function (item, k) {
      return '<li><span>' + esc(item.titulo) + '</span><span>' +
        '<button type="button" class="botao-opcao" data-abrir="' + k + '">Abrir<span class="so-leitor"> ' + esc(item.titulo) + "</span></button> " +
        '<button type="button" class="botao-opcao" data-apagar="' + k + '">Apagar<span class="so-leitor"> ' + esc(item.titulo) + "</span></button>" +
        "</span></li>";
    }).join("");
    C.proteger(ul);
  }
  document.getElementById("lista-guardadas").addEventListener("click", function (ev) {
    var abrir = ev.target.closest("[data-abrir]");
    var apagar = ev.target.closest("[data-apagar]");
    var lista = lerGuardadas();
    if (abrir) {
      var item = lista[parseInt(abrir.getAttribute("data-abrir"), 10)];
      if (item) mostrar(montarHistoria(item.dados), item.dados);
    } else if (apagar) {
      var k = parseInt(apagar.getAttribute("data-apagar"), 10);
      var titulo = lista[k] && lista[k].titulo;
      lista.splice(k, 1);
      salvarGuardadas(lista);
      desenharGuardadas();
      C.anunciar("Apagada: " + titulo);
      var h = document.getElementById("h-guardadas");
      if (!document.getElementById("guardadas").hidden) { h.setAttribute("tabindex", "-1"); h.focus(); }
    }
  });

  /* ---------- Limite de personagens ---------- */
  var caixasPers = Array.prototype.slice.call(form.querySelectorAll("input[name=personagem]"));
  var dicaPers = document.getElementById("dica-pers");
  function atualizarLimite() {
    var marcadas = caixasPers.filter(function (c) { return c.checked; }).length;
    caixasPers.forEach(function (c) { c.disabled = !c.checked && marcadas >= MAX_PERSONAGENS; });
    dicaPers.textContent = marcadas === 0
      ? "Escolha de uma a três crianças."
      : "Você escolheu " + marcadas + " de 3." + (marcadas >= MAX_PERSONAGENS ? " Para trocar, desmarque uma." : "");
  }
  caixasPers.forEach(function (c) { c.addEventListener("change", atualizarLimite); });
  atualizarLimite();

  /* ---------- Ideia para o final ---------- */
  document.getElementById("dar-ideia").addEventListener("click", function () {
    var d = lerFormulario();
    var m = MISTERIOS[d.misterio] || MISTERIOS.lixeira;
    var campo = document.getElementById("final");
    campo.value = m.final;
    campo.focus();
    C.anunciar("Ideia escrita no campo do final. Você pode mudar como quiser.");
  });

  /* ---------- Enviar ---------- */
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var d = lerFormulario();
    if (d.personagens.length === 0) {
      erro.textContent = "Escolha pelo menos uma criança do Círculo no passo 2.";
      erro.hidden = false;
      erro.focus();
      return;
    }
    erro.hidden = true;
    mostrar(montarHistoria(d), d);
  });

  desenharGuardadas();
})();
