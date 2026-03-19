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


// ── TOPIC / FILTER PILLS ──
// Maps pill text to the data-tags values used on articles
const tagMap = {
  'All':            null,
  'Fighting Fantasy': 'fighting-fantasy',
  'Lone Wolf':      'lone-wolf',
  'Sorcery!':       'sorcery',
  'CYOA':           'cyoa',
  'Twine & IF':     'twine-if',
  'Essays':         'essay',
};

document.querySelectorAll('.topic-pill').forEach(function (pill) {
  pill.addEventListener('click', function () {
    document.querySelectorAll('.topic-pill').forEach(function (p) {
      p.classList.remove('active');
    });
    this.classList.add('active');

    const filter = tagMap[this.textContent.trim()];
    const articles = document.querySelectorAll('[data-tags]');
    if (!articles.length) return;

    articles.forEach(function (article) {
      if (!filter) {
        article.style.display = '';
      } else {
        const tags = article.getAttribute('data-tags') || '';
        article.style.display = tags.includes(filter) ? '' : 'none';
      }
    });

    // On the reviews page, hide section breaks whose grid has no visible cards
    document.querySelectorAll('.section-break').forEach(function (br) {
      // Find the reviews-grid that follows this section break
      var grid = br.nextElementSibling;
      while (grid && !grid.classList.contains('reviews-grid')) {
        grid = grid.nextElementSibling;
      }
      if (!grid) return;
      var hasVisible = Array.from(grid.querySelectorAll('[data-tags]')).some(function (a) {
        return a.style.display !== 'none';
      });
      br.style.display = hasVisible || !filter ? '' : 'none';
      grid.style.display = hasVisible || !filter ? '' : 'none';
    });
  });
});


// ── DICE ROLLER ──
const die = document.getElementById('die');
const dieResult = document.getElementById('die-result');

if (die && dieResult) {
  const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  const outcomes = [
    [2,  'Snake eyes. You fall into a pit. Lose 4 STAMINA.'],
    [3,  'A poor roll. The fates are unkind.'],
    [4,  'Barely adequate. You survive, for now.'],
    [5,  'Mediocre. The dungeon smirks.'],
    [6,  'Passable. You keep moving, cautiously.'],
    [7,  'Fair. The monster hesitates.'],
    [8,  'Decent. Your sword arm holds steady.'],
    [9,  'Good. Fortune is cautiously on your side.'],
    [10, 'Strong! You press the advantage.'],
    [11, 'Excellent! Even the dungeon is impressed.'],
    [12, 'Maximum roll. You are briefly unstoppable.']
  ];

  function rollDie() {
    const d1 = Math.floor(Math.random() * 6);
    const d2 = Math.floor(Math.random() * 6);
    const total = d1 + d2 + 2;
    die.textContent = faces[d1];
    const outcome = outcomes.find(function (o) { return o[0] === total; });
    dieResult.innerHTML = '<strong>' + total + '</strong> — ' + outcome[1];
  }

  die.addEventListener('click', rollDie);

  const dieBtn = document.querySelector('.die-btn');
  if (dieBtn) dieBtn.addEventListener('click', rollDie);
}


// ── NEWSLETTER SUBSCRIPTION ──
// Finds all newsletter forms on the page and wires them up to /api/subscribe.
// Each form needs: an input[type="email"] and a button[type="button" or "submit"].
// Feedback is shown in a sibling .newsletter-msg element, created if not present.

document.querySelectorAll('.newsletter-box, .about-cta-form').forEach(function (form) {
  const input = form.querySelector('input[type="email"]');
  const button = form.querySelector('button');
  if (!input || !button) return;

  // Create a message element for feedback
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
            ? 'You\'re already subscribed — good to have you.'
            : 'You\'re in. Talk soon.',
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
