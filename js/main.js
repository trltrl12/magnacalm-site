/* ===== MAGNACALM — MAIN JS ===== */

// Purchase tab toggle
function selectTab(el, type) {
  document.querySelectorAll('.purchase-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('subscribe-price').style.display = type === 'subscribe' ? 'block' : 'none';
  document.getElementById('onetime-price').style.display = type === 'onetime' ? 'block' : 'none';
  const btn = document.querySelector('.btn-primary.add-to-bag');
  if (btn) btn.textContent = type === 'subscribe' ? 'Add to Bag \u2014 $29.25' : 'Add to Bag \u2014 $39.00';
}

// Size selector
function selectSize(el) {
  document.querySelectorAll('.size-option').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
}

// FAQ toggle
function toggleFaq(el) {
  const answer = el.nextElementSibling;
  const isOpen = answer.classList.contains('open');
  document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
  document.querySelectorAll('.faq-question').forEach(q => q.classList.remove('open'));
  if (!isOpen) {
    answer.classList.add('open');
    el.classList.add('open');
  }
}

// Scroll animations
document.addEventListener('DOMContentLoaded', function() {
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

  // Sticky nav active state
  const navLinks = document.querySelectorAll('.product-nav a');
  const sections = document.querySelectorAll('section[id]');
  if (navLinks.length && sections.length) {
    window.addEventListener('scroll', function() {
      let current = '';
      sections.forEach(function(section) {
        if (window.scrollY >= section.offsetTop - 150) {
          current = section.getAttribute('id');
        }
      });
      navLinks.forEach(function(link) {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) link.classList.add('active');
      });
    });
  }
});

// Multi-step form
function initMultiStepForm() {
  const form = document.getElementById('multiStepForm');
  if (!form) return;

  const steps = form.querySelectorAll('.form-step');
  const progressSteps = document.querySelectorAll('.progress-step');
  const progressBar = document.querySelector('.form-progress-bar');
  let currentStep = 0;

  function showStep(index) {
    steps.forEach((s, i) => {
      s.classList.toggle('active', i === index);
    });
    progressSteps.forEach((ps, i) => {
      ps.classList.remove('active', 'completed');
      if (i < index) ps.classList.add('completed');
      if (i === index) ps.classList.add('active');
    });
    if (progressBar) {
      const pct = (index / (steps.length - 1)) * 100;
      progressBar.style.width = pct + '%';
    }
    currentStep = index;
  }

  window.nextStep = function() {
    const currentFields = steps[currentStep].querySelectorAll('input[required], select[required], textarea[required]');
    let valid = true;
    currentFields.forEach(f => {
      if (!f.value.trim()) {
        f.style.borderColor = '#c0392b';
        valid = false;
      } else {
        f.style.borderColor = '';
      }
    });
    if (valid && currentStep < steps.length - 1) showStep(currentStep + 1);
  };

  window.prevStep = function() {
    if (currentStep > 0) showStep(currentStep - 1);
  };

  showStep(0);
}

document.addEventListener('DOMContentLoaded', initMultiStepForm);

// Stripe Checkout (replace with your Stripe publishable key and price IDs)
async function handleCheckout() {
  /*
  // Uncomment and configure when you have your Stripe keys:
  const stripe = Stripe('pk_live_YOUR_PUBLISHABLE_KEY');
  const { error } = await stripe.redirectToCheckout({
    lineItems: [{ price: 'price_YOUR_PRICE_ID', quantity: 1 }],
    mode: 'payment',
    successUrl: window.location.origin + '/success',
    cancelUrl: window.location.origin,
  });
  if (error) console.error(error);
  */
  alert('Stripe Checkout will be configured here. See README for setup instructions.');
}
