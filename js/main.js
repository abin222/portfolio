/**
 * Abin Joseph — Portfolio Interactive Script
 * Features:
 * - High-contrast Light/Dark Mode Manager with localStorage persistence
 * - Dual-Track Focus Controller ("All", "Engineering & Systems", "Research & Academia")
 * - Publication BibTeX Modal with 1-click clipboard copy
 * - Email clipboard copy with interactive toast notification
 * - Project Category Filtering
 * - Experience Timeline Sub-Filter (All, Industry, Academic/Teaching, Education)
 * - Accessible Mobile Drawer & Scrollspy Navigation
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initFocusTrack();
  initBibtexModal();
  initClipboardActions();
  initProjectFilters();
  initTimelineFilters();
  initScrollspy();
  initMobileMenu();
});

/* ==========================================================================
   1. Theme Management (Light Mode Default with Toggleable Dark Mode)
   ========================================================================== */
function initTheme() {
  const themeToggleBtns = document.querySelectorAll('.theme-toggle');
  
  // Check preference: stored > system preference > default light
  const storedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (storedTheme === 'dark' || (!storedTheme && systemPrefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  updateThemeIcons();

  themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      updateThemeIcons();
      showToast(isDark ? 'Switched to Dark Mode' : 'Switched to Light Mode', 'info');
    });
  });

  // Listen for OS theme changes if user hasn't hardcoded a choice
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('theme')) {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      updateThemeIcons();
    }
  });
}

function updateThemeIcons() {
  const isDark = document.documentElement.classList.contains('dark');
  const sunIcons = document.querySelectorAll('.theme-icon-sun');
  const moonIcons = document.querySelectorAll('.theme-icon-moon');

  sunIcons.forEach(el => el.classList.toggle('hidden', !isDark));
  moonIcons.forEach(el => el.classList.toggle('hidden', isDark));
}

/* ==========================================================================
   2. Dual-Track UX Feature: Focus Mode Controller
   ========================================================================== */
function initFocusTrack() {
  const focusButtons = document.querySelectorAll('[data-focus-target]');
  const focusStatusBanner = document.getElementById('focus-status-banner');
  const focusStatusText = document.getElementById('focus-status-text');

  // Check URL query parameters (e.g., ?focus=engineering or ?focus=research)
  const urlParams = new URLSearchParams(window.location.search);
  const initialFocus = urlParams.get('focus') || 'all';

  setFocusTrack(initialFocus);

  focusButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetTrack = btn.getAttribute('data-focus-target');
      setFocusTrack(targetTrack);

      // Smooth scroll if clicked inside hero and user wants to see projects
      if (btn.classList.contains('hero-focus-btn')) {
        const targetSection = targetTrack === 'research' 
          ? document.getElementById('publications') 
          : document.getElementById('projects');
        if (targetSection) {
          targetSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  function setFocusTrack(track) {
    // Update button states
    focusButtons.forEach(btn => {
      const isMatch = btn.getAttribute('data-focus-target') === track;
      if (isMatch) {
        btn.classList.add('bg-indigo-600', 'text-white', 'shadow-sm', 'dark:bg-indigo-500');
        btn.classList.remove('text-zinc-600', 'text-zinc-400', 'hover:bg-zinc-100', 'dark:hover:bg-zinc-800');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-sm', 'dark:bg-indigo-500');
        btn.classList.add('text-zinc-600', 'dark:text-zinc-400', 'hover:bg-zinc-100', 'dark:hover:bg-zinc-800');
        btn.setAttribute('aria-pressed', 'false');
      }
    });

    // Update Banner notification
    if (focusStatusBanner && focusStatusText) {
      if (track === 'engineering') {
        focusStatusBanner.classList.remove('hidden');
        focusStatusText.innerHTML = `<strong>Engineering Focus Active:</strong> Highlighting production web systems, decentralized architecture, smart contracts, and cloud deployments.`;
      } else if (track === 'research') {
        focusStatusBanner.classList.remove('hidden');
        focusStatusText.innerHTML = `<strong>Research & Academic Focus Active:</strong> Highlighting IEEE publication, deep learning hyperparameter optimization, university teaching, and mentorship.`;
      } else {
        focusStatusBanner.classList.add('hidden');
      }
    }

    // Filter or highlight project cards and timeline cards
    const trackableElements = document.querySelectorAll('[data-track]');
    trackableElements.forEach(el => {
      const itemTracks = el.getAttribute('data-track').split(' ');
      if (track === 'all' || itemTracks.includes(track) || itemTracks.includes('both')) {
        el.classList.remove('focus-dimmed');
        el.classList.add('focus-highlighted');
      } else {
        el.classList.add('focus-dimmed');
        el.classList.remove('focus-highlighted');
      }
    });

    // Update URL query string without reloading
    const newUrl = new URL(window.location);
    if (track === 'all') {
      newUrl.searchParams.delete('focus');
    } else {
      newUrl.searchParams.set('focus', track);
    }
    window.history.replaceState({}, '', newUrl);
  }
}

/* ==========================================================================
   3. BibTeX Modal & One-Click Copy
   ========================================================================== */
const BIBTEX_CITATIONS = {
  'areis2024': `@inproceedings{joseph2024optimizing,
  author    = {Joseph, Abin and Dhanalakshmy, D. M.},
  title     = {Optimizing Head and Neck Tumor Segmentation Using Evolutionary Algorithms and Deep Learning},
  booktitle = {2024 International Conference on Advancement in Renewable Energy and Intelligent Systems (AREIS)},
  pages     = {1--5},
  year      = {2024},
  publisher = {IEEE},
  address   = {Thrissur, India},
  doi       = {10.1109/AREIS62559.2024.10893616}
}`
};

function initBibtexModal() {
  const modal = document.getElementById('bibtex-modal');
  const modalCode = document.getElementById('bibtex-code');
  const closeBtn = document.getElementById('bibtex-modal-close');
  const copyModalBtn = document.getElementById('bibtex-modal-copy');
  const openBtns = document.querySelectorAll('[data-bibtex-id]');

  if (!modal || !modalCode) return;

  let currentKey = 'areis2024';

  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-bibtex-id');
      currentKey = id;
      modalCode.textContent = BIBTEX_CITATIONS[id] || 'Citation not found.';
      openModal();
    });
  });

  function openModal() {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
    modal.focus();
  }

  function closeModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Close on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });

  if (copyModalBtn) {
    copyModalBtn.addEventListener('click', () => {
      const textToCopy = modalCode.textContent;
      navigator.clipboard.writeText(textToCopy).then(() => {
        copyModalBtn.innerHTML = `
          <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Copied!</span>
        `;
        showToast('BibTeX citation copied to clipboard!', 'success');
        setTimeout(() => {
          copyModalBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
            </svg>
            <span>Copy BibTeX</span>
          `;
        }, 2200);
      });
    });
  }
}

/* ==========================================================================
   4. Clipboard Utility & Toast System
   ========================================================================== */
function initClipboardActions() {
  const emailCopyBtns = document.querySelectorAll('[data-copy-email]');

  emailCopyBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const email = 'abin.joseph222@gmail.com';
      navigator.clipboard.writeText(email).then(() => {
        showToast('Copied email: abin.joseph222@gmail.com', 'success');
        
        // Visual indicator on button if applicable
        const originalText = btn.getAttribute('data-original-label');
        if (!originalText) {
          btn.setAttribute('data-original-label', btn.innerHTML);
        }
        btn.classList.add('text-emerald-600', 'dark:text-emerald-400');
        setTimeout(() => {
          btn.classList.remove('text-emerald-600', 'dark:text-emerald-400');
        }, 2000);
      }).catch(err => {
        showToast('Failed to copy. Please manually email abin.joseph222@gmail.com', 'error');
      });
    });
  });
}

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type === 'error' ? 'error' : 'success'}`;
  
  const iconSvg = type === 'error' 
    ? `<svg class="w-5 h-5 flex-shrink-0 text-red-300" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>`
    : `<svg class="w-5 h-5 flex-shrink-0 text-emerald-300" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>`;

  toast.innerHTML = `${iconSvg}<span>${message}</span>`;
  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3200);
}

/* ==========================================================================
   5. Interactive Project Filtering
   ========================================================================== */
function initProjectFilters() {
  const filterPills = document.querySelectorAll('.project-filter-pill');
  const projectCards = document.querySelectorAll('.project-card');

  if (!filterPills.length || !projectCards.length) return;

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const category = pill.getAttribute('data-filter');

      // Update pill UI
      filterPills.forEach(p => {
        p.classList.remove('bg-zinc-900', 'text-white', 'dark:bg-zinc-100', 'dark:text-zinc-900');
        p.classList.add('bg-zinc-100', 'text-zinc-600', 'dark:bg-zinc-800', 'dark:text-zinc-300');
      });
      pill.classList.remove('bg-zinc-100', 'text-zinc-600', 'dark:bg-zinc-800', 'dark:text-zinc-300');
      pill.classList.add('bg-zinc-900', 'text-white', 'dark:bg-zinc-100', 'dark:text-zinc-900');

      // Filter cards
      projectCards.forEach(card => {
        const cardCategories = (card.getAttribute('data-categories') || '').split(' ');
        if (category === 'all' || cardCategories.includes(category)) {
          card.classList.remove('hidden');
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(10px)';
          setTimeout(() => {
            card.classList.add('hidden');
          }, 250);
        }
      });
    });
  });
}

/* ==========================================================================
   6. Experience & Education Timeline Filtering
   ========================================================================== */
function initTimelineFilters() {
  const timelineTabs = document.querySelectorAll('.timeline-filter-tab');
  const timelineItems = document.querySelectorAll('.timeline-item');

  if (!timelineTabs.length || !timelineItems.length) return;

  timelineTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const category = tab.getAttribute('data-timeline-filter');

      timelineTabs.forEach(t => {
        t.classList.remove('border-indigo-600', 'text-indigo-600', 'dark:border-indigo-400', 'dark:text-indigo-400');
        t.classList.add('border-transparent', 'text-zinc-500', 'hover:text-zinc-800', 'dark:hover:text-zinc-200');
      });

      tab.classList.remove('border-transparent', 'text-zinc-500');
      tab.classList.add('border-indigo-600', 'text-indigo-600', 'dark:border-indigo-400', 'dark:text-indigo-400');

      timelineItems.forEach(item => {
        const itemType = item.getAttribute('data-timeline-type');
        if (category === 'all' || itemType === category) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });
    });
  });
}

/* ==========================================================================
   7. Scrollspy Active Section Navigation
   ========================================================================== */
function initScrollspy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!sections.length || !navLinks.length) return;

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const currentId = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${currentId}`) {
            link.classList.add('text-indigo-600', 'dark:text-indigo-400', 'font-semibold');
            link.classList.remove('text-zinc-600', 'dark:text-zinc-400');
          } else {
            link.classList.remove('text-indigo-600', 'dark:text-indigo-400', 'font-semibold');
            link.classList.add('text-zinc-600', 'dark:text-zinc-400');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));
}

/* ==========================================================================
   8. Mobile Navigation Drawer
   ========================================================================== */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  if (!menuBtn || !mobileMenu) return;

  menuBtn.addEventListener('click', () => {
    const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
    menuBtn.setAttribute('aria-expanded', !isExpanded);
    mobileMenu.classList.toggle('hidden');
  });

  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });
}
