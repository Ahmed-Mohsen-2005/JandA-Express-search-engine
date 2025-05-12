function toggleTheme() {
    const body = document.body;
    const toggleButton = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    } else {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
}
function handleSearch() {
    const query = document.getElementById('search-input').value.trim();
    const resultsDiv = document.getElementById('results');
    const safeSearch = document.getElementById('safe-search-toggle').checked;

    if (query === '') {
        resultsDiv.innerHTML = '<p>Please enter a search query.</p>';
        return;
    }

    const results = [
        `Result 1 for "${query}"${safeSearch ? ' (Safe)' : ''}`,
        `Result 2 for "${query}"${safeSearch ? ' (Safe)' : ''}`,
        `Result 3 for "${query}"${safeSearch ? ' (Safe)' : ''}`,
    ];

    resultsDiv.innerHTML = results.map(item =>
        `<div class="result-item">${item}</div>`
    ).join('');
}

function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('theme-icon');
    const slider = document.getElementById('settings-slider');

    if (body.classList.contains('light-mode')) {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        slider.classList.add('dark-mode'); 
    } else {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        slider.classList.remove('dark-mode'); 
    }
}
window.onload = function () {
    const searchInput = document.getElementById('search-input');
    const micIcon = document.querySelector('.fa-microphone');
    const statusDiv = document.getElementById('listening-status');
    let silenceTimeout;

    micIcon.addEventListener('click', () => {
        if (!window.annyang) {
            alert('Voice recognition not supported.');
            return;
        }

        annyang.abort();
        annyang.removeCommands();
        annyang.removeCallback();

        micIcon.classList.add('listening');
        statusDiv.style.display = 'block';

        annyang.addCallback('result', function (phrases) {
            const phrase = phrases[0];
            searchInput.value = phrase;

            if (silenceTimeout) clearTimeout(silenceTimeout);
            silenceTimeout = setTimeout(() => {
                annyang.abort();        
                handleSearch();          
            }, 5000);
        });

        annyang.addCallback('end', () => {
            micIcon.classList.remove('listening');
            statusDiv.style.display = 'none';
        });

        annyang.start({ autoRestart: false, continuous: true });
    });

    document.querySelector('.fa-search').addEventListener('click', handleSearch);

    function handleImageFile(file) {
        const maxSizeMB = 5;
        const fileSizeMB = file.size / (1024 * 1024);
        const searchInput = document.getElementById('search-input');
        const resultsDiv = document.getElementById('results');
    
        if (fileSizeMB > maxSizeMB) {
            searchInput.value = '';
            resultsDiv.innerHTML = `<p style="color:red;">Image too large (${fileSizeMB.toFixed(2)} MB). Max allowed is ${maxSizeMB} MB.</p>`;
            return;
        }
    
        const reader = new FileReader();
        reader.onload = function (e) {
            const imgPreview = `<img src="${e.target.result}" alt="Image Preview" style="max-width:200px; border-radius:10px; margin-bottom:10px;">`;
            const fileInfo = `<p><strong>File:</strong> ${file.name}<br><strong>Size:</strong> ${fileSizeMB.toFixed(2)} MB</p>`;
            searchInput.value = `Image: ${file.name}`;
            resultsDiv.innerHTML = imgPreview + fileInfo;
    
        };
        reader.readAsDataURL(file);
    }
    
    document.querySelector('.fa-camera').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.click();
    
        input.onchange = () => {
            if (input.files.length > 0) {
                handleImageFile(input.files[0]);
            }
        };
    });
    
    const dropZone = document.getElementById('drop-zone');
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#4285F4';
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#ccc';
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ccc';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageFile(file);
        } else {
            alert('Please drop a valid image file.');
        }
    });
    
    
};

let sliderOpen = false;

function toggleSlider() {
    const slider = document.getElementById('settings-slider');
    if (sliderOpen) {
        slider.classList.remove('open');
    } else {
        slider.classList.add('open');
    }
    sliderOpen = !sliderOpen;
}

function getWeather() {
    const apiKey = '8f2eada28366f5ad2a4295a1dec62b14';  
    const city = 'Cairo';  
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    console.log("Fetching weather data from:", weatherUrl);

    // Start fetching the weather data
    fetch(weatherUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch weather data: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Weather data:", data);

            const temp = data.main.temp;
            const iconCode = data.weather[0].icon;
            const weatherIcon = `https://openweathermap.org/img/wn/${iconCode}.png`;

            document.getElementById('weather-temp').innerText = `${temp}°C`;
            document.getElementById('weather-icon').innerHTML = `<img src="${weatherIcon}" alt="Weather icon" />`;
        })
        .catch(error => {
            console.error("Error fetching weather:", error);

            document.getElementById('weather-temp').innerText = 'Unable to fetch weather';
            document.getElementById('weather-icon').innerHTML = '';
        });
}

document.addEventListener('DOMContentLoaded', function() {
    getWeather();
});
function updateClock() {
    const clockElement = document.getElementById('clock');
    
    setInterval(() => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        clockElement.innerText = `${hours}:${minutes}:${seconds}`;
    }, 1000); 
}

document.addEventListener('DOMContentLoaded', () => {
    updateClock();
});

function saveToHistory(query) {
    if (!query.trim()) return;

    let history = JSON.parse(localStorage.getItem('searchHistory') || "[]");

    if (!history.some(item => item.toLowerCase() === query.toLowerCase())) {
        history.unshift(query); 
        localStorage.setItem('searchHistory', JSON.stringify(history.slice(0, 100))); // Limit to 10 items
        updateHistoryUI();
    }
}


window.addEventListener('DOMContentLoaded', () => {
    loadHistory();
});

function saveToHistory(query) {
    let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    history.unshift(query); 
    localStorage.setItem('searchHistory', JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    history.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        li.onclick = () => {
            document.getElementById('search-input').value = item;
        };
        historyList.appendChild(li);
    });
}

function clearHistory() {
    localStorage.removeItem('searchHistory');
    loadHistory();
}

document.getElementById('search-form').addEventListener('submit', function(e) {
    const query = document.getElementById('search-input').value.trim();
    if (query) {
        saveToHistory(query);
    }
});


function handleSearch() {
    const query = document.getElementById('search-input').value.trim();
    const resultsDiv = document.getElementById('results');

    if (!query) {
        resultsDiv.innerHTML = '<p>Please enter a search query.</p>';
        return;
    }

    saveToHistory(query);

    const results = [
        `Result 1 for "${query}"`,
        `Result 2 for "${query}"`,
        `Result 3 for "${query}"`
    ];

    resultsDiv.innerHTML = results.map(item =>
        `<div class="result-item">${item}</div>`
    ).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    updateHistoryUI();
    getWeather();
    updateClock();
});
const sonic = document.getElementById('sonic');
const smokeContainer = document.getElementById('smoke-container');

let pos = -300;
const interval = 10;
const speed = 15;

const run = setInterval(() => {
  pos += speed;
  sonic.style.left = pos + 'px';

  // Create smoke puffs
  for (let i = 0; i < 3; i++) {
    const puff = document.createElement('div');
    puff.classList.add('smoke-puff');
    const size = 20 + Math.random() * 80;
    puff.style.width = size + 'px';
    puff.style.height = size * 0.6 + 'px';
    puff.style.left = (pos - 80 + Math.random() * 60) + 'px';
    smokeContainer.appendChild(puff);
  }

  for (let i = 0; i < 3; i++) {
    const line = document.createElement('div');
    line.classList.add('speed-line');
    line.style.left = (pos + 100 - Math.random() * 100) + 'px';
    line.style.bottom = (38 + Math.random() * 10) + '%';
    smokeContainer.appendChild(line);
  }

  const sonicWidth = sonic.offsetWidth;
  if (pos + sonicWidth >= window.innerWidth) {
    clearInterval(run);

    // Fade out
    sonic.style.opacity = 0;

    setTimeout(() => {
      sonic.style.display = 'none';
    }, 800); 
  }
}, interval);
function redirectToResults() {
    const query = document.getElementById('search-input').value;
    if (query.trim()) {
      window.location.href = `/results?q=${encodeURIComponent(query)}`;
    }
  }
  document.getElementById('search-form').addEventListener('submit', function(event) {
    const expandQuery = document.getElementById('expand-query').checked;
    console.log('Query Expansion Enabled:', expandQuery);
});
document.getElementById('open-assistant').addEventListener('click', () => {
  document.getElementById('assistant-slider').classList.add('open');
});

document.getElementById('close-assistant').addEventListener('click', () => {
  document.getElementById('assistant-slider').classList.remove('open');
});

document.getElementById('chat-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');
  const userMessage = input.value.trim();

  if (!userMessage) return;

  chatBox.innerHTML += `<div><strong>You:</strong> ${userMessage}</div>`;
  input.value = '';

  const response = await fetch('/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userMessage })
  });

  const data = await response.json();
  chatBox.innerHTML += `<div><strong>AI:</strong> ${data.reply}</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;
});

document.getElementById('clear-chat-button').addEventListener('click', function() {
    // Clear the chat box
    document.getElementById('chat-box').innerHTML = '';
});
