document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            navButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button
            button.classList.add('active');

            // Show corresponding content
            const targetId = button.getAttribute('data-target');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                // Calculate dynamic unroll duration based on height
                targetContent.style.display = 'block'; // Temporarily display to measure
                let scrollHeight = targetContent.offsetHeight;
                targetContent.style.display = ''; // Reset
                
                // Base 0.5s + 1s per 600px of height, max 3.5 seconds
                let duration = Math.min(3.5, Math.max(1.0, 0.5 + (scrollHeight / 600)));
                targetContent.style.setProperty('--unroll-duration', `${duration}s`);
                
                targetContent.classList.add('active');
            }

            // Update background scene
            const bgScenes = document.querySelectorAll('.bg-scene');
            bgScenes.forEach(scene => scene.classList.remove('active'));
            const targetBg = document.getElementById('bg-' + targetId);
            if (targetBg) {
                targetBg.classList.add('active');
            } else {
                const defaultBg = document.getElementById('bg-default');
                if (defaultBg) defaultBg.classList.add('active');
            }
        });
    });

    // --- Mobile nav scroll arrows ---
    const nav = document.querySelector('.main-nav');
    const leftArrow = document.querySelector('.nav-arrow--left');
    const rightArrow = document.querySelector('.nav-arrow--right');

    if (nav && leftArrow && rightArrow) {
        function updateArrows() {
            const scrollLeft = nav.scrollLeft;
            const maxScroll = nav.scrollWidth - nav.clientWidth;

            if (maxScroll <= 0) {
                leftArrow.classList.add('hidden');
                rightArrow.classList.add('hidden');
                return;
            }

            leftArrow.classList.toggle('hidden', scrollLeft <= 2);
            rightArrow.classList.toggle('hidden', scrollLeft >= maxScroll - 2);
        }

        nav.addEventListener('scroll', updateArrows);
        window.addEventListener('resize', updateArrows);
        updateArrows();

        leftArrow.addEventListener('click', () => {
            nav.scrollBy({ left: -100, behavior: 'smooth' });
        });

        rightArrow.addEventListener('click', () => {
            nav.scrollBy({ left: 100, behavior: 'smooth' });
        });
    }



    // --- Dynamic Anthropic Blog Filter Generation ---
    const filterBar = document.querySelector('.anthropic-filter-bar');
    const blogCards = document.querySelectorAll('.anthropic-hero-card, .anthropic-grid-card');

    if (filterBar) {
        if (blogCards.length === 0) {
            filterBar.style.display = 'none';
        } else {
            // Friendly display names for standard slugs
            const categoryLabels = {
                'interpretability': 'LLMs & Interpretability',
                'neuromorphic': 'Neuromorphic AI',
                'reinforcement-learning': 'Reinforcement Learning',
                'benchmarks': 'Cognitive Science & AGI'
            };

            // Count occurrences of each category among currently active cards
            const categoryCounts = {};
            blogCards.forEach(card => {
                const rawCat = card.getAttribute('data-category') || 'general';
                categoryCounts[rawCat] = (categoryCounts[rawCat] || 0) + 1;
            });

            // Generate "All" button
            let html = `
                <button class="anthropic-filter-btn active" data-filter="all">
                    All <span class="anthropic-filter-count">(${blogCards.length})</span>
                </button>
            `;

            // Generate button for each detected category
            for (const [catKey, count] of Object.entries(categoryCounts)) {
                const label = categoryLabels[catKey] || (catKey.charAt(0).toUpperCase() + catKey.slice(1).replace(/-/g, ' '));
                html += `
                    <button class="anthropic-filter-btn" data-filter="${catKey}">
                        ${label} <span class="anthropic-filter-count">(${count})</span>
                    </button>
                `;
            }

            filterBar.innerHTML = html;

            // Wire up interactive filtering
            const filterBtns = filterBar.querySelectorAll('.anthropic-filter-btn');
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const filter = btn.getAttribute('data-filter');

                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    blogCards.forEach(card => {
                        const category = card.getAttribute('data-category');
                        if (filter === 'all' || category === filter) {
                            card.style.display = '';
                            card.style.opacity = '0';
                            card.style.transform = 'translateY(8px)';
                            requestAnimationFrame(() => {
                                card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
                                card.style.opacity = '1';
                                card.style.transform = 'translateY(0)';
                            });
                        } else {
                            card.style.display = 'none';
                        }
                    });
                });
            });
        }
    }

    // --- Hash routing for tabs ---
    if (window.location.hash) {
        let hash = window.location.hash.substring(1);
        const targetBtn = document.querySelector(`.nav-btn[data-target="${hash}"]`);
        if (targetBtn) {
            targetBtn.click();
            // Give it a tiny delay to let the layout settle, then scroll to top of the content
            setTimeout(() => {
                const nav = document.querySelector('.main-nav');
                if (nav) {
                    window.scrollTo({
                        top: nav.offsetTop - 20,
                        behavior: 'smooth'
                    });
                }
            }, 100);
        }
    }
});
