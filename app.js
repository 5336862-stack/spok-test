// Конструктор Спок-опроса: данные встроены для обхода сетевых блокировок хостинга
const surveyData = {
  "survey_id": "snt_reform_2026",
  "party_title": "Новые Люди",
  "survey_title": "Платформа цифрового волеизъявления",
  "required_choices": 3,
  "screens": [
    {
      "title": "Дороги и зимний сезон",
      "questions": [
        {"id": 1, "short": "Летний режим (без чистки)", "text": "Я готов платить меньше летом, понимая, что зимой дороги к моему участку чистить не будут."},
        {"id": 2, "short": "Круглогодичный тариф (с трактором)", "text": "Я хочу круглогодичный проезд и готов оплачивать работу трактора зимой по повышенному тарифу."}
      ]
    },
    {
      "title": "Принцип расчета взносов",
      "questions": [
        {"id": 3, "short": "Матричный динамический тариф", "text": "Размер взноса должен зависеть от реального износа инфраструктуры (машины, стоки, мусор), а не от соток."},
        {"id": 4, "short": "Традиционная уравниловка", "text": "Уравниловка ('все платят поровну') — это честно, даже если я не пользуюсь частью услуг."}
      ]
    },
    {
      "title": "Управление и прозрачность",
      "questions": [
        {"id": 5, "short": "Независимый ИИ-биллинг", "text": "Я не доверяю ручным расчетам Правления и хочу видеть автоматический ИИ-биллинг."},
        {"id": 6, "short": "Консервативное ручное управление", "text": "Мне проще переплатить, чем разбираться в сложных цифровых графиках и приложениях."}
      ]
    }
  ]
};

let selectedAnswers = new Set();
let currentScreen = 0;
let totalScreens = 0;
let shortsMap = {};

// Переменные для распознавания жестов
let touchStartX = 0;
let touchEndX = 0;

// Инициализация запускается сразу, без fetch
document.addEventListener("DOMContentLoaded", () => {
    initSurvey();
    setupSwipeListeners(); // Подключаем считывание свайпов пальцем
});

function initSurvey() {
    document.getElementById('logo-text').innerText = surveyData.party_title;
    document.getElementById('sub-title').innerText = surveyData.survey_title;
    
    const container = document.getElementById('dynamic-screens-container');
    const screens = surveyData.screens;
    totalScreens = screens.length + 1;

    screens.forEach((screen, sIdx) => {
        const screenDiv = document.createElement('div');
        screenDiv.className = `screen ${sIdx === 0 ? 'active' : ''}`;
        screenDiv.id = `screen-${sIdx}`;

        const titleDiv = document.createElement('div');
        titleDiv.className = 'screen-title';
        titleDiv.innerText = screen.title;
        screenDiv.appendChild(titleDiv);

        screen.questions.forEach(q => {
            shortsMap[q.id] = q.short;
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card';
            cardDiv.onclick = () => toggleSelect(q.id, cardDiv);
            cardDiv.innerHTML = `<div class="card-text">${q.text}</div><div class="checkbox-view"></div>`;
            screenDiv.appendChild(cardDiv);
        });

        container.appendChild(screenDiv);
    });
  function toggleSelect(id, element) {
    if (selectedAnswers.has(id)) {
        selectedAnswers.delete(id);
        element.classList.remove('selected');
    } else {
        selectedAnswers.add(id);
        element.classList.add('selected');
    }
    const req = surveyData.required_choices;
    document.getElementById('counter').innerText = `Выбрано альтернатив: ${selectedAnswers.size} из ${req}`;
}

function changeScreen(direction) {
    // Защита: не даем перелистнуть за пределы существующих экранов
    if (currentScreen + direction < 0 || currentScreen + direction >= totalScreens) return;

    const activeId = currentScreen === totalScreens - 1 ? 'screen-summary' : `screen-${currentScreen}`;
    document.getElementById(activeId).classList.remove('active');

    currentScreen += direction;

    const nextId = currentScreen === totalScreens - 1 ? 'screen-summary' : `screen-${currentScreen}`;
    document.getElementById(nextId).classList.add('active');

    document.getElementById('back-btn').disabled = (currentScreen === 0);
    
    if (currentScreen === totalScreens - 1) {
        document.getElementById('next-btn').style.display = 'none';
        buildSummary();
    } else {
        document.getElementById('next-btn').style.display = 'block';
        document.getElementById('next-btn').innerText = "Далее";
    }
    updateProgress();
}

function updateProgress() {
    document.getElementById('progress').style.width = `${((currentScreen + 1) / totalScreens) * 100}%`;
}

function buildSummary() {
    const container = document.getElementById('summary-container');
    const statusBox = document.getElementById('status-message');
    const submitBtn = document.getElementById('submit-btn');
    const req = surveyData.required_choices;
    container.innerHTML = '';

    for (let id in shortsMap) {
        const isChecked = selectedAnswers.has(parseInt(id));
        const div = document.createElement('div');
        div.className = `summary-item ${isChecked ? 'checked' : ''}`;
        div.innerText = `${isChecked ? '✅' : '❌'} ${shortsMap[id]}`;
        container.appendChild(div);
    }

    if (selectedAnswers.size === req) {
        statusBox.className = "status-msg success";
        statusBox.innerText = `⚖️ Баланс идеален! Выбрано ровно ${req} из ${req * 2} альтернатив.`;
        submitBtn.classList.add('active');
    } else {
        statusBox.className = "status-msg error";
        statusBox.innerText = `⚠️ Дисбаланс! Спок-метод требует выбрать ровно ${req} вариантов (выбрано: ${selectedAnswers.size}).`;
        submitBtn.classList.remove('active');
    }
}

// Слушатели жестов для мобильного перелистывания
function setupSwipeListeners() {
    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches.screenX;
    }, {passive: true});

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches.screenX;
        handleSwipeGesture();
    }, {passive: true});
}

function handleSwipeGesture() {
    const minSwipeDistance = 60; // Порог чувствительности свайпа в пикселях
    if (touchStartX - touchEndX > minSwipeDistance) {
        changeScreen(1);  // Палец влево -> Экран вперед
    }
    if (touchEndX - touchStartX > minSwipeDistance) {
        changeScreen(-1); // Палец вправо -> Экран назад
    }
}

function sendData() {
    const payload = {
        survey_id: surveyData.survey_id,
        voted_at: new Date().toISOString(),
        answers: Array.from(selectedAnswers)
    };
    alert("Успешно отправлено на обработку!\nПакет: " + JSON.stringify(payload));
}


    document.getElementById('next-btn').disabled = false;
    updateProgress();
}
