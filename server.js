import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { fetchAndNormalizeNews } from './src/news-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Carregar contagem de visitas
const VISITS_FILE = path.join(__dirname, 'visits.json');
let visitCount = 0;

try {
  if (fs.existsSync(VISITS_FILE)) {
    const data = fs.readFileSync(VISITS_FILE, 'utf8');
    visitCount = JSON.parse(data).count || 0;
  }
} catch (err) {
  console.error('Erro ao ler visits.json:', err.message);
}

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

app.get('/api/visits', (req, res) => {
  visitCount++;
  try {
    fs.writeFileSync(VISITS_FILE, JSON.stringify({ count: visitCount }), 'utf8');
  } catch (err) {
    console.error('Erro ao salvar visits.json:', err.message);
  }
  res.json({ count: visitCount });
});

// Somente inicia se executado diretamente (e fora do Vercel Serverless)
if (process.env.VERCEL !== '1' && (process.argv[1] === __filename || process.env.NODE_ENV !== 'test')) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

export default app;
