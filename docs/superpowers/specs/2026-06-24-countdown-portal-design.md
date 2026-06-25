# Especificação do Design: Portal Contador Copa do Mundo Feminina 2027

Este documento descreve a arquitetura, design e estratégia de teste para o portal do Contador Regressivo da Copa do Mundo Feminina da FIFA 2027, que será realizada no Brasil.

---

## 1. Visão Geral do Projeto

O portal é uma aplicação monolítica integrada de página única (SPA) servida por um backend Node.js com Express. Ele apresenta:
*   **Contador Regressivo:** Cronômetro dinâmico em relação à estreia em **24 de Junho de 2027**.
*   **API de Notícias Unificada:** Serviço em Node.js que consome feeds RSS de fontes esportivas de credibilidade (como ge.globo e EBC Esportes), unifica as notícias, filtra conteúdos relevantes, ordena por data e serve os dados normalizados com cache de 10 minutos.
*   **Painel das Cidades-Sede:** Grade interativa com detalhes sobre os 8 estádios da Copa no Brasil.
*   **Trivia / Quiz da Copa:** Jogo leve com perguntas sobre a história do futebol feminino para aumentar o tempo de permanência do usuário.
*   **Inscrição de Alertas:** Formulário de newsletter de ingressos com validação no frontend.

---

## 2. Estrutura do Projeto

```text
contador-copa-feminina/
├── public/                 # Conteúdo Estático (Frontend)
│   ├── assets/            # Imagens e ícones
│   ├── index.html         # Estrutura HTML semântica com tags SEO
│   ├── style.css          # Estilos CSS Vanilla (Tema Dark Premium)
│   └── app.js             # Lógica e interatividade do cliente
├── src/                    # Código do Servidor
│   └── news-service.js    # Consumo, filtragem, unificação e cache de RSS
├── package.json            # Configuração do Node.js e dependências
├── server.js               # Ponto de entrada do backend Express
└── README.md               # Documentação de execução rápida
```

---

## 3. Especificação do Backend (Express)

O servidor backend escutará na porta configurada (padrão `3000`) e servirá a pasta `public/` como arquivos estáticos.

### 3.1. Endpoint `/api/news` (GET)
Retorna uma lista JSON de notícias normalizadas.

*   **Fontes de Feed RSS:**
    1.  `https://ge.globo.com/rss/futebol/futebol-feminino/`
    2.  `https://agenciabrasil.ebc.com.br/rss/geral/feed.xml` (filtrado no backend por palavras-chave como `Copa do Mundo`, `Copa Feminina`, `Futebol Feminino`, `Seleção Feminina`).
*   **Processamento no Backend:**
    *   Fazer requisições HTTP paralelas para buscar os XMLs.
    *   Fazer o parse do XML com `rss-parser`.
    *   Filtrar itens para evitar duplicidade de links e garantir relevância temática.
    *   Normalizar as propriedades para o formato:
        ```json
        {
          "title": "Título da Notícia",
          "link": "https://url-da-noticia.com",
          "pubDate": "2026-06-24T18:00:00.000Z",
          "contentSnippet": "Resumo curto da notícia...",
          "source": "ge.globo"
        }
        ```
    *   Ordenar por data de publicação de forma decrescente (notícia mais recente primeiro).
    *   **Cache:** Armazenar o resultado em memória por 10 minutos (600.000 ms) para otimizar tempo de resposta e evitar rate-limit/bloqueio das fontes externas.

---

## 4. Especificação do Frontend (HTML, CSS, JS)

### 4.1. Design Visual e Estilo
*   **Tema:** Dark mode elegante e imersivo.
*   **Cores Principais:**
    *   Fundo: Midnight Deep Blue (`#0a0f1d`)
    *   Cards e Seções: Glassmorphic Navy (`rgba(17, 24, 39, 0.7)` com `backdrop-filter: blur(12px)`)
    *   Acento Verde: `#10b981` (Símbolo de esperança e dos gramados do Brasil)
    *   Acento Dourado: `#fbbf24` (Símbolo da taça da Copa do Mundo e vibração solar)
    *   Acento Azul: `#3b82f6` (Estilo esportivo moderno)
*   **Responsividade:** Grid adaptável usando Flexbox e CSS Grid. Fontes fluidas usando unidades relativas (`rem`, `em`, `vh`).

### 4.2. Funcionalidades da Página
*   **Contador Regressivo:**
    *   Data alvo: `2027-06-24T12:00:00-03:00` (Fuso horário de Brasília/Brasil).
    *   Exibição digital segmentada em: **Dias**, **Horas**, **Minutos** e **Segundos**.
    *   Efeito visual de contagem regressiva suave.
*   **Seção de Cidades-Sede (Estádios):**
    *   Cards interativos para as 8 cidades: Belo Horizonte, Brasília, Fortaleza, Porto Alegre, Recife, Rio de Janeiro, Salvador, São Paulo.
    *   Ao clicar em um card, revela detalhes adicionais sobre a capacidade do estádio, principais jogos e curiosidades locais.
*   **Hub de Notícias Dinâmico:**
    *   Busca assíncrona da rota `/api/news`.
    *   Caixa de pesquisa local no frontend para filtrar títulos e conteúdos.
    *   Filtro por fonte de notícia (ex: Mostrar todas, Apenas ge.globo, Apenas EBC).
    *   Exibição de esqueleto animado (skeleton loading) enquanto carrega as notícias.
*   **Jogo de Trivia:**
    *   Perguntas rotativas sobre conquistas históricas (Marta, Formiga, campeãs anteriores).
    *   Feedback imediato de resposta correta/incorreta com efeitos visuais suaves.

---

## 5. Estratégia de Verificação e Teste

*   **Testes do Backend:**
    *   Testar se o servidor Express inicializa corretamente na porta 3000.
    *   Acessar `/api/news` diretamente e verificar se o JSON retornado tem o formato especificado e o cabeçalho CORS correto.
    *   Verificar o cache realizando chamadas consecutivas e monitorando o tempo de resposta (a segunda requisição deve ser instantânea, menos de 5ms).
*   **Testes do Frontend:**
    *   Verificar se o contador regressivo exibe a contagem correta com base no fuso horário do usuário.
    *   Testar responsividade redimensionando a janela para resoluções de iPhone SE, iPad e desktop.
    *   Testar interações (filtro de cidades, quiz de trivia, e caixa de pesquisa do feed de notícias).
