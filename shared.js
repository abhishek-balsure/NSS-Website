/* ============================================
   SARHAD NSS — Shared JavaScript
   Navigation, animations, scroll effects
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ── Navbar scroll effect ──
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        const handleScroll = () => {
            if (window.scrollY > 30) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
    }

    // ── Hamburger Menu ──
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navOverlay = document.querySelector('.nav-overlay');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            if (navOverlay) navOverlay.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });

        if (navOverlay) {
            navOverlay.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                navOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }

        // Close mobile nav on link click
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                if (navOverlay) navOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // ── Scroll-triggered fade-in animations ──
    const fadeElements = document.querySelectorAll('.fade-in, .stagger-children');
    if (fadeElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        });

        fadeElements.forEach(el => observer.observe(el));
    }

    // ── Animated Counter ──
    const counters = document.querySelectorAll('.stat-number[data-count]');
    if (counters.length > 0) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.animated) {
                    entry.target.dataset.animated = 'true';
                    animateCounter(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => counterObserver.observe(counter));
    }

    function animateCounter(element) {
        const target = parseInt(element.dataset.count);
        const suffix = element.dataset.suffix || '';
        const duration = 2000;
        const start = performance.now();

        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(target * eased);
            element.textContent = current.toLocaleString() + suffix;
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        requestAnimationFrame(update);
    }

    // ── Active nav link highlight ──
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a:not(.nav-cta)').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === 'index.html' && href === 'index.html')) {
            link.classList.add('active');
        }
    });

    // ── Smooth scroll for anchor links ──
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ── Session-aware navbar (volunteer) ──
    // Public pages (index, activities, etc.) always render "Sign In / Join NSS"
    // in their HTML by default. This checks the actual session and swaps in
    // an account link / hides "Join NSS" if the visitor is already logged in.
    // Skipped automatically on pages without this nav pattern (dashboards,
    // login/signup pages, admin pages already handle their own nav).
    (async function checkVolunteerSession() {
        const nav = document.getElementById('navLinks');
        if (!nav) return;
        const signInLink = nav.querySelector('a[href="volunteer-login.html"]');
        const joinLink = nav.querySelector('a[href="form.html"].nav-cta');
        if (!signInLink && !joinLink) return; // not the public nav pattern

        try {
            const res = await fetch('/api/volunteer/me');
            if (!res.ok) return; // not logged in — leave nav as-is
            const { user } = await res.json();
            if (!user) return;

            if (signInLink) {
                const firstName = (user.name || 'Account').split(' ')[0];
                const accountLink = document.createElement('a');
                accountLink.href = 'volunteer-dashboard.html';
                accountLink.className = 'nav-account';
                accountLink.innerHTML = `<span class="account-emoji">👤</span> ${firstName}`;
                signInLink.replaceWith(accountLink);
            }
            if (joinLink) joinLink.remove(); // already a volunteer, hide registration CTA
        } catch (e) {
            // Not logged in or a network hiccup — leave the public nav untouched
        }
    })();
});
