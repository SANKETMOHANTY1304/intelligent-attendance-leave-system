let startTime;
let updatedTime;
let elapsedTime = 0.0;
let difference;
let tInterval;
let running = false;
let lapCounter = 0;

const display = document.getElementById('display');
const startStopBtn = document.getElementById('startStopBtn');
const resetBtn = document.getElementById('resetBtn');
const lapBtn = document.getElementById('lapBtn');
const lapList = document.getElementById('lapList');

function startStopwatch() {
    if (!running) {
        startTime = new Date().getTime() - elapsedTime;
        tInterval = setInterval(getShowTime, 1);
        startStopBtn.innerHTML = 'Pause';
        running = true;
        resetBtn.disabled = true;
        lapBtn.disabled = false;
    } else {
        clearInterval(tInterval);
        elapsedTime = new Date().getTime() - startTime;
        running = false;
        startStopBtn.innerHTML = 'Resume';
        resetBtn.disabled = false;
        lapBtn.disabled = true;
    }
}

function resetStopwatch() {
    clearInterval(tInterval);
    running = false;
    display.innerHTML = '00:00:00';
    startStopBtn.innerHTML = 'Start';
    elapsedTime = 0; 
    resetBtn.disabled = false;
    lapBtn.disabled = true;
    lapList.innerHTML = '';
    lapCounter = 0;
}

function recordLap() {
    lapCounter++;
    const lapTime = display.innerHTML;
    const li = document.createElement('li');
    li.textContent = `Lap ${lapCounter}: ${lapTime}`;
    lapList.appendChild(li);
}

function getShowTime() {
    updatedTime = new Date().getTime();
    difference = updatedTime - startTime;

    let hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((difference % (1000 * 60)) / 1000);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    display.innerHTML = hours + ":" + minutes + ":" + seconds;
}

startStopBtn.addEventListener('click', startStopwatch);
resetBtn.addEventListener('click', resetStopwatch);
lapBtn.addEventListener('click', recordLap);
