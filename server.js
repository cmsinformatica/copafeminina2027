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

// Somente inicia se executado diretamente
if (process.argv[1] === __filename || process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

export default app;
