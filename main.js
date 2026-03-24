/* =============================================
   Make Your Choice — makeyourchoice.blog
   main.js — all scripts for all pages
   ============================================= */


// ── HAMBURGER MENU ──
const navToggle = document.getElementById('nav-toggle');
const mobileNav = document.getElementById('mobile-nav');

if (navToggle && mobileNav) {
  navToggle.addEventListener('click', function (e) {
    e.stopPropagation();
    mobileNav.classList.toggle('open');
  });

  document.addEventListener('click', function (e) {
    if (mobileNav.classList.contains('open') &&
        !mobileNav.contains(e.target) &&
        !navToggle.contains(e.target)) {
      mobileNav.classList.remove('open');
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') mobileNav.classList.remove('open');
  });
}


// ── SCROLL-TRIGGERED POST LOADING ──
// All posts live in the DOM but are hidden. We reveal them BATCH_SIZE at a time
// as the user scrolls near the bottom of the visible list.
// When a filter is active, only matching posts count toward the batch.

(function () {
  const BATCH_SIZE = 10;
  const list = document.getElementById('post-list');
  const sentinel = document.getElementById('load-sentinel');
  if (!list || !sentinel) return;

  let currentFilter = 'all';
  let visibleCount = 0;

  function getAllPosts() {
    // Exclude the featured post — it's always visible and not part of the paginated list
    return Array.from(list.querySelectorAll('article.post-row'));
  }

  function getFilteredPosts() {
    return getAllPosts().filter(function (post) {
      if (currentFilter === 'all') return true;
      return (post.getAttribute('data-tags') || '').includes(currentFilter);
    });
  }

  // Hide all posts, then show the first BATCH_SIZE matching the current filter
  function applyFilter(filter) {
    currentFilter = filter;
    visibleCount = 0;

    // Handle featured post visibility
    var featured = document.getElementById('featured-post');
    if (featured) {
      if (filter === 'all') {
        featured.style.display = '';
      } else {
        const tags = featured.getAttribute('data-tags') || '';
        featured.style.display = tags.includes(filter) ? '' : 'none';
      }
    }

    getAllPosts().forEach(function (post) {
      post.style.display = 'none';
    });

    showNextBatch();
  }

  function showNextBatch() {
    const filtered = getFilteredPosts();
    const toShow = filtered.slice(visibleCount, visibleCount + BATCH_SIZE);

    toShow.forEach(function (post) {
      post.style.display = '';
    });

    visibleCount += toShow.length;

    // Hide sentinel if all matching posts are now visible
    if (visibleCount >= getFilteredPosts().length) {
      sentinel.style.display = 'none';
    } else {
      sentinel.style.display = 'block';
    }
  }

  // IntersectionObserver watches the sentinel element at the bottom of the list
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        showNextBatch();
      }
    });
  }, { rootMargin: '200px' });

  observer.observe(sentinel);

  // Initial load
  applyFilter('all');

  // Expose applyFilter so the pill/sidebar handlers can call it
  window.applyPostFilter = applyFilter;
})();


// ── INLINE FILTER PILLS (homepage) ──
document.querySelectorAll('.filter-pill').forEach(function (pill) {
  pill.addEventListener('click', function () {
    document.querySelectorAll('.filter-pill').forEach(function (p) {
      p.classList.remove('active');
    });
    this.classList.add('active');
    const filter = this.getAttribute('data-filter');
    if (window.applyPostFilter) window.applyPostFilter(filter);
  });
});


// ── NEWSLETTER SUBSCRIPTION ──
document.querySelectorAll('.newsletter-box, .about-cta-form').forEach(function (form) {
  const input = form.querySelector('input[type="email"]');
  const button = form.querySelector('button');
  if (!input || !button) return;

  let msg = form.querySelector('.newsletter-msg');
  if (!msg) {
    msg = document.createElement('p');
    msg.className = 'newsletter-msg';
    msg.style.cssText = 'font-family:var(--sans);font-size:0.78rem;margin-top:0.5rem;min-height:1.2em;';
    button.insertAdjacentElement('afterend', msg);
  }

  function setMsg(text, isError) {
    msg.textContent = text;
    msg.style.color = isError ? '#c0392b' : '#1a8917';
  }

  button.addEventListener('click', async function () {
    const email = input.value.trim();

    if (!email || !email.includes('@')) {
      setMsg('Please enter a valid email address.', true);
      return;
    }

    button.disabled = true;
    button.textContent = 'Subscribing…';
    msg.textContent = '';

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        input.value = '';
        button.textContent = 'Subscribed ✓';
        setMsg(
          data.alreadySubscribed
            ? "You're already subscribed — good to have you."
            : "You're in. Talk soon.",
          false
        );
      } else {
        button.disabled = false;
        button.textContent = 'Subscribe';
        setMsg(data.error || 'Something went wrong. Please try again.', true);
      }
    } catch (err) {
      button.disabled = false;
      button.textContent = 'Subscribe';
      setMsg('Could not connect. Please try again.', true);
    }
  });
});

// ── SHARE BUTTON ──
// Uses Web Share API on mobile, falls back to copying the URL on desktop.
const shareBtn = document.getElementById('share-btn');

if (shareBtn) {
  shareBtn.addEventListener('click', async function () {
    const url = window.location.href;
    const title = document.title;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        // User cancelled or share failed — do nothing
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(url);
        const original = shareBtn.innerHTML;
        shareBtn.title = 'Copied!';
        shareBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="20 6 9 17 4 12"/></svg>';
        setTimeout(function () {
          shareBtn.innerHTML = original;
          shareBtn.title = 'Share';
        }, 2000);
      } catch (err) {
        // Clipboard failed — nothing useful to do
      }
    }
  });
}


// ── SPOILERS ──
// Inline spoilers: <span class="spoiler">hidden text</span>
// Block spoilers: <details class="spoiler-block"><summary></summary><p>...</p></details>
// The block spoiler uses native <details> so needs no JS.
// The inline spoiler needs a click handler.

document.querySelectorAll('.spoiler').forEach(function (el) {
  el.addEventListener('click', function () {
    this.classList.toggle('revealed');
  });
});


// ── READING PROGRESS BAR ──
const progressBar = document.getElementById('progress');

if (progressBar) {
  window.addEventListener('scroll', function () {
    const body = document.body;
    const html = document.documentElement;
    const total = Math.max(body.scrollHeight, html.scrollHeight) - window.innerHeight;
    const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
    progressBar.style.width = pct + '%';
  });
}
