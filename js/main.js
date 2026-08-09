// Scroll-triggered reveal animations
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// Sticky header shadow on scroll
const header = document.querySelector('.site-header');
const headerSentinel = document.querySelector('#hero');
if (header && headerSentinel) {
  const headerObserver = new IntersectionObserver(([entry]) => {
    header.classList.toggle('scrolled', !entry.isIntersecting);
  }, { rootMargin: '-1px 0px 0px 0px' });
  headerObserver.observe(headerSentinel);
}

// Mobile nav toggle
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');

function closeNav() {
  navToggle.setAttribute('aria-expanded', 'false');
  navLinks.classList.remove('open');
}

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    navLinks.classList.toggle('open', !isOpen);
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('click', (e) => {
    if (!navLinks.classList.contains('open')) return;
    if (!e.target.closest('.navbar')) closeNav();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) closeNav();
  });
}

// Particle field generation
function createParticles(container, count) {
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('span');
    particle.className = 'particle';
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.setProperty('--duration', `${6 + Math.random() * 6}s`);
    particle.style.setProperty('--delay', `${Math.random() * 6}s`);
    particle.style.setProperty('--dx', `${(Math.random() - 0.5) * 40}px`);
    particle.style.setProperty('--dy', `${(Math.random() - 0.5) * 40}px`);
    container.appendChild(particle);
  }
}

const particleField = document.getElementById('particle-field');
if (particleField) createParticles(particleField, 12);

const siteParticleField = document.getElementById('site-particle-field');
if (siteParticleField) createParticles(siteParticleField, 24);

// Workflow diagram animation (replays every time it re-enters the viewport)
const workflowDiagram = document.querySelector('.workflow-diagram');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (workflowDiagram && !prefersReducedMotion) {
  const workflowNodes = workflowDiagram.querySelectorAll('.workflow-node');
  const workflowConnectors = workflowDiagram.querySelectorAll('.workflow-connector');
  let workflowTimers = [];

  function resetWorkflow() {
    workflowTimers.forEach(clearTimeout);
    workflowTimers = [];
    workflowNodes.forEach((node) => node.classList.remove('active'));
    workflowConnectors.forEach((connector) => connector.classList.remove('filled'));
  }

  function playWorkflow() {
    resetWorkflow();
    const STEP = 550;
    workflowNodes[0].classList.add('active');
    workflowConnectors.forEach((connector, i) => {
      workflowTimers.push(setTimeout(() => {
        connector.classList.add('filled');
      }, STEP * i + 300));
      workflowTimers.push(setTimeout(() => {
        workflowNodes[i + 1].classList.add('active');
      }, STEP * i + 800));
    });
  }

  const workflowObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        playWorkflow();
      } else {
        resetWorkflow();
      }
    });
  }, { threshold: 0.4 });

  workflowObserver.observe(workflowDiagram);
}

// About photos pop/fade-in animation (replays every time it re-enters the viewport)
const aboutPhotos = document.querySelector('.about-photos');
if (aboutPhotos && !prefersReducedMotion) {
  const aboutPhotoWraps = aboutPhotos.querySelectorAll('.about-photo-wrap');
  const aboutPhotosObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      aboutPhotoWraps.forEach((wrap) => wrap.classList.toggle('pop', entry.isIntersecting));
    });
  }, { threshold: 0.3 });

  aboutPhotosObserver.observe(aboutPhotos);
}
