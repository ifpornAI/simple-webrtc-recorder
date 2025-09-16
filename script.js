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
let timeLeft = 120; // 2 минуты в секундах

// DOM элементы
const videoElement = document.getElementById('preview');
const currentQuestionElement = document.getElementById('current-question');
const timerElement = document.getElementById('timer');
const startInterviewButton = document.getElementById('start-interview');
const startRecordingButton = document.getElementById('start-recording');
const stopRecordingButton = document.getElementById('stop-recording');
const nextQuestionButton = document.getElementById('next-question');
const recordingsContainer = document.getElementById('recordings');

// Запрос доступа к камере и микрофону
async function initCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: true
        });
        videoElement.srcObject = stream;
        startRecordingButton.disabled = false;
    } catch (err) {
        alert('Ошибка доступа к камере: ' + err.message);
        console.error('Error accessing media devices:', err);
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
    timeLeft = 120; // 2 минуты
    timerElement.textContent = formatTime(timeLeft);
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = formatTime(timeLeft);
        
        if (timeLeft <= 0) {
            stopRecording();
        }
    }, 1000);
}

// Запуск записи
function startRecording() {
    recordedChunks = [];
    
    const options = {
        mimeType: 'video/webm;codecs=vp9,opus'
    };
    
    try {
        mediaRecorder = new MediaRecorder(stream, options);
    } catch (e) {
        console.error('MediaRecorder error:', e);
        try {
            // Fallback для Safari
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/mp4' });
        } catch (e) {
            console.error('MediaRecorder fallback error:', e);
            alert('Ваш браузер не поддерживает запись видео');
            return;
        }
    }
    
    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            recordedChunks.push(e.data);
        }
    };
    
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        saveRecording(blob);
    };
    
    // Обновление UI
    startRecordingButton.disabled = true;
    stopRecordingButton.disabled = false;
    nextQuestionButton.disabled = true;
    
    // Запуск таймера
    startTimer();
    
    mediaRecorder.start();
}

// Остановка записи
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        clearInterval(timerInterval);
        
        // Обновление UI
        startRecordingButton.disabled = false;
        stopRecordingButton.disabled = true;
        nextQuestionButton.disabled = false;
    }
}

// Сохранение записи (создание плеера и возможности скачивания)
function saveRecording(blob) {
    const recordingItem = document.createElement('div');
    recordingItem.className = 'recording-item';
    
    const questionText = document.createElement('h4');
    questionText.textContent = `Вопрос ${currentQuestionIndex + 1}: ${questions[currentQuestionIndex]}`;
    
    const videoPlayer = document.createElement('video');
    videoPlayer.controls = true;
    videoPlayer.style.width = '100%';
    videoPlayer.style.marginBottom = '10px';
    
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `question_${currentQuestionIndex + 1}.webm`;
    downloadLink.textContent = 'Скачать запись';
    downloadLink.className = 'btn primary';
    
    // Отображение видео
    videoPlayer.src = downloadLink.href;
    
    recordingItem.appendChild(questionText);
    recordingItem.appendChild(videoPlayer);
    recordingItem.appendChild(downloadLink);
    
    recordingsContainer.appendChild(recordingItem);
    
    // В реальном проекте здесь был бы код для загрузки на сервер
    console.log('Запись создана, размер:', blob.size);
}

// Переход к следующему вопросу
function nextQuestion() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex < questions.length) {
        currentQuestionElement.textContent = questions[currentQuestionIndex];
        startRecordingButton.disabled = false;
        stopRecordingButton.disabled = true;
        nextQuestionButton.disabled = true;
    } else {
        // Завершение интервью
        currentQuestionElement.textContent = 'Интервью завершено! Спасибо за ваши ответы.';
        startRecordingButton.disabled = true;
        stopRecordingButton.disabled = true;
        nextQuestionButton.disabled = true;
    }
}

// Обработчики событий
startInterviewButton.addEventListener('click', () => {
    initCamera();
    startInterviewButton.disabled = true;
    nextQuestion();
});

startRecordingButton.addEventListener('click', startRecording);
stopRecordingButton.addEventListener('click', stopRecording);
nextQuestionButton.addEventListener('click', nextQuestion);
