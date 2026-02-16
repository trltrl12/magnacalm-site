/* ===== MAGNACALM — MAIN JS ===== */

// ── Purchase widget ──────────────────────────────────────────────────────────

function pwSelectTab(btn) {
  document.querySelectorAll('.pw-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const type = btn.dataset.type;
  document.getElementById('pw-price-subscribe').style.display = type === 'subscribe' ? 'block' : 'none';
  document.getElementById('pw-price-onetime').style.display   = type === 'onetime'   ? 'block' : 'none';
  if (window.MC && window.MC.track) MC.track('pw_tab_select', { type });
}

function pwSelectSize(btn) {
  document.querySelectorAll('.pw-size').forEach(s => s.classList.remove('active'));
  btn.classList.add('active');
  if (window.MC && window.MC.track) MC.track('pw_size_select', { days: btn.dataset.days });
}

// ── FAQ accordion ────────────────────────────────────────────────────────────

function toggleFaq(btn) {
  const item   = btn.closest('.faq-item');
  const answer = item.querySelector('.faq-a');
  const isOpen = btn.classList.contains('open');

  document.querySelectorAll('.faq-q.open').forEach(q => {
    q.classList.remove('open');
    q.closest('.faq-item').querySelector('.faq-a').classList.remove('open');
  });

  if (!isOpen) {
    btn.classList.add('open');
    answer.classList.add('open');
    if (window.MC && window.MC.track) MC.track('faq_open', { question: btn.textContent.trim().slice(0, 60) });
  }
}

// ── Newsletter form ───────────────────────────────────────────────────────────

async function submitNewsletter(e) {
  e.preventDefault();
  const form       = e.target;
  const email      = document.getElementById('newsletterEmail').value.trim();
  const honeypot   = form.querySelector('[name="mc-hp-nl"]').value;
  const btn        = form.querySelector('.ec-submit-btn');
  const successEl  = document.getElementById('nlSuccess');

  // Bot check — honeypot filled means bot
  if (honeypot) return;

  // Bot timing check
  if (window.MC && MC.isBot()) return;

  // Email validation
  if (!isValidEmail(email)) {
    document.getElementById('newsletterEmail').style.borderColor = '#E53E3E';
    return;
  }

  btn.disabled = true;
  document.getElementById('nlBtnText').textContent = '...';

  try {
    await netlifyFormSubmit('mc-newsletter', {
      email,
      source: 'newsletter_section',
      session_id: window.MC ? MC.sessionId : '',
      'mc-hp-nl': ''
    });
    successEl.style.display = 'block';
    form.querySelector('.ec-input-wrap').style.display = 'none';
    form.querySelector('.ec-terms').style.display = 'none';
    if (window.MC && MC.track) MC.track('newsletter_signup', { email, source: 'section' });
  } catch (err) {
    btn.disabled = false;
    document.getElementById('nlBtnText').textContent = 'Retry';
    console.warn('Newsletter submit failed:', err);
  }
}

// ── Cart drawer ──────────────────────────────────────────────────────────────

let currentCartStep = 1;
let cartEmailValue  = '';

function openCart() {
  const overlay = document.getElementById('cartOverlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  // Reset to step 1 unless already on step 3 (completed)
  if (currentCartStep !== 3) goToCartStep(1);
  if (window.MC && MC.track) MC.track('cart_open', { step: currentCartStep });

  // Set step dot numbers
  const dots = document.querySelectorAll('.cd-step-dot');
  dots.forEach((d, i) => { d.setAttribute('data-n', i + 1); });
}

function closeCart() {
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow = '';
  if (window.MC && MC.track) MC.track('cart_close', { step: currentCartStep });
}

function overlayClickClose(e) {
  if (e.target === document.getElementById('cartOverlay')) closeCart();
}

// Navigate to a step (1-indexed)
function goToCartStep(n) {
  currentCartStep = n;
  const track = document.getElementById('cdStepsTrack');
  track.setAttribute('data-step', n);

  // Update dots
  const dots = document.querySelectorAll('.cd-step-dot');
  dots.forEach((d, i) => {
    d.classList.remove('active', 'done');
    if (i + 1 < n) d.classList.add('done');
    else if (i + 1 === n) d.classList.add('active');
    d.setAttribute('data-n', i + 1);
  });
}

// Validate + submit step, then advance
async function cartNextStep(step) {
  if (step === 1) {
    const email    = document.getElementById('cdEmail').value.trim();
    const honeypot = document.getElementById('cartHoneypot1').value;
    const errEl    = document.getElementById('cdEmailErr');
    const btn      = document.getElementById('cdNext1');
    const spinner  = document.getElementById('cdSubmitting1');

    // Bot checks
    if (honeypot) { closeCart(); return; }
    if (window.MC && MC.isBot()) return;

    // Validate
    if (!isValidEmail(email)) {
      document.getElementById('cdEmail').classList.add('error');
      errEl.textContent = 'Please enter a valid email address.';
      return;
    }
    document.getElementById('cdEmail').classList.remove('error');
    errEl.textContent = '';

    btn.style.display     = 'none';
    spinner.style.display = 'flex';

    try {
      const marketing = document.getElementById('cdMarketing').checked;
      await netlifyFormSubmit('mc-email', {
        email,
        marketing: marketing ? 'yes' : 'no',
        source:     'cart_step1',
        session_id: window.MC ? MC.sessionId : '',
        'mc-hp-email': ''
      });
      cartEmailValue = email;
      if (window.MC && MC.track) MC.track('cart_email_submitted', { marketing });
      goToCartStep(2);
    } catch (err) {
      console.warn('Step 1 submit error:', err);
      // Still advance — don't block the user on network errors
      cartEmailValue = email;
      goToCartStep(2);
    } finally {
      btn.style.display     = 'flex';
      spinner.style.display = 'none';
    }
  }

  else if (step === 2) {
    const honeypot = document.getElementById('cartHoneypot2').value;
    if (honeypot) { closeCart(); return; }
    if (window.MC && MC.isBot()) return;

    const fields = {
      name:    { el: document.getElementById('cdName'),   errId: 'cdNameErr',  label: 'Full name is required.' },
      addr1:   { el: document.getElementById('cdAddr1'),  errId: 'cdAddr1Err', label: 'Address is required.' },
      city:    { el: document.getElementById('cdCity'),   errId: 'cdCityErr',  label: 'City is required.' },
      state:   { el: document.getElementById('cdState'),  errId: 'cdStateErr', label: 'State is required.' },
      zip:     { el: document.getElementById('cdZip'),    errId: 'cdZipErr',   label: 'ZIP code is required.' },
    };

    let valid = true;
    for (const key of Object.keys(fields)) {
      const f = fields[key];
      if (!f.el.value.trim()) {
        f.el.classList.add('error');
        document.getElementById(f.errId).textContent = f.label;
        valid = false;
      } else {
        f.el.classList.remove('error');
        document.getElementById(f.errId).textContent = '';
      }
    }
    if (!valid) return;

    const btn     = document.getElementById('cdNext2');
    const spinner = document.getElementById('cdSubmitting2');
    btn.style.display     = 'none';
    spinner.style.display = 'flex';

    try {
      await netlifyFormSubmit('mc-address', {
        full_name:  document.getElementById('cdName').value.trim(),
        email:      cartEmailValue,
        address1:   document.getElementById('cdAddr1').value.trim(),
        address2:   document.getElementById('cdAddr2').value.trim(),
        city:       document.getElementById('cdCity').value.trim(),
        state:      document.getElementById('cdState').value.trim(),
        zip:        document.getElementById('cdZip').value.trim(),
        country:    document.getElementById('cdCountry').value,
        product:    'MagnaCalm-MG01',
        session_id: window.MC ? MC.sessionId : '',
        'mc-hp-addr': ''
      });
      if (window.MC && MC.track) MC.track('cart_address_submitted', {});
    } catch (err) {
      console.warn('Step 2 submit error:', err);
      // Still advance
    } finally {
      btn.style.display     = 'flex';
      spinner.style.display = 'none';
    }

    // Show confirmation info in step 3
    document.getElementById('confirmEmail').textContent = cartEmailValue;
    document.getElementById('queuePosition').textContent = generateQueuePosition();
    goToCartStep(3);
  }
}

function cartPrevStep(step) {
  if (step > 1) goToCartStep(step - 1);
}

function generateQueuePosition() {
  // Realistic-looking queue number (consistent per session)
  const base = 1847;
  const seed  = (window.MC && MC.sessionId) ? parseInt(MC.sessionId.slice(-4), 16) % 500 : 0;
  return (base + seed).toLocaleString();
}

function shareWaitlist(method) {
  const url  = window.location.origin;
  const text = "I just joined the waitlist for MagnaCalm — a clean magnesium + ashwagandha supplement. Join me:";
  if (method === 'copy') {
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.querySelector('[onclick="shareWaitlist(\'copy\')"]');
      if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy Link'; }, 2000); }
    });
  } else if (method === 'twitter') {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  }
  if (window.MC && MC.track) MC.track('cart_share', { method });
}

// ── Netlify Forms AJAX submit ─────────────────────────────────────────────────

function netlifyFormSubmit(formName, data) {
  const params = new URLSearchParams();
  params.append('form-name', formName);
  for (const [key, value] of Object.entries(data)) {
    params.append(key, value);
  }
  return fetch('/', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString()
  }).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Scroll-in animations ─────────────────────────────────────────────────────

const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));

// ── Product nav active-section tracking ────────────────────────────────────

const productNavLinks = document.querySelectorAll('.product-nav a');
if (productNavLinks.length) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        productNavLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
        if (window.MC && MC.track) MC.track('section_view', { section: id });
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('section[id]').forEach(s => sectionObserver.observe(s));
}

// ── Mobile menu ───────────────────────────────────────────────────────────────

const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinks      = document.getElementById('navLinks');
if (mobileMenuBtn && navLinks) {
  mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('mobile-open');
  });
  document.addEventListener('click', (e) => {
    if (!mobileMenuBtn.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('mobile-open');
    }
  });
}

// ── Keyboard: close cart with Escape ────────────────────────────────────────

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const overlay = document.getElementById('cartOverlay');
    if (overlay && overlay.classList.contains('open')) closeCart();
  }
});
