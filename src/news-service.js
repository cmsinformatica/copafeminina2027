import Parser from 'rss-parser';

const parser = new Parser();

const RSS_FEEDS = {
  ge: 'https://ge.globo.com/rss/futebol/futebol-feminino/',
  fifa: 'https://news.google.com/rss/search?q=site:fifa.com+Copa+do+Mundo+Feminina&hl=pt-BR&gl=BR&ceid=BR:pt-419',
  cazetv: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCZiYbVptd3PVPf4f6eR6UaQ',
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

  // Buscar FIFA (via Google News indexado do site:fifa.com)
  try {
    const feedFifa = await parser.parseURL(RSS_FEEDS.fifa);
    feedFifa.items.forEach(item => {
      // Limpar o título do sufixo " - FIFA" se houver
      let cleanTitle = item.title || '';
      if (cleanTitle.toLowerCase().endsWith(' - fifa')) {
        cleanTitle = cleanTitle.substring(0, cleanTitle.length - 7).trim();
      }
      allNews.push({
        title: cleanTitle,
        link: item.link || '',
        pubDate: new Date(item.pubDate || item.isoDate || now).toISOString(),
        contentSnippet: item.contentSnippet || item.content || '',
        source: 'FIFA.com'
      });
    });
  } catch (err) {
    console.error('Erro ao ler feed FIFA.com:', err.message);
  }

  // Buscar CazéTV (via feed RSS do canal de YouTube)
  try {
    const feedCaze = await parser.parseURL(RSS_FEEDS.cazetv);
    feedCaze.items.forEach(item => {
      const titleLower = (item.title || '').toLowerCase();
      // Filtrar para trazer vídeos mais alinhados com Copa, Futebol ou Seleção
      const isRelevant = KEYWORDS.some(keyword => titleLower.includes(keyword)) || 
                         titleLower.includes('futebol') || 
                         titleLower.includes('esporte') || 
                         titleLower.includes('jogo') || 
                         titleLower.includes('melhores momentos');
      
      if (isRelevant) {
        allNews.push({
          title: item.title || '',
          link: item.link || '',
          pubDate: new Date(item.pubDate || item.isoDate || now).toISOString(),
          contentSnippet: 'Novo vídeo ou transmissão ao vivo no canal oficial da CazéTV cobrindo esportes e futebol.',
          source: 'CazéTV'
        });
      }
    });
  } catch (err) {
    console.error('Erro ao ler feed CazéTV:', err.message);
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

  // Se falhar em buscar todos, retornar dados mockados de backup
  if (allNews.length === 0) {
    allNews.push(
      {
        title: "Copa do Mundo Feminina de 2027: Brasil celebra contagem regressiva de um ano",
        link: "https://www.fifa.com",
        pubDate: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
        contentSnippet: "As cidades-sede brasileiras iluminaram pontos turísticos e realizaram ativações para celebrar a contagem regressiva oficial.",
        source: "FIFA Oficial"
      },
      {
        title: "Arthur Elias projeta renovação e preparação para a Copa no Brasil",
        link: "https://ge.globo.com",
        pubDate: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
        contentSnippet: "O técnico da seleção feminina destaca a importância do legado e do entrosamento para buscar o título inédito.",
        source: "ge.globo"
      }
    );
  }

  // Filtrar apenas notícias dos últimos 3 dias (72 horas)
  const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
  let filteredNews = allNews.filter(item => {
    return new Date(item.pubDate).getTime() >= threeDaysAgo;
  });

  // Fallback: se não houver nenhuma notícia nos últimos 3 dias, exibe as 6 notícias mais recentes gerais
  if (filteredNews.length === 0) {
    console.log('Nenhuma notícia encontrada nos últimos 3 dias. Exibindo as últimas 6 notícias gerais.');
    filteredNews = allNews.slice(0, 6);
  }

  // Ordenar por data mais recente
  filteredNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  // Salvar cache
  cachedNews = filteredNews;
  cacheExpiry = now + CACHE_DURATION;

  return filteredNews;
}
