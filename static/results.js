let resultsData = [];
let itemsPerPage = 10;
let currentPage = 1;
let currentCategory = 'all';
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(fav => fav !== id);
  } else {
    favorites.push(id);
  }
  saveFavorites();
  loadResults();
}

async function loadResults() {
  const input = document.getElementById('search-input').value.toLowerCase() || "product";
  const model = "tfidf"; // You can make this dynamic later
  const res = await fetch(`/search?q=${encodeURIComponent(input)}&model=${model}`);  resultsData = await res.json();

  const results = document.getElementById('results');
  const pagination = document.getElementById('pagination');
  const filtered = currentCategory === 'all'
    ? resultsData
    : resultsData.filter(p => p.description.toLowerCase().includes(currentCategory));

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const toShow = filtered.slice(start, end);

  results.innerHTML = '';
  toShow.forEach(item => {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.innerHTML = `
      <div class="result-info">
        <h3>
          <span>${item.docno}</span>
          <span style="display: inline-flex; align-items: center; gap: 8px;">
            <span class="favorite-star ${favorites.includes(item.docno) ? 'favorited' : ''}" onclick="toggleFavorite(${item.docno})">
              ${favorites.includes(item.docno) ? '⭐' : '☆'}
            </span>
          </span>
        </h3>
        <p>${item.description}</p>
      </div>
    `;
    card.onclick = (e) => {
      if (e.target.classList.contains('favorite-star')) return;
      alert("No URL provided for document: " + item.docno);
    };
    results.appendChild(card);
  });

  pagination.innerHTML = '';
  if (currentPage > 1) {
    const prevBtn = document.createElement('button');
    prevBtn.innerText = '⬅ Previous';
    prevBtn.onclick = () => {
      currentPage--;
      loadResults();
      scrollTopSmooth();
    };
    pagination.appendChild(prevBtn);
  }

  const pageInfo = document.createElement('span');
  pageInfo.style.color = 'gray';
  pageInfo.innerText = `Page ${currentPage} of ${Math.ceil(filtered.length / itemsPerPage)}`;  pagination.appendChild(pageInfo);

  if (end < filtered.length) {
    const nextBtn = document.createElement('button');
    nextBtn.innerText = 'Next ➡';
    nextBtn.onclick = () => {
      currentPage++;
      loadResults();
      scrollTopSmooth();
    };
    pagination.appendChild(nextBtn);
  }
}

function filterResults(category) {
  document.querySelectorAll('.categories button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  currentCategory = category;
  currentPage = 1;
  loadResults();
}

function liveSearch() {
  currentPage = 1;
  loadResults();
}

function scrollTopSmooth() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.onscroll = function () {
  document.getElementById('back-to-top').style.display = window.scrollY > 500 ? 'block' : 'none';
};

function toggleTheme() {
  if (document.body.classList.toggle('light-mode')) {
    localStorage.setItem('theme', 'light');
  } else {
    localStorage.setItem('theme', 'dark');
  }
}

function goBack() {
  window.location.href = 'interface.html';
}

function changePageSize() {
  const selected = document.getElementById('page-size').value;
  itemsPerPage = parseInt(selected);
  currentPage = 1;
  loadResults();
}

// On Load
if (localStorage.getItem('theme') === 'light') toggleTheme();
loadResults();