const form = document.getElementById('searchForm');
const input = document.getElementById('q');
const results = document.getElementById('results');

let savedBooks = [];

async function loadBookmarks() {
  try {
    const res = await fetch('/api/bookmarks');
    if (!res.ok) {
      throw new Error('Failed to load bookmarks');
    }
    savedBooks = await res.json();
  } catch (err) {
    console.error(err);
    savedBooks = [];
  }
}

function isSaved(id) {
  return savedBooks.some(book => book.id === id);
}

async function updateWishlistCount() {
  try {
    const res = await fetch('/api/bookmarks');
    if (!res.ok) {
      throw new Error('Failed to load count');
    }

    const books = await res.json();
    const el = document.getElementById('wishlistCount');

    if (el) {
      el.textContent = books.length;
    }
  } catch (err) {
    console.error(err);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const q = input.value.trim();
  if (!q) return;

  results.innerHTML = '<p style="color:#fff;">Searching...</p>';

  try {
    await loadBookmarks();

    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=12`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error('Failed to search books');
    }

    const data = await res.json();
    const docs = data.docs || [];

    await updateWishlistCount();

    if (docs.length === 0) {
      results.innerHTML = '<p style="color:#fff;">No results found.</p>';
      return;
    }

    results.innerHTML = docs.map((doc) => {
      const id = doc.key || '';
      const title = doc.title || 'Untitled';
      const author = doc.author_name ? doc.author_name.join(', ') : 'Unknown';
      const year = doc.first_publish_year || '';
      const coverId = doc.cover_i;

      const img = coverId
        ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
        : 'https://via.placeholder.com/128x192?text=No+Cover';

      const savedClass = isSaved(id) ? ' saved' : '';

      const svgOutline = `
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M7 3h10a1 1 0 0 1 1 1v16l-6-3-6 3V4a1 1 0 0 1 1-1z"
                fill="none" stroke="currentColor" stroke-width="2" />
        </svg>`;

      const svgFilled = `
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M7 3h10a1 1 0 0 1 1 1v16l-6-3-6 3V4a1 1 0 0 1 1-1z" />
        </svg>`;

      return `
        <article class="card">
          <div class="cover-wrap">
            <img src="${img}" alt="${title}">
            <button
              class="bookmark-btn${savedClass}"
              aria-label="Bookmark book"
              title="${isSaved(id) ? 'Saved' : 'Add to Wishlist'}"
              data-id="${String(id).replace(/"/g, '&quot;')}"
              data-title="${String(title).replace(/"/g, '&quot;')}"
              data-author="${String(author).replace(/"/g, '&quot;')}"
              data-year="${String(year).replace(/"/g, '&quot;')}"
              data-img="${String(img).replace(/"/g, '&quot;')}"
            >
              <span class="icon outline">${svgOutline}</span>
              <span class="icon filled">${svgFilled}</span>
            </button>
          </div>
          <div class="meta">
            <h3>${title}</h3>
            <p>${author}${year ? ` · ${year}` : ''}</p>
          </div>
        </article>
      `;
    }).join('');
  } catch (err) {
    console.error(err);
    results.innerHTML = '<p style="color:#fff;">Something went wrong. Please try again.</p>';
  }
});

results.addEventListener('click', async (e) => {
  const btn = e.target.closest('.bookmark-btn');
  if (!btn) return;

  const book = {
    id: btn.dataset.id,
    title: btn.dataset.title,
    author: btn.dataset.author,
    year: btn.dataset.year,
    img: btn.dataset.img
  };

  try {
    if (btn.classList.contains('saved')) {
      const res = await fetch(`/api/bookmarks/${encodeURIComponent(book.id)}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error('Failed to delete bookmark');
      }

      btn.classList.remove('saved');
      btn.setAttribute('title', 'Add to Wishlist');
      savedBooks = savedBooks.filter((b) => b.id !== book.id);
    } else {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(book)
      });

      if (!res.ok) {
        throw new Error('Failed to save bookmark');
      }

      btn.classList.add('saved');
      btn.setAttribute('title', 'Saved');
      savedBooks.push(book);
    }

    await updateWishlistCount();
  } catch (err) {
    console.error(err);
    alert('Something went wrong. Please try again.');
  }
});

updateWishlistCount();