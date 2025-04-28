let resultsData = [...Array(50).keys()].map(i => ({
    id: i + 1,
    title: `Product ${i+1}`,
    description: "Amazing product you will love.",
    url: `https://example.com/product/${i+1}`,
    image: "https://via.placeholder.com/70",
    category: ["electronics", "fashion", "home", "sports"][i % 4],
    badge: i % 5 === 0 ? "Top Seller" : null
  }));
  
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
  
  function loadResults() {
    const results = document.getElementById('results');
    const pagination = document.getElementById('pagination');
    const filtered = currentCategory === 'all' ? resultsData : resultsData.filter(p => p.category === currentCategory);
  
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const toShow = filtered.slice(start, end);
  
    results.innerHTML = '';
  
    toShow.forEach(item => {
      const card = document.createElement('div');
      card.className = 'result-card';
      card.innerHTML = `
        <img src="${item.image}" alt="${item.title}" loading="lazy">
        <div class="result-info">
          <h3>
            <span>${item.title}</span>
            <span style="display: inline-flex; align-items: center; gap: 8px;">
              ${item.badge ? `<span class="badge">${item.badge}</span>` : ''}
              <span class="favorite-star ${favorites.includes(item.id) ? 'favorited' : ''}" onclick="toggleFavorite(${item.id})">
                ${favorites.includes(item.id) ? '⭐' : '☆'}
              </span>
            </span>
          </h3>
          <p>${item.description}</p>
          <div class="url">${item.url}</div>
        </div>
      `;
      card.onclick = (e) => {
        if (e.target.classList.contains('favorite-star')) return;
        window.open(item.url, '_blank');
      };
      results.appendChild(card);
    });
  
    // Pagination Controls
    pagination.innerHTML = '';
    pagination.style.display = 'flex';
    pagination.style.justifyContent = 'center';
    pagination.style.alignItems = 'center';
    pagination.style.gap = '20px';
  
    if (currentPage > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.innerText = '⬅️ Previous';
      prevBtn.onclick = () => {
        currentPage--;
        loadResults();
        scrollTopSmooth();
      };
      pagination.appendChild(prevBtn);
    }
  
    const pageInfo = document.createElement('span');
    pageInfo.style.color = 'gray';
    pageInfo.style.fontSize = '16px';
    pageInfo.innerText = `Page ${currentPage} of ${Math.ceil(filtered.length / itemsPerPage)}`;
    pagination.appendChild(pageInfo);
  
    if (end < filtered.length) {
      const nextBtn = document.createElement('button');
      nextBtn.innerText = 'Next ➡️';
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
    const input = document.getElementById('search-input').value.toLowerCase();
    const results = document.getElementById('results');
    const pagination = document.getElementById('pagination');
    const filtered = resultsData.filter(item =>
      (currentCategory === 'all' || item.category === currentCategory) &&
      (item.title.toLowerCase().includes(input) || item.description.toLowerCase().includes(input))
    );
  
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const toShow = filtered.slice(start, end);
  
    results.innerHTML = '';
  
    toShow.forEach(item => {
      const card = document.createElement('div');
      card.className = 'result-card';
      card.innerHTML = `
        <img src="${item.image}" alt="${item.title}" loading="lazy">
        <div class="result-info">
          <h3>
            <span>${item.title}</span>
            <span style="display: inline-flex; align-items: center; gap: 8px;">
              ${item.badge ? `<span class="badge">${item.badge}</span>` : ''}
              <span class="favorite-star ${favorites.includes(item.id) ? 'favorited' : ''}" onclick="toggleFavorite(${item.id})">
                ${favorites.includes(item.id) ? '⭐' : '☆'}
              </span>
            </span>
          </h3>
          <p>${item.description}</p>
          <div class="url">${item.url}</div>
        </div>
      `;
      card.onclick = (e) => {
        if (e.target.classList.contains('favorite-star')) return;
        window.open(item.url, '_blank');
      };
      results.appendChild(card);
    });
  
    pagination.innerHTML = '';
  }
  
  function toggleTheme() {
    if (document.body.classList.toggle('light-mode')) {
      localStorage.setItem('theme', 'light');
      document.documentElement.style.setProperty('--bg', '#ffffff');
      document.documentElement.style.setProperty('--text', '#121212');
      document.documentElement.style.setProperty('--card-bg', 'rgba(0,0,0,0.05)');
      document.documentElement.style.setProperty('--input-bg', '#f0f0f0');
      document.documentElement.style.setProperty('--cat-bg', '#eeeeee');
      document.documentElement.style.setProperty('--loader-border', '#cccccc');
      document.querySelector('.header').style.borderBottom = '1px solid #ccc'; // 🔥 light mode toolbar border
    } else {
      localStorage.setItem('theme', 'dark');
      document.documentElement.style.setProperty('--bg', '#121212');
      document.documentElement.style.setProperty('--text', '#e0e0e0');
      document.documentElement.style.setProperty('--card-bg', 'rgba(255,255,255,0.05)');
      document.documentElement.style.setProperty('--input-bg', '#2a2a2a');
      document.documentElement.style.setProperty('--cat-bg', '#181818');
      document.documentElement.style.setProperty('--loader-border', '#1f1f1f');
      document.querySelector('.header').style.borderBottom = '1px solid #333'; // 🔥 dark mode toolbar border
    }
  }
  
  
  function scrollTopSmooth() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  window.onscroll = function() {
    if (window.scrollY > 500) {
      document.getElementById('back-to-top').style.display = 'block';
    } else {
      document.getElementById('back-to-top').style.display = 'none';
    }
  };
  
  function showWishlist() {
    const modal = document.getElementById('wishlist-modal');
    const wishlistItems = document.getElementById('wishlist-items');
    modal.style.display = 'block';
    wishlistItems.innerHTML = '';
  
    const favItems = resultsData.filter(item => favorites.includes(item.id));
    if (favItems.length === 0) {
      wishlistItems.innerHTML = '<p>No favorite items yet!</p>';
      return;
    }
  
    favItems.forEach(item => {
      const div = document.createElement('div');
      div.style.margin = '10px 0';
      div.innerHTML = `
        <strong>${item.title}</strong><br>
        <small><a href="${item.url}" target="_blank" style="color: var(--primary)">Visit</a></small>
      `;
      wishlistItems.appendChild(div);
    });
  }
  
  function closeWishlist() {
    document.getElementById('wishlist-modal').style.display = 'none';
  }
  
  function clearWishlist() {
    favorites = [];
    saveFavorites();
    loadResults();  // 🔥 Reload search results to refresh stars
    showWishlist(); // 🔥 Refresh wishlist modal
  }
  
  
  // On Load
  if (localStorage.getItem('theme') === 'light') {
    toggleTheme();
  }
  
  loadResults();
  function goBack() {
    window.location.href = 'interface.html'; // 🔥 Change this to your actual previous page URL
  }  
  function changePageSize() {
    const selected = document.getElementById('page-size').value;
    itemsPerPage = parseInt(selected);
    currentPage = 1; // Reset to first page
    loadResults();
  }
  