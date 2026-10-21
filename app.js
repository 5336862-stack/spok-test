let surveyData = null;
let selectedAnswers = new Set();
let currentScreen = 0;
let totalScreens = 0;
let shortsMap = {};

// Координаты для отслеживания жестов свайпа
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener("DOMContentLoaded", () => {
    fetch('survey.json')
        .then(response => response.json())
        .then(data => {
            surveyData = data;
            initSurvey();
            setupSwipeListeners(); // Подключаем жесты
        })
        .catch(err => {
            document.getElementById('logo-text').innerText = "Ошибка";
            document.getElementById('sub-title').innerText = "Не удалось загрузить survey.json";
        });
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
    updateProgress();
}

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

// НАСТРОЙКА ЖЕСТОВ СВАЙПА
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
    const minSwipeDistance = 60; // Расстояние в пикселях для защиты от случайных сдвигов
    if (touchStartX - touchEndX > minSwipeDistance) {
        changeScreen(1);  // Свайп влево — идем вперед
    }
    if (touchEndX - touchStartX > minSwipeDistance) {
        changeScreen(-1); // Свайп вправо — идем назад
    }
}

// РАБОТА НАД ПРИЕМОМ ОТПРАВЛЕНИЙ
function sendData() {
    const payload = {
        survey_id: surveyData.survey_id,
        voted_at: new Date().toISOString(),
        answers: Array.from(selectedAnswers)
    };
    
    // Информационное окно-заглушка для демонстрации сформированного пакета
    alert("Голос принят! Подготовлен JSON-пакет для сервера:\n\n" + JSON.stringify(payload));
}
