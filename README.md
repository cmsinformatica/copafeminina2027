# Portal Contador Regressivo Copa Feminina 2027

Este portal apresenta um contador regressivo dinâmico para a Copa do Mundo Feminina da FIFA 2027 no Brasil e agrega notícias reais usando feeds RSS.

## Funcionalidades

1. **Contador Regressivo:** Cronômetro preciso em relação à data de estreia (24 de Junho de 2027 às 12:00:00).
2. **Cidades-Sede & Estádios:** Painel interativo com os 8 palcos brasileiros de alto nível da competição.
3. **Desafio Trivia/Quiz:** Mini-jogo interativo com perguntas dinâmicas sobre a Copa Feminina.
4. **Feed de Notícias:** API backend que busca, filtra e unifica dinamicamente feeds RSS esportivos confiáveis (ge.globo e EBC Esportes) com cache de 10 minutos para maior velocidade.
5. **Alertas de Ingressos:** Formulário de newsletter com validação instantânea.

## Como Executar Localmente

1. **Instalar Dependências:**
   ```bash
   npm install
   ```

2. **Iniciar o Servidor:**
   ```bash
   npm start
   ```
   O servidor estará rodando em: `http://localhost:3000`

3. **Executar Testes:**
   ```bash
   npm test
   ```
