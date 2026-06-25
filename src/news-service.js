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
        title: item.title || '',
        link: item.link || '',
        pubDate: new Date(item.pubDate || item.isoDate || now).toISOString(),
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
          title: item.title || '',
          link: item.link || '',
          pubDate: new Date(item.pubDate || item.isoDate || now).toISOString(),
          contentSnippet: item.contentSnippet || item.content || '',
          source: 'Agência Brasil'
        });
      }
    });
  } catch (err) {
    console.error('Erro ao ler feed EBC:', err.message);
  }

  // Se falhar em buscar ambos, retornar dados mockados de backup
  if (allNews.length === 0) {
    allNews.push(
      {
        title: "Copa do Mundo Feminina de 2027: Brasil celebra contagem regressiva de um ano",
        link: "https://www.fifa.com",
        pubDate: new Date(now - 1000 * 60 * 60 * 2).toISOString(), // 2h atrás
        contentSnippet: "As cidades-sede brasileiras iluminaram pontos turísticos e realizaram ativações para celebrar a contagem regressiva oficial.",
        source: "FIFA Oficial"
      },
      {
        title: "Arthur Elias projeta renovação e preparação para a Copa no Brasil",
        link: "https://ge.globo.com",
        pubDate: new Date(now - 1000 * 60 * 60 * 6).toISOString(), // 6h atrás
        contentSnippet: "O técnico da seleção feminina destaca a importância do legado e do entrosamento para buscar o título inédito.",
        source: "ge.globo"
      }
    );
  }

  // Ordenar por data mais recente
  allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  // Salvar cache
  cachedNews = allNews;
  cacheExpiry = now + CACHE_DURATION;

  return allNews;
}
