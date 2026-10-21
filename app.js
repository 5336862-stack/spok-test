let surveyData = null;
let selectedAnswers = new Set();
let currentScreen = 0;
let totalScreens = 0;
let shortsMap = {};

// Шаг 1: Асинхронная загрузка конфигурации
document.addEventListener("DOMContentLoaded", () => {
    fetch('survey.json')
        .then(response => response.json())
        .then(data => {
            surveyData = data;
            initSurvey();
        })
        .catch(err => {
            document.getElementById('logo-text').innerText = "Ошибка";
            document.getElementById('sub-title').innerText = "Не удалось загрузить survey.json";
        });
});

// Шаг 2: Генерация интерфейса на лету
function initSurvey() {
    document.getElementById('logo-text').innerText = surveyData.party_title;
    document.getElementById('sub-title').innerText = surveyData.survey_title;
    
    const container = document.getElementById('dynamic-screens-container');
    const screens = surveyData.screens;
    totalScreens = screens.length + 1; // +1 для экрана итога

    screens.forEach((screen, sIdx) => {
        const screenDiv = document.createElement('div');
        screenDiv.className = `screen ${sIdx === 0 ? 'active' : ''}`;
        screenDiv.id = `screen-${sIdx}`;

        const titleDiv = document.createElement('div');
        titleDiv.className = 'screen-title';
        titleDiv.innerText = screen.title;
        screenDiv.appendChild(titleDiv);

        screen.questions.forEach(q => {
            shortsMap[q.id] = q.short; // Сохраняем краткие имена для финала
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card';
            cardDiv.onclick = () => toggleSelect(q.id, cardDiv);
            cardDiv.innerHTML = `<div class="card-text">${q.text}</div><div class="checkbox-view"></div>`;
            screenDiv.appendChild(cardDiv);
        });

        container.appendChild(screenDiv);
    });

    document.getElementById('next-btn').disabled = false;
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

function sendData() {
    const payload = {
        survey_id: surveyData.survey_id,
        voted_at: new Date().toISOString(),
        answers: Array.from(selectedAnswers)
    };
    alert("Успешно отправлено на обработку!\nПакет: " + JSON.stringify(payload));
}
