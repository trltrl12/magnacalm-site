/* ===== MAGNACALM — MAIN JS ===== */

// ── Purchase tab toggle (Subscribe / One-Time) ──────────────────────────────
function selectTab(btn, type) {
  document.querySelectorAll('.purchase-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('subscribe-price').style.display = type === 'subscribe' ? 'block' : 'none';
  document.getElementById('onetime-price').style.display   = type === 'onetime'   ? 'block' : 'none';
}

// ── Size option selector ────────────────────────────────────────────────────
function selectSize(btn) {
  document.querySelectorAll('.size-option').forEach(s => s.classList.remove('active'));
  btn.classList.add('active');
}

// ── FAQ accordion ───────────────────────────────────────────────────────────
function toggleFaq(btn) {
  const item   = btn.closest('.faq-item');
  const answer = item.querySelector('.faq-answer');
  const isOpen = btn.classList.contains('open');

  // Close all open items first
  document.querySelectorAll('.faq-question.open').forEach(q => {
    q.classList.remove('open');
    q.closest('.faq-item').querySelector('.faq-answer').classList.remove('open');
  });

  if (!isOpen) {
    btn.classList.add('open');
    answer.classList.add('open');
  }
}

// ── Checkout handler (replace with Stripe integration) ──────────────────────
function handleCheckout() {
  // To enable payments, set up Stripe:
  // 1. npm install @stripe/stripe-js
  // 2. Replace the alert below with your Stripe checkout session redirect
  alert('Checkout coming soon! Configure your Stripe keys in js/main.js to enable payments.');
}

// ── Multi-step contact form ─────────────────────────────────────────────────
function nextStep() {
  const steps         = document.querySelectorAll('.form-step');
  const progressSteps = document.querySelectorAll('.progress-step');
  const progressBar   = document.querySelector('.form-progress-bar');

  let currentIndex = -1;
  steps.forEach((step, i) => { if (step.classList.contains('active')) currentIndex = i; });
  if (currentIndex === -1) return;

  // Validate required fields in current step
  const requiredFields = steps[currentIndex].querySelectorAll('[required]');
  let valid = true;
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      valid = false;
      field.style.borderColor = '#FF6B9D';
      field.addEventListener('input', () => { field.style.borderColor = ''; }, { once: true });
    }
  });
  if (!valid) return;

  if (currentIndex < steps.length - 1) {
    steps[currentIndex].classList.remove('active');
    steps[currentIndex + 1].classList.add('active');

    progressSteps[currentIndex].classList.remove('active');
    progressSteps[currentIndex].classList.add('completed');
    progressSteps[currentIndex + 1].classList.add('active');

    if (progressBar) {
      progressBar.style.width = ((currentIndex + 1) / (steps.length - 1) * 100) + '%';
    }
  }
}

function prevStep() {
  const steps         = document.querySelectorAll('.form-step');
  const progressSteps = document.querySelectorAll('.progress-step');
  const progressBar   = document.querySelector('.form-progress-bar');

  let currentIndex = -1;
  steps.forEach((step, i) => { if (step.classList.contains('active')) currentIndex = i; });
  if (currentIndex <= 0) return;

  steps[currentIndex].classList.remove('active');
  steps[currentIndex - 1].classList.add('active');

  progressSteps[currentIndex].classList.remove('active');
  progressSteps[currentIndex - 1].classList.remove('completed');
  progressSteps[currentIndex - 1].classList.add('active');

  if (progressBar) {
    progressBar.style.width = ((currentIndex - 1) / (steps.length - 1) * 100) + '%';
  }
}

// ── Scroll-in animations (.fade-up) ────────────────────────────────────────
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

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
      }
    });
  }, { threshold: 0.35 });

  document.querySelectorAll('section[id]').forEach(s => sectionObserver.observe(s));
}

// ── Mobile menu toggle ──────────────────────────────────────────────────────
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks      = document.querySelector('.nav-links');
if (mobileMenuBtn && navLinks) {
  mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('mobile-open');
  });
}
