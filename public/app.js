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
