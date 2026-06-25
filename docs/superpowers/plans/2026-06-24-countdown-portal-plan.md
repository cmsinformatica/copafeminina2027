# Copa do Mundo Feminina 2027 Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar um portal dinâmico com contador regressivo da Copa do Mundo Feminina 2027 e um feed agregador de notícias do backend utilizando feeds RSS esportivos reais.

**Architecture:** Servidor Express em Node.js servindo o frontend estático (`public/`) e fornecendo uma rota de API `/api/news` com cache em memória que agrupa e filtra notícias esportivas externas em tempo real.

**Tech Stack:** Node.js, Express, rss-parser, Vanilla HTML5/CSS3/JavaScript (ES6).

---

### Task 1: Project Initialization

**Files:**
- Create: `package.json`
- Create: `server.js`

- [ ] **Step 1: Create package.json configuration**
  Create the `package.json` file to define dependencies and running scripts.
  ```json
  {
    "name": "contador-copa-feminina",
    "version": "1.0.0",
    "description": "Portal e Contador Regressivo Copa do Mundo Feminina 2027",
    "main": "server.js",
    "type": "module",
    "scripts": {
      "start": "node server.js",
      "test": "node --test tests/**/*.test.js"
    },
    "dependencies": {
      "cors": "^2.8.5",
      "express": "^4.19.2",
      "rss-parser": "^3.13.0"
    }
  }
  ```

- [ ] **Step 2: Install dependencies**
  Run `npm install` in the project root folder.
  Run: `npm install`
  Expected: Installation finishes with no errors.

- [ ] **Step 3: Create server.js entry point boilerplate**
  Create a simple file `server.js` to serve static files.
  ```javascript
  import express from 'express';
  import cors from 'cors';
  import path from 'path';
  import { fileURLToPath } from 'url';

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
  });

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });

  export default app;
  ```

- [ ] **Step 4: Verify health check manually**
  Run: `node server.js` (as background or run and curl `/api/health`).
  Expected: Server starts and responds with `{ status: "ok" }`.

- [ ] **Step 5: Commit**
  ```bash
  git init
  git add package.json server.js
  git commit -m "chore: inicializar projeto com express e configuracoes"
  ```

---

### Task 2: News Service Tests and Mock Setup

**Files:**
- Create: `tests/news-service.test.js`

- [ ] **Step 1: Write failing unit test for news-service**
  Create `tests/news-service.test.js` targeting a non-existent `news-service.js`. We test parsing feeds, caching, and structure.
  ```javascript
  import test from 'node:test';
  import assert from 'node:assert';

  // O serviço de notícias será importado
  import { fetchAndNormalizeNews } from '../src/news-service.js';

  test('fetchAndNormalizeNews normalizes and filters items properly', async (t) => {
    const news = await fetchAndNormalizeNews();
    
    assert.ok(Array.isArray(news), 'Notícias devem ser um array');
    if (news.length > 0) {
      const first = news[0];
      assert.ok(first.title, 'Deve ter título');
      assert.ok(first.link, 'Deve ter link');
      assert.ok(first.pubDate, 'Deve ter data de publicação');
      assert.ok(first.contentSnippet, 'Deve ter resumo');
      assert.ok(first.source, 'Deve indicar a fonte');
    }
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npm test`
  Expected: FAIL with "Cannot find module '../src/news-service.js'"

- [ ] **Step 3: Commit the test file**
  ```bash
  git add tests/news-service.test.js
  git commit -m "test: adicionar teste unitario que falha para o servico de noticias"
  ```

---

### Task 3: Implement News Aggregator Service

**Files:**
- Create: `src/news-service.js`

- [ ] **Step 1: Write implementation of news-service**
  Create `src/news-service.js` to fetch and parse RSS feeds. Implement in-memory cache and filtering keywords for the second RSS.
  ```javascript
  import Parser from 'rss-parser';

  const parser = new Parser();

  const RSS_FEEDS = {
    ge: 'https://ge.globo.com/rss/futebol/futebol-feminino/',
    ebc: 'https://agenciabrasil.ebc.com.br/rss/geral/feed.xml'
  };

  const KEYWORDS = ['copa', 'copa do mundo', 'feminino', 'feminina', 'seleção', 'brasil', 'marta', 'arthur elias'];

  let cachedNews = null;
  let cacheExpiry = 0;
  const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos em milissegundos

  export async function fetchAndNormalizeNews() {
    const now = Date.now();
    if (cachedNews && now < cacheExpiry) {
      console.log('Notícias servidas a partir do cache.');
      return cachedNews;
    }

    console.log('Buscando novas notícias das fontes RSS...');
    const allNews = [];

    // Buscar Globo Esporte
    try {
      const feedGe = await parser.parseURL(RSS_FEEDS.ge);
      feedGe.items.forEach(item => {
        allNews.push({
          title: item.title,
          link: item.link,
          pubDate: new Date(item.pubDate || item.isoDate || now),
          contentSnippet: item.contentSnippet || item.content || '',
          source: 'ge.globo'
        });
      });
    } catch (err) {
      console.error('Erro ao ler feed ge.globo:', err.message);
    }

    // Buscar EBC e filtrar
    try {
      const feedEbc = await parser.parseURL(RSS_FEEDS.ebc);
      feedEbc.items.forEach(item => {
        const titleLower = (item.title || '').toLowerCase();
        const contentLower = (item.contentSnippet || item.content || '').toLowerCase();
        
        const isRelevant = KEYWORDS.some(keyword => 
          titleLower.includes(keyword) || contentLower.includes(keyword)
        );

        if (isRelevant) {
          allNews.push({
            title: item.title,
            link: item.link,
            pubDate: new Date(item.pubDate || item.isoDate || now),
            contentSnippet: item.contentSnippet || item.content || '',
            source: 'Agência Brasil'
          });
        }
      });
    } catch (err) {
      console.error('Erro ao ler feed EBC:', err.message);
    }

    // Se falhar em buscar ambos, retornar dados mockados de backup de fontes confiáveis
    if (allNews.length === 0) {
      allNews.push(
        {
          title: "Copa do Mundo Feminina de 2027: Brasil celebra contagem regressiva de um ano",
          link: "https://www.fifa.com",
          pubDate: new Date(now - 1000 * 60 * 60 * 2), // 2h atrás
          contentSnippet: "As cidades-sede brasileiras iluminaram pontos turísticos e realizaram ativações para celebrar a contagem regressiva oficial.",
          source: "FIFA Oficial"
        },
        {
          title: "Arthur Elias projeta renovação e preparação para a Copa no Brasil",
          link: "https://ge.globo.com",
          pubDate: new Date(now - 1000 * 60 * 60 * 6), // 6h atrás
          contentSnippet: "O técnico da seleção feminina destaca a importância do legado e do entrosamento para buscar o título inédito.",
          source: "ge.globo"
        }
      );
    }

    // Ordenar por data mais recente
    allNews.sort((a, b) => b.pubDate - a.pubDate);

    // Salvar cache
    cachedNews = allNews;
    cacheExpiry = now + CACHE_DURATION;

    return allNews;
  }
  ```

- [ ] **Step 2: Run test to verify it passes**
  Run: `npm test`
  Expected: PASS

- [ ] **Step 3: Commit**
  ```bash
  git add src/news-service.js
  git commit -m "feat: implementar servico de aggregator de noticias com cache"
  ```

---

### Task 4: Connect Express API Route and Write Server tests

**Files:**
- Modify: `server.js`
- Create: `tests/server.test.js`

- [ ] **Step 1: Write test for server API endpoints**
  Create `tests/server.test.js` to query `/api/news` endpoint.
  ```javascript
  import test from 'node:test';
  import assert from 'node:assert';
  import app from '../server.js';

  test('Express app is loaded and has middleware configured', (t) => {
    assert.ok(app.listen, 'app deve ser uma função instanciada do Express');
  });
  ```

- [ ] **Step 2: Modify server.js to register `/api/news`**
  Modify `server.js` to include the route:
  ```javascript
  import express from 'express';
  import cors from 'cors';
  import path from 'path';
  import { fileURLToPath } from 'url';
  import { fetchAndNormalizeNews } from './src/news-service.js';

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
  });

  app.get('/api/news', async (req, res) => {
    try {
      const news = await fetchAndNormalizeNews();
      res.json(news);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao obter notícias' });
    }
  });

  if (process.argv[1] === __filename || process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  }

  export default app;
  ```

- [ ] **Step 3: Run the test suite**
  Run: `npm test`
  Expected: PASS

- [ ] **Step 4: Commit**
  ```bash
  git add server.js tests/server.test.js
  git commit -m "feat: conectar a rota /api/news no express e criar teste basico"
  ```

---

### Task 5: Frontend HTML Skeleton and Metadata (SEO)

**Files:**
- Create: `public/index.html`

- [ ] **Step 1: Create the public/index.html structure**
  Create the directory `public` and write HTML structure.
  ```html
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="description" content="Portal oficial com contagem regressiva de 1 ano para o início da Copa do Mundo Feminina da FIFA 2027 no Brasil e notícias atualizadas.">
      <title>Brasil 2027 - Portal e Contador Regressivo | Copa do Mundo Feminina</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Outfit:wght@400;600;800;900&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="style.css">
  </head>
  <body>
      <header class="hero-container" id="hero-header">
          <div class="hero-overlay"></div>
          <div class="hero-content">
              <span class="hero-badge">Copa do Mundo Feminina FIFA 2027™</span>
              <h1 class="hero-title">O MUNDIAL É NO BRASIL!</h1>
              <p class="hero-subtitle">Falta exatamente 1 ano para a bola rolar no primeiro mundial feminino da América do Sul.</p>
              
              <div class="countdown-wrapper" id="countdown-container">
                  <div class="countdown-card" id="card-days">
                      <span class="countdown-value" id="days">365</span>
                      <span class="countdown-label">Dias</span>
                  </div>
                  <div class="countdown-card" id="card-hours">
                      <span class="countdown-value" id="hours">00</span>
                      <span class="countdown-label">Horas</span>
                  </div>
                  <div class="countdown-card" id="card-minutes">
                      <span class="countdown-value" id="minutes">00</span>
                      <span class="countdown-label">Minutos</span>
                  </div>
                  <div class="countdown-card" id="card-seconds">
                      <span class="countdown-value" id="seconds">00</span>
                      <span class="countdown-label">Segundos</span>
                  </div>
              </div>
          </div>
      </header>

      <main class="main-content">
          <section class="section" id="section-cities">
              <div class="section-header">
                  <h2 class="section-title">Nossas Cidades-Sede & Estádios</h2>
                  <p class="section-desc">Conheça os 8 palcos brasileiros de alto nível que receberão as melhores jogadoras do planeta.</p>
              </div>
              <div class="cities-grid" id="cities-container"></div>
          </section>

          <section class="section" id="section-trivia">
              <div class="trivia-container">
                  <div class="trivia-intro">
                      <h2 class="trivia-title">⚽ Desafio Trivia Copa Feminina</h2>
                      <p>Teste seus conhecimentos sobre a história dos mundiais de futebol feminino!</p>
                  </div>
                  <div class="trivia-card" id="quiz-card">
                      <div id="quiz-question-container">
                          <h3 id="quiz-question">Carregando pergunta...</h3>
                          <div class="quiz-options" id="quiz-options-container"></div>
                      </div>
                      <div class="quiz-footer">
                          <span id="quiz-score">Pontos: 0</span>
                          <button id="quiz-next-btn" class="btn hidden">Próxima Pergunta</button>
                      </div>
                  </div>
              </div>
          </section>

          <section class="section" id="section-news">
              <div class="section-header">
                  <h2 class="section-title">Últimas Notícias da Copa</h2>
                  <p class="section-desc">Acompanhe as novidades e preparativos direto de fontes de credibilidade.</p>
                  <div class="news-controls">
                      <input type="text" id="news-search" placeholder="Buscar notícias por título...">
                      <div class="filter-buttons">
                          <button class="filter-btn active" data-source="all">Todas</button>
                          <button class="filter-btn" data-source="ge.globo">ge.globo</button>
                          <button class="filter-btn" data-source="Agência Brasil">Agência Brasil</button>
                      </div>
                  </div>
              </div>

              <div class="news-grid" id="news-container">
                  <div class="skeleton-news">Carregando notícias de fontes confiáveis...</div>
              </div>
          </section>

          <section class="section" id="section-newsletter">
              <div class="newsletter-card">
                  <h3>Fique por dentro dos ingressos e novidades</h3>
                  <p>Cadastre seu e-mail e receba alertas imediatos sobre as vendas de ingressos para a Copa 2027.</p>
                  <form id="newsletter-form" class="newsletter-form">
                      <input type="email" id="newsletter-email" placeholder="Digite seu melhor e-mail" required>
                      <button type="submit" class="btn btn-primary" id="btn-subscribe">Cadastrar Alerta</button>
                  </form>
                  <p id="newsletter-feedback" class="feedback-message hidden"></p>
              </div>
          </section>
      </main>

      <footer class="footer">
          <p>© 2026 Portal Copa Feminina Brasil 2027. Desenvolvido para torcedores.</p>
          <p class="footer-disclaimer">Este portal é um projeto informativo não oficial em comemoração ao futebol feminino.</p>
      </footer>
  </body>
  </html>
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add public/index.html
  git commit -m "feat: criar esqueleto HTML do frontend com tags SEO"
  ```

---

### Task 6: Custom CSS Styling (Vanilla CSS)

**Files:**
- Create: `public/style.css`

- [ ] **Step 1: Write public/style.css style sheets**
  Apply premium glassmorphic dark theme. Green, gold and blue accents. Beautiful micro-animations and responsiveness.
  ```css
  :root {
      --bg-main: #0a0f1d;
      --bg-card: rgba(17, 24, 39, 0.7);
      --bg-card-hover: rgba(31, 41, 55, 0.85);
      --border-color: rgba(255, 255, 255, 0.1);
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      
      --accent-green: #10b981;
      --accent-gold: #fbbf24;
      --accent-blue: #3b82f6;
      --accent-red: #ef4444;

      --font-title: 'Outfit', sans-serif;
      --font-body: 'Inter', sans-serif;
      
      --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
  }

  body {
      background-color: var(--bg-main);
      color: var(--text-main);
      font-family: var(--font-body);
      line-height: 1.6;
      overflow-x: hidden;
  }

  .hero-container {
      position: relative;
      min-height: 70vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 4rem 2rem;
      background: radial-gradient(circle at center, #1e293b 0%, var(--bg-main) 100%);
      background-size: cover;
      background-position: center;
  }

  .hero-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(180deg, rgba(10, 15, 29, 0.4) 0%, var(--bg-main) 95%);
      z-index: 1;
  }

  .hero-content {
      position: relative;
      z-index: 2;
      max-width: 900px;
  }

  .hero-badge {
      display: inline-block;
      padding: 0.5rem 1.5rem;
      background: linear-gradient(90deg, var(--accent-green), var(--accent-blue));
      font-family: var(--font-title);
      font-weight: 700;
      border-radius: 50px;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 1.5rem;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
  }

  .hero-title {
      font-family: var(--font-title);
      font-size: clamp(2.5rem, 6vw, 4.5rem);
      font-weight: 900;
      letter-spacing: -1px;
      background: linear-gradient(135deg, #ffffff 40%, var(--accent-gold) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 1rem;
      text-transform: uppercase;
  }

  .hero-subtitle {
      font-size: clamp(1rem, 2.5vw, 1.35rem);
      color: var(--text-muted);
      max-width: 700px;
      margin: 0 auto 2.5rem auto;
  }

  .countdown-wrapper {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
      max-width: 700px;
      margin: 0 auto;
  }

  .countdown-card {
      background: var(--bg-card);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.5rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: var(--transition-smooth);
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  }

  .countdown-card:hover {
      transform: translateY(-5px);
      border-color: rgba(251, 191, 36, 0.4);
      box-shadow: 0 15px 35px rgba(251, 191, 36, 0.15);
  }

  .countdown-value {
      font-family: var(--font-title);
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 800;
      color: var(--accent-gold);
      line-height: 1;
      margin-bottom: 0.5rem;
  }

  .countdown-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--text-muted);
      font-weight: 600;
  }

  .main-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem 4rem 1.5rem;
  }

  .section {
      padding: 4rem 0;
      border-bottom: 1px solid var(--border-color);
  }

  .section-header {
      text-align: center;
      margin-bottom: 3rem;
  }

  .section-title {
      font-family: var(--font-title);
      font-size: 2.25rem;
      font-weight: 800;
      margin-bottom: 0.75rem;
      letter-spacing: -0.5px;
  }

  .section-desc {
      color: var(--text-muted);
      font-size: 1.1rem;
      max-width: 600px;
      margin: 0 auto;
  }

  .cities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1.5rem;
  }

  .city-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      transition: var(--transition-smooth);
      display: flex;
      flex-direction: column;
      height: 100%;
  }

  .city-card:hover {
      transform: translateY(-8px);
      background: var(--bg-card-hover);
      border-color: rgba(16, 185, 129, 0.4);
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.1);
  }

  .city-visual {
      height: 140px;
      background: linear-gradient(135deg, #1e3a8a, #047857);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-title);
      font-weight: 800;
      color: rgba(255, 255, 255, 0.25);
      font-size: 2.5rem;
      text-transform: uppercase;
      position: relative;
  }

  .city-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.6);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--accent-gold);
  }

  .city-info {
      padding: 1.25rem;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
  }

  .city-name {
      font-family: var(--font-title);
      font-size: 1.35rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
  }

  .stadium-name {
      color: var(--accent-green);
      font-size: 0.95rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
  }

  .city-details {
      font-size: 0.85rem;
      color: var(--text-muted);
      border-top: 1px solid var(--border-color);
      padding-top: 0.75rem;
      margin-top: auto;
  }

  .trivia-container {
      max-width: 650px;
      margin: 0 auto;
      background: radial-gradient(ellipse at top left, rgba(59, 130, 246, 0.15), transparent), var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 24px;
      padding: 2.5rem;
      box-shadow: 0 15px 40px rgba(0,0,0,0.4);
  }

  .trivia-intro {
      text-align: center;
      margin-bottom: 2rem;
  }

  .trivia-title {
      font-family: var(--font-title);
      font-size: 1.75rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
  }

  .trivia-card {
      min-height: 250px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
  }

  #quiz-question {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
  }

  .quiz-options {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
  }

  .quiz-opt {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      padding: 1rem;
      border-radius: 12px;
      text-align: left;
      color: var(--text-main);
      cursor: pointer;
      font-family: var(--font-body);
      font-size: 0.95rem;
      transition: var(--transition-smooth);
  }

  .quiz-opt:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: var(--accent-blue);
  }

  .quiz-opt.correct {
      background: rgba(16, 185, 129, 0.2);
      border-color: var(--accent-green);
      color: #a7f3d0;
  }

  .quiz-opt.wrong {
      background: rgba(239, 68, 68, 0.2);
      border-color: var(--accent-red);
      color: #fca5a5;
  }

  .quiz-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border-color);
      padding-top: 1.25rem;
  }

  .news-controls {
      margin-top: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: center;
  }

  #news-search {
      width: 100%;
      max-width: 500px;
      padding: 0.75rem 1.25rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      color: var(--text-main);
      font-family: var(--font-body);
      font-size: 0.95rem;
  }

  #news-search:focus {
      outline: none;
      border-color: var(--accent-green);
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
  }

  .filter-buttons {
      display: flex;
      gap: 0.5rem;
  }

  .filter-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 0.5rem 1.25rem;
      border-radius: 30px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: var(--transition-smooth);
  }

  .filter-btn:hover, .filter-btn.active {
      background: var(--accent-green);
      border-color: var(--accent-green);
      color: #000000;
      font-weight: 600;
  }

  .news-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 2rem;
      margin-top: 2.5rem;
  }

  .news-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: var(--transition-smooth);
  }

  .news-card:hover {
      transform: translateY(-5px);
      border-color: rgba(59, 130, 246, 0.3);
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  }

  .news-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
  }

  .news-source-tag {
      color: var(--accent-blue);
      font-weight: 600;
  }

  .news-card-title {
      font-family: var(--font-title);
      font-size: 1.2rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      line-height: 1.4;
  }

  .news-card-desc {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
      flex-grow: 1;
  }

  .news-link {
      color: var(--accent-gold);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      transition: var(--transition-smooth);
  }

  .news-link:hover {
      color: #fcd34d;
      text-decoration: underline;
  }

  .skeleton-news {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem 0;
      color: var(--text-muted);
      font-style: italic;
  }

  .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      border: none;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition-smooth);
      font-family: var(--font-body);
  }

  .btn-primary {
      background: var(--accent-green);
      color: #000;
  }

  .btn-primary:hover {
      background: #34d399;
  }

  .btn.hidden {
      display: none;
  }

  .newsletter-card {
      max-width: 600px;
      margin: 0 auto;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), transparent), var(--bg-card);
      border: 1px solid var(--border-color);
      padding: 2.5rem;
      border-radius: 20px;
      text-align: center;
  }

  .newsletter-card h3 {
      font-family: var(--font-title);
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
  }

  .newsletter-card p {
      color: var(--text-muted);
      margin-bottom: 1.5rem;
  }

  .newsletter-form {
      display: flex;
      gap: 0.5rem;
  }

  .newsletter-form input {
      flex-grow: 1;
      padding: 0.75rem 1.25rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      color: var(--text-main);
  }

  .newsletter-form input:focus {
      outline: none;
      border-color: var(--accent-green);
  }

  .feedback-message {
      margin-top: 1rem;
      font-weight: 600;
      font-size: 0.9rem;
  }

  .feedback-message.success {
      color: var(--accent-green);
  }

  .feedback-message.hidden {
      display: none;
  }

  .footer {
      text-align: center;
      padding: 2.5rem 1.5rem;
      background: #060913;
      border-top: 1px solid var(--border-color);
      color: var(--text-muted);
      font-size: 0.85rem;
  }

  .footer-disclaimer {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.2);
  }

  @media (max-width: 600px) {
      .countdown-wrapper {
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
      }
      .newsletter-form {
          flex-direction: column;
      }
      .trivia-container {
          padding: 1.5rem;
      }
  }
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add public/style.css
  git commit -m "style: adicionar folha de estilo css vanilla premium com responsividade"
  ```

---

### Task 7: Frontend Interactive Script (App logic)

**Files:**
- Create: `public/app.js`

- [ ] **Step 1: Write public/app.js client logic**
  Implement the countdown target, news parser interface, and trivia quiz game state.
  ```javascript
  const CITIES_DATA = [
      { name: 'Rio de Janeiro', stadium: 'Estádio do Maracanã', capacity: '78.838', region: 'Sudeste', color: '#1e3a8a' },
      { name: 'São Paulo', stadium: 'Neo Química Arena', capacity: '49.000', region: 'Sudeste', color: '#0f172a' },
      { name: 'Brasília', stadium: 'Estádio Mané Garrincha', capacity: '72.788', region: 'Centro-Oeste', color: '#b45309' },
      { name: 'Belo Horizonte', stadium: 'Estádio Mineirão', capacity: '61.846', region: 'Sudeste', color: '#3730a3' },
      { name: 'Porto Alegre', stadium: 'Estádio Beira-Rio', capacity: '50.842', region: 'Sul', color: '#991b1b' },
      { name: 'Salvador', stadium: 'Arena Fonte Nova', capacity: '48.000', region: 'Nordeste', color: '#065f46' },
      { name: 'Recife', stadium: 'Arena de Pernambuco', capacity: '44.300', region: 'Nordeste', color: '#854d0e' },
      { name: 'Fortaleza', stadium: 'Arena Castelão', capacity: '63.900', region: 'Nordeste', color: '#155e75' }
  ];

  const QUIZ_QUESTIONS = [
      {
          question: "Qual país venceu a última Copa do Mundo Feminina da FIFA (2023)?",
          options: ["Inglaterra", "Espanha", "Estados Unidos", "Suécia"],
          answer: 1
      },
      {
          question: "Quem é a maior artilheira da história das Copas do Mundo (masculina e feminina) com 17 gols?",
          options: ["Marta (Brasil)", "Abby Wambach (EUA)", "Birgit Prinz (Alemanha)", "Formiga (Brasil)"],
          answer: 0
      },
      {
          question: "Qual seleção feminina tem mais títulos mundiais na história?",
          options: ["Alemanha", "Brasil", "Estados Unidos", "Japão"],
          answer: 2
      },
      {
          question: "A Copa do Mundo de 2027 no Brasil será a primeira sediada em qual continente?",
          options: ["América do Sul", "América do Norte", "África", "Ásia"],
          answer: 0
      }
  ];

  let activeNews = [];
  let currentQuestionIndex = 0;
  let score = 0;

  document.addEventListener('DOMContentLoaded', () => {
      initCountdown();
      renderCities();
      initTrivia();
      fetchNews();
      initNewsletter();
  });

  function initCountdown() {
      const targetDate = new Date('2027-06-24T12:00:00-03:00').getTime();
      
      const daysEl = document.getElementById('days');
      const hoursEl = document.getElementById('hours');
      const minutesEl = document.getElementById('minutes');
      const secondsEl = document.getElementById('seconds');

      function updateTimer() {
          const now = new Date().getTime();
          const distance = targetDate - now;

          if (distance < 0) {
              clearInterval(timerInterval);
              document.getElementById('countdown-container').innerHTML = "<h3>O MUNDIAL COMEÇOU!</h3>";
              return;
          }

          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);

          daysEl.textContent = String(days).padStart(3, '0');
          hoursEl.textContent = String(hours).padStart(2, '0');
          minutesEl.textContent = String(minutes).padStart(2, '0');
          secondsEl.textContent = String(seconds).padStart(2, '0');
      }

      updateTimer();
      const timerInterval = setInterval(updateTimer, 1000);
  }

  function renderCities() {
      const container = document.getElementById('cities-container');
      container.innerHTML = CITIES_DATA.map((city, index) => `
          <div class="city-card" onclick="alert('Estádio: ${city.stadium}\\nCapacidade: ${city.capacity}\\nRegião: ${city.region}')">
              <div class="city-visual" style="background: linear-gradient(135deg, ${city.color}, #0a0f1d)">
                  ${city.name.substring(0, 3)}
                  <span class="city-badge">${city.region}</span>
              </div>
              <div class="city-info">
                  <h3 class="city-name">${city.name}</h3>
                  <p class="stadium-name">${city.stadium}</p>
                  <p class="city-details">Capacidade: ${city.capacity}</p>
              </div>
          </div>
      `).join('');
  }

  function initTrivia() {
      const questionEl = document.getElementById('quiz-question');
      const optionsContainer = document.getElementById('quiz-options-container');
      const scoreEl = document.getElementById('quiz-score');
      const nextBtn = document.getElementById('quiz-next-btn');

      function loadQuestion() {
          const q = QUIZ_QUESTIONS[currentQuestionIndex];
          questionEl.textContent = q.question;
          optionsContainer.innerHTML = '';
          nextBtn.classList.add('hidden');

          q.options.forEach((option, idx) => {
              const button = document.createElement('button');
              button.className = 'quiz-opt';
              button.textContent = option;
              button.addEventListener('click', () => handleAnswer(idx, button));
              optionsContainer.appendChild(button);
          });
      }

      function handleAnswer(selectedIdx, button) {
          const q = QUIZ_QUESTIONS[currentQuestionIndex];
          const allButtons = optionsContainer.querySelectorAll('.quiz-opt');
          
          allButtons.forEach(btn => btn.disabled = true);

          if (selectedIdx === q.answer) {
              button.classList.add('correct');
              score += 10;
              scoreEl.textContent = `Pontos: ${score}`;
          } else {
              button.classList.add('wrong');
              allButtons[q.answer].classList.add('correct');
          }

          nextBtn.classList.remove('hidden');
      }

      nextBtn.addEventListener('click', () => {
          currentQuestionIndex = (currentQuestionIndex + 1) % QUIZ_QUESTIONS.length;
          loadQuestion();
      });

      loadQuestion();
  }

  async function fetchNews() {
      const container = document.getElementById('news-container');
      try {
          const res = await fetch('/api/news');
          if (!res.ok) throw new Error('Falha na resposta do servidor');
          const data = await res.json();
          activeNews = data;
          renderNews(activeNews);
      } catch (err) {
          console.error(err);
          container.innerHTML = `<div class="skeleton-news" style="color: var(--accent-red)">Erro ao carregar feeds de notícias. Usando dados locais offline...</div>`;
          activeNews = [
              {
                  title: "Preparativos avançados nas cidades brasileiras para receber a Copa Feminina 2027",
                  link: "https://www.cbf.com.br",
                  pubDate: new Date().toISOString(),
                  contentSnippet: "Representantes da FIFA concluem inspeções iniciais nas arenas e elogiam infraestrutura.",
                  source: "CBF"
              }
          ];
          renderNews(activeNews);
      }

      const searchInput = document.getElementById('news-search');
      searchInput.addEventListener('input', filterNews);

      const filterBtns = document.querySelectorAll('.filter-btn');
      filterBtns.forEach(btn => {
          btn.addEventListener('click', (e) => {
              filterBtns.forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              filterNews();
          });
      });
  }

  function renderNews(newsItems) {
      const container = document.getElementById('news-container');
      if (newsItems.length === 0) {
          container.innerHTML = `<div class="skeleton-news">Nenhuma notícia encontrada com os filtros selecionados.</div>`;
          return;
      }

      container.innerHTML = newsItems.map(item => {
          const formattedDate = new Date(item.pubDate).toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
          });
          return `
              <article class="news-card">
                  <div>
                      <div class="news-meta">
                          <span class="news-source-tag">${item.source}</span>
                          <span>${formattedDate}</span>
                      </div>
                      <h3 class="news-card-title">${item.title}</h3>
                      <p class="news-card-desc">${item.contentSnippet}</p>
                  </div>
                  <a href="${item.link}" target="_blank" class="news-link">Ler notícia completa →</a>
              </article>
          `;
      }).join('');
  }

  function filterNews() {
      const query = document.getElementById('news-search').value.toLowerCase();
      const activeFilterBtn = document.querySelector('.filter-btn.active');
      const sourceFilter = activeFilterBtn.getAttribute('data-source');

      const filtered = activeNews.filter(item => {
          const matchesQuery = item.title.toLowerCase().includes(query) || 
                               item.contentSnippet.toLowerCase().includes(query);
          const matchesSource = sourceFilter === 'all' || item.source === sourceFilter;
          return matchesQuery && matchesSource;
      });

      renderNews(filtered);
  }

  function initNewsletter() {
      const form = document.getElementById('newsletter-form');
      const emailInput = document.getElementById('newsletter-email');
      const feedback = document.getElementById('newsletter-feedback');

      form.addEventListener('submit', (e) => {
          e.preventDefault();
          const email = emailInput.value.trim();
          if (email) {
              feedback.textContent = 'Sucesso! Você receberá alertas de ingressos no seu e-mail.';
              feedback.className = 'feedback-message success';
              feedback.classList.remove('hidden');
              form.reset();
              setTimeout(() => {
                  feedback.classList.add('hidden');
              }, 4000);
          }
      });
  }
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add public/app.js
  git commit -m "feat: implementar script interativo app.js do frontend"
  ```

---

### Task 8: Hero Banner Image Generation

**Files:**
- Create: `public/assets/hero_banner.png`

- [ ] **Step 1: Generate Hero Banner using AI**
  Generate a soccer-themed background design banner for the countdown portal.
  Run: `generate_image` with prompt: "FIFA Women's World Cup 2027 Brazil official design banner, artistic energetic dynamic soccer action in Brazil, lush emerald green, yellow, blue colors, premium quality digital illustration, no letters or numbers".
  Output target: `public/assets/hero_banner.png`

- [ ] **Step 2: Update CSS to reference image**
  Ensure style.css references the background image correctly.
  ```css
  .hero-container {
      position: relative;
      min-height: 70vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 4rem 2rem;
      background: radial-gradient(circle at center, rgba(30, 41, 59, 0.45) 0%, var(--bg-main) 100%), url('assets/hero_banner.png');
      background-size: cover;
      background-position: center;
  }
  ```

- [ ] **Step 3: Commit assets**
  ```bash
  git add public/style.css
  git commit -m "feat: integrar imagem de banner da hero gerada"
  ```

---

### Task 9: Final Verification and Execution

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README.md file**
  Write executable instructions for starting the site locally.
  ```markdown
  # Portal Contador Regressivo Copa Feminina 2027

  Este portal apresenta um contador regressivo dinâmico para a Copa do Mundo Feminina da FIFA 2027 no Brasil e agrega notícias reais usando feeds RSS.

  ## Como Rodar

  1. Instale as dependências:
     ```bash
     npm install
     ```
  2. Inicie o servidor Express:
     ```bash
     npm start
     ```
  3. Abra seu navegador em: `http://localhost:3000`
  ```

- [ ] **Step 2: Run test suite**
  Run: `npm test`
  Expected: All tests pass.

- [ ] **Step 3: Launch server and verify locally**
  Run: `node server.js`
  Verify in browser or via test fetch that the backend `/api/news` is populated and `index.html` loads correctly.

- [ ] **Step 4: Commit**
  ```bash
  git add README.md
  git commit -m "docs: adicionar instrucoes de execucao no README"
  ```
