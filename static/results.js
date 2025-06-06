let resultsData = [];
let itemsPerPage = 10;
let currentPage = 1;

async function loadResults(query) {
  try {
    const selectedModel = document.getElementById('model-select').value;
    const res = await fetch(`/search?q=${encodeURIComponent(query)}&model=${selectedModel}`);
    const data = await res.json();
    resultsData = data.results;
    const numresults = resultsData.length;
    displaySpeed(data.search_time, numresults);
    renderResults();
  } catch (err) {
    document.getElementById('results').innerHTML = '<p style="color:red">Error fetching results.</p>';
  }
}
document.getElementById('model-select').addEventListener('change', () => {
  const query = document.getElementById('search-input').value;
  if (query.trim()) {
    loadResults(query);
  }
});


function highlightMatch(text, query) {
  const pattern = new RegExp(`(${query})`, 'gi');
  return text.replace(pattern, '<mark>$1</mark>');
}


function renderResults() {
  const results = document.getElementById('results');
  const pagination = document.getElementById('pagination');
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const toShow = resultsData.slice(start, end);

  results.innerHTML = '';
  console.log("Results being shown:", toShow);

  toShow.forEach(item => {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.innerHTML = `
    <img src="${item.image_url || ''}" alt="Product Image" style="width: 300px; height: 300px; border-radius: 12px; object-fit: cover;" />
    <div class="result-info">
      <h3>${item.object || 'Unnamed Product'}
        <span class="favorite-star" onclick="toggleFavorite(this, '- ${item.object}')">★</span>
      </h3>
      <p><strong>Brand:</strong> ${item.brand || 'N/A'}</p>
      <p><strong>Description:</strong> ${item.description || 'N/A'}</p>
      <p><strong>Price:</strong> ${item.final_price || 'N/A'} ${item.currency || ''} (${item.discount || 0}% off)</p>
      <p><strong>Rating:</strong> ⭐ ${item.rating || 'N/A'}</p>
      <p><strong>Top Review:</strong> "${item.top_review || 'N/A'}"</p>
      <p><strong>Categories:</strong> ${item.categories || 'N/A'}</p>
      <a href="${item.url || '#'}" target="_blank" style="color:#4fc3f7; text-decoration:underline;">View on Website</a>
      <p class="url">Score: ${item.score?.toFixed(2) || '0.00'}</p>
    </div>
  `;
  
    results.appendChild(card);
  });

  pagination.innerHTML = '';

  if (currentPage > 1) {
    const prev = document.createElement('button');
    prev.textContent = '⬅️ Prev';
    prev.onclick = () => {
      currentPage--;
      renderResults();
      window.scrollTo(0, 0); // Scroll to top

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
      window.scrollTo(0, 0); // Scroll to top
    };
    pagination.appendChild(next);
  }
}

function changePageSize() {
  itemsPerPage = parseInt(document.getElementById('page-size').value);
  currentPage = 1;
  renderResults();
}

function filterResults(category) {
  const filtered = category === 'all'
    ? resultsData
    : resultsData.filter(item => item.categories && item.categories.toLowerCase() === categories.toLowerCase());
  currentPage = 1;
  resultsData = filtered;
  renderResults();

  document.querySelectorAll('.categories button').forEach(btn => btn.classList.remove('active'));
  const activeBtn = Array.from(document.querySelectorAll('.categories button')).find(btn =>
    btn.textContent.toLowerCase().includes(categories.toLowerCase()));
  if (activeBtn) activeBtn.classList.add('active');
}

function toggleTheme() {
  const body = document.body;
  const isLight = body.classList.toggle('light-mode');
  body.classList.toggle('dark-mode', !isLight);
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  renderResults();
}

const backToTopButton = document.getElementById('back-to-top');

  // Show/hide button on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopButton.style.display = 'block';
    } else {
      backToTopButton.style.display = 'none';
    }
  });

  // Scroll to top smoothly when clicked
  backToTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

function goBack() {
  window.history.back();
}

function showWishlist() {
  document.getElementById('wishlist-modal').style.display = 'block';
}

function closeWishlist() {
  document.getElementById('wishlist-modal').style.display = 'none';
}

function toggleFavorite(el, id) {
  el.classList.toggle('favorited');
  let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  if (wishlist.includes(id)) {
    wishlist = wishlist.filter(x => x !== id);
  } else {
    wishlist.push(id);
  }
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  updateWishlistUI();
}

function updateWishlistUI() {
  const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  const wishlistItems = document.getElementById('wishlist-items');
  wishlistItems.innerHTML = wishlist.map(id => `<div>${id}</div>`).join('');
}

function clearWishlist() {
  localStorage.removeItem('wishlist');
  updateWishlistUI();
}

document.addEventListener('DOMContentLoaded', () => {
  const theme = localStorage.getItem('theme') || 'dark';
  if (theme === 'light') {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.add('dark-mode');
  }
  if (typeof searchTerm !== 'undefined') loadResults(searchTerm);
  updateWishlistUI();
});

function displaySpeed(searchTime, numresults) {
  const speedContainer = document.getElementById('speed-container');
  speedContainer.innerHTML = `
    <p><strong>Search Time:</strong> ${searchTime.toFixed(4)} seconds for ${numresults} results</p>
  `;
}
