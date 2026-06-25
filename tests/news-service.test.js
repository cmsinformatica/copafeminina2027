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
