let resultsData = [];
let itemsPerPage = 10;
let currentPage = 1;

async function loadResults(query) {
  try {
    const res = await fetch(`/search?q=${encodeURIComponent(query)}&model=tfidf`);
    const data = await res.json();
    resultsData = data;
    renderResults();
  } catch (err) {
    document.getElementById('results').innerHTML = '<p style="color:red">Error fetching results.</p>';
  }
}

// 👇 DEFINE IT RIGHT AFTER loadResults
function renderResults() {
  const results = document.getElementById('results');
  const pagination = document.getElementById('pagination');
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const toShow = resultsData.slice(start, end);

  results.innerHTML = '';

  toShow.forEach(item => {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.innerHTML = `
      <div class="result-info">
        <h3>${item.docno}</h3>
        <p>${item.description}</p>
      </div>
    `;
    results.appendChild(card);
  });

  // Pagination controls
  pagination.innerHTML = '';

  if (currentPage > 1) {
    const prev = document.createElement('button');
    prev.textContent = '⬅️ Prev';
    prev.onclick = () => {
      currentPage--;
      renderResults();
    };
    pagination.appendChild(prev);
  }

  const pageInfo = document.createElement('span');
  pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(resultsData.length / itemsPerPage)}`;
  pagination.appendChild(pageInfo);

  if (end < resultsData.length) {
    const next = document.createElement('button');
    next.textContent = 'Next ➡️';
    next.onclick = () => {
      currentPage++;
      renderResults();
    };
    pagination.appendChild(next);
  }
}
