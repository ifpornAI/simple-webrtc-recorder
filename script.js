// Проверка на существование элемента
function getElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.error(`Элемент с ID '${id}' не найден`);
    return {
      addEventListener: () => {},
      disabled: false,
      textContent: '',
      classList: { add: () => {}, remove: () => {} },
      style: {},
      src: '',
      srcObject: null,
      innerHTML: ''
    };
  }
  return element;
}

// Вопросы для интервью
const questions = [
    "Расскажите о вашем опыте работы в продажах",
    "Почему вы ищете новую работу?",
    "Какие ваши главные профессиональные достижения?",
    "Какие у вас зарплатные ожидания?"
];

// Глобальные переменные
let currentQuestionIndex = -1;
let mediaRecorder;
let recordedChunks = [];
let stream;
let timerInterval;
let totalSeconds = 0;
let questionTimestamps = [];

// DOM элементы
const videoElement = getElement('preview');
const currentQuestionElement = getElement('current-question');
const timerElement = getElement('timer');
const startInterviewButton = getElement('start-interview');
const nextQuestionButton = getElement('next-question');
const finishInterviewButton = getElement('finish-interview');
const finalRecordingSection = getElement('final-recording');
const recordingPlayerDiv = getElement('recording-player');

// Проверяем, есть ли доступ к navigator.mediaDevices
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('Ваш браузер не поддерживает запись медиа через WebRTC');
}

// Запрос доступа к камере и микрофону
async function initCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: true, // Упрощаем для повышения совместимости
            audio: true
        });
        videoElement.srcObject = stream;
        return true;
    } catch (err) {
        alert('Ошибка доступа к камере: ' + err.message);
        console.error('Error accessing media devices:', err);
        return false;
    }
}

// Форматирование времени (мм:сс)
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

// Запуск таймера
function startTimer() {
    totalSeconds = 0;
    timerElement.textContent = formatTime(totalSeconds);
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        totalSeconds++;
        timerElement.textContent = formatTime(totalSeconds);
    }, 1000);
}

// Запуск интервью и записи
async function startInterview() {
    if (await initCamera()) {
        recordedChunks = [];
        questionTimestamps = [];
        
        // Настройка MediaRecorder
        let options = {};
        try {
            // Пробуем с кодеком
            mediaRecorder = new MediaRecorder(stream, {mimeType: 'video/webm;codecs=vp8,opus'});
        } catch (e1) {
            try {
                // Пробуем без кодека
                mediaRecorder = new MediaRecorder(stream, {mimeType: 'video/webm'});
            } catch (e2) {
                try {
                    // Пробуем вообще без опций
                    mediaRecorder = new MediaRecorder(stream);
                } catch (e3) {
                    alert('Ваш браузер не поддерживает запись видео');
                    console.error('MediaRecorder errors:', e1, e2, e3);
                    return;
                }
            }
        }
        
        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                recordedChunks.push(e.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            if (recordedChunks.length > 0) {
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                createFinalRecording(blob);
            } else {
                alert('Запись не содержит данных. Попробуйте другой браузер.');
            }
        };
        
        // Обновление интерфейса
        startInterviewButton.disabled = true;
        nextQuestionButton.disabled = false;
        finishInterviewButton.disabled = false;
        
        // Начинаем первый вопрос
        nextQuestion();
        
        // Запуск таймера и записи
        startTimer();
        mediaRecorder.start(1000); // Получаем данные каждую секунду
    }
}

// Переход к следующему вопросу
function nextQuestion() {
    currentQuestionIndex++;
    
    // Сохраняем метку времени для вопроса
    questionTimestamps.push({
        questionIndex: currentQuestionIndex,
        timeSeconds: totalSeconds,
        question: currentQuestionIndex < questions.length ? questions[currentQuestionIndex] : "Завершение интервью"
    });
    
    if (currentQuestionIndex < questions.length) {
        currentQuestionElement.textContent = questions[currentQuestionIndex];
    } else {
        // Завершение интервью, если закончились вопросы
        finishInterview();
    }
}

// Завершение интервью
function finishInterview() {
    // Остановка записи
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        clearInterval(timerInterval);
    }
    
    // Обновление UI
    currentQuestionElement.textContent = 'Интервью завершено! Спасибо за ваши ответы.';
    startInterviewButton.disabled = false;
    nextQuestionButton.disabled = true;
    finishInterviewButton.disabled = true;
}

// Создание итоговой записи
function createFinalRecording(blob) {
    // Очистка предыдущих записей
    recordingPlayerDiv.innerHTML = '';
    
    // Создание видеоплеера
    const videoPlayer = document.createElement('video');
    videoPlayer.controls = true;
    videoPlayer.style.width = '100%';
    videoPlayer.style.marginBottom = '10px';
    
    // Создание ссылки для скачивания
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = 'interview.webm';
    downloadLink.textContent = 'Скачать запись интервью';
    downloadLink.className = 'btn primary';
    
    // Отображение видео
    videoPlayer.src = downloadLink.href;
    
    // Создание информации о вопросах и таймкодах
    const infoDiv = document.createElement('div');
    infoDiv.className = 'recording-info';
    
    let infoContent = '<strong>Временные метки вопросов:</strong><ul>';
    questionTimestamps.forEach((item, index) => {
        if (index < questions.length) { // Не включаем последнюю метку завершения
            infoContent += `<li><strong>${formatTime(item.timeSeconds)}</strong> - ${item.question}</li>`;
        }
    });
    infoContent += '</ul>';
    
    infoDiv.innerHTML = infoContent;
    
    // Добавляем элементы на страницу
    recordingPlayerDiv.appendChild(videoPlayer);
    recordingPlayerDiv.appendChild(downloadLink);
    recordingPlayerDiv.appendChild(infoDiv);
    
    // Показываем секцию с записью
    finalRecordingSection.classList.remove('hidden');
}

// Обработчики событий
startInterviewButton.addEventListener('click', startInterview);
nextQuestionButton.addEventListener('click', nextQuestion);
finishInterviewButton.addEventListener('click', finishInterview);
