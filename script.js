/* =====================================================================
   COMPRAR PARA PERTENECER — script.js
   Contiene, en este orden:
     1. Menú móvil (abrir/cerrar)
     2. Indicador de sección activa en la barra de navegación
     3. Gráfico de Chart.js (sección Estadísticas)
     4. Lightbox de la galería (JS puro: abrir, cerrar, anterior/siguiente, Esc)
   No requiere ninguna librería adicional aparte de Chart.js (cargado en
   index.html). Todo el código corre después de que el DOM esté listo.
===================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* -------------------------------------------------------------------
     1. MENÚ MÓVIL
  ------------------------------------------------------------------- */
  const navToggle = document.getElementById('navToggle');
  const navLinksEl = document.querySelector('.navbar__links');

  if (navToggle && navLinksEl) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinksEl.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Cierra el menú móvil al elegir una sección
    navLinksEl.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinksEl.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* -------------------------------------------------------------------
     2. INDICADOR DE SECCIÓN ACTIVA (barra deslizante bajo el enlace)
  ------------------------------------------------------------------- */
  const navLinks = Array.from(document.querySelectorAll('.navbar__link'));
  const navIndicator = document.getElementById('navIndicator');
  const trackedSections = navLinks
    .map((link) => document.getElementById(link.dataset.section))
    .filter(Boolean);

  function moveIndicatorTo(link) {
    if (!link || !navIndicator) return;
    // En vista móvil el menú de enlaces está oculto: no hay nada que mover
    if (getComputedStyle(navLinksEl).display === 'none') {
      navIndicator.style.opacity = '0';
      return;
    }
    const linkRect = link.getBoundingClientRect();
    const navRect = link.closest('.navbar__inner').getBoundingClientRect();
    navIndicator.style.left = `${linkRect.left - navRect.left}px`;
    navIndicator.style.width = `${linkRect.width}px`;
    navIndicator.style.opacity = '1';
  }

  function setActiveLink(sectionId) {
    let activeLink = null;
    navLinks.forEach((link) => {
      const isActive = link.dataset.section === sectionId;
      link.classList.toggle('is-active', isActive);
      if (isActive) activeLink = link;
    });
    moveIndicatorTo(activeLink);
  }

  if ('IntersectionObserver' in window && trackedSections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        // Elige la sección más visible en este momento del scroll
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveLink(visible.target.id);
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    trackedSections.forEach((section) => observer.observe(section));
  }

  // Recalcula la posición del indicador si cambia el tamaño de ventana
  window.addEventListener('resize', () => {
    const current = navLinks.find((l) => l.classList.contains('is-active'));
    moveIndicatorTo(current || navLinks[0]);
  });

  /* -------------------------------------------------------------------
     3. GRÁFICO DE ESTADÍSTICAS (Chart.js)
     Datos base: El Economista — obstáculos para comprar vivienda,
     jóvenes de 18 a 29 años en México.
     SUSTITUIR los valores del arreglo "data" si la cifra cambia.
  ------------------------------------------------------------------- */
  const chartCanvas = document.getElementById('housingChart');
  if (chartCanvas && window.Chart) {
    const ACCENT = '#4C1D95';
    const ACCENT_2 = '#9D174D';
    const MUTED = '#9CA3AF';

    new Chart(chartCanvas, {
      type: 'bar',
      data: {
        labels: [
          'Falta de ahorro',
          'Salarios insuficientes u\noportunidades laborales',
          'Otros factores'
        ],
        datasets: [{
          label: '% de jóvenes de 18 a 29 años',
          data: [41.2, 34.4, 24.4],
          backgroundColor: [ACCENT, ACCENT_2, MUTED],
          borderRadius: 4,
          maxBarThickness: 64
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.formattedValue}% de los jóvenes encuestados`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 50,
            ticks: { callback: (v) => `${v}%`, font: { family: 'Inter' } },
            grid: { color: '#E5E7EB' }
          },
          y: {
            ticks: { font: { family: 'Inter', size: 12 } },
            grid: { display: false }
          }
        }
      }
    });
  }

  /* -------------------------------------------------------------------
     4. LIGHTBOX DE LA GALERÍA (JS puro, sin dependencias)
  ------------------------------------------------------------------- */
  const galleryItems = Array.from(document.querySelectorAll('.gallery-item__trigger'));
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  let currentIndex = 0;
  let lastFocusedElement = null;

  // Construye la lista de fotos a partir de los atributos data-* del HTML
  const photos = galleryItems.map((button) => {
    const img = button.querySelector('img');
    return {
      full: img.dataset.full || img.src,
      caption: img.dataset.caption || img.alt || ''
    };
  });

  function renderLightbox(index) {
    const photo = photos[index];
    if (!photo) return;
    lightboxImg.src = photo.full;
    lightboxImg.alt = photo.caption;
    lightboxCaption.textContent = photo.caption;
  }

  function openLightbox(index) {
    currentIndex = index;
    lastFocusedElement = document.activeElement;
    renderLightbox(currentIndex);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % photos.length;
    renderLightbox(currentIndex);
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + photos.length) % photos.length;
    renderLightbox(currentIndex);
  }

  galleryItems.forEach((button, index) => {
    button.addEventListener('click', () => openLightbox(index));
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxNext) lightboxNext.addEventListener('click', showNext);
  if (lightboxPrev) lightboxPrev.addEventListener('click', showPrev);

  // Cierra al hacer clic en el fondo oscuro (fuera de la fotografía)
  if (lightbox) {
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) closeLightbox();
    });
  }

  // Navegación por teclado: Esc para cerrar, flechas para avanzar/retroceder
  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowRight') showNext();
    if (event.key === 'ArrowLeft') showPrev();
  });

});
