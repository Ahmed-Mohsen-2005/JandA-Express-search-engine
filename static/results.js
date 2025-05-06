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
    <div class="result-info">
      <h3>${item.product_name} <span class="favorite-star" onclick="toggleFavorite(this, '${item.docno}')">★</span></h3>
      <img src="${item.image_url}" alt="${item.product_name}" style="max-width: 120px; border-radius: 8px; margin: 10px 0;" />
      <p><strong>Brand:</strong> ${item.brand}</p>
      <p><strong>Description:</strong> ${highlightMatch(item.description, searchTerm)}</p>
      <p><strong>Price:</strong> ${item.final_price} ${item.currency} ${item.discount ? `(-${item.discount}% off)` : ''}</p>
      <p><strong>Availability:</strong> ${item.availability}</p>
      <p><strong>Rating:</strong> ⭐ ${item.rating} (${item.reviews_count} reviews)</p>
      <p><strong>Top Review:</strong> "${item.top_review}"</p>
      <p><strong>Sold by:</strong> ${item.buybox_seller}</p>
      <p><strong>Categories:</strong> ${item.categories}</p>
      <p class="url"><a href="${item.url}" target="_blank">View on Amazon</a></p>
      <p class="badge">${item.category || 'Uncategorized'}</p>
      <p style="font-size: 13px; color: #81d4fa;">Score: ${item.score.toFixed(2)}</p>
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

function changePageSize() {
  itemsPerPage = parseInt(document.getElementById('page-size').value);
  currentPage = 1;
  renderResults();
}

function filterResults(category) {
  const filtered = category === 'all'
    ? resultsData
    : resultsData.filter(item => item.category && item.category.toLowerCase() === category.toLowerCase());
  currentPage = 1;
  resultsData = filtered;
  renderResults();

  document.querySelectorAll('.categories button').forEach(btn => btn.classList.remove('active'));
  const activeBtn = Array.from(document.querySelectorAll('.categories button')).find(btn =>
    btn.textContent.toLowerCase().includes(category.toLowerCase()));
  if (activeBtn) activeBtn.classList.add('active');
}

function toggleTheme() {
  const body = document.body;
  const isLight = body.classList.toggle('light-mode');
  body.classList.toggle('dark-mode', !isLight);
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  renderResults();
}

function scrollTopSmooth() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

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