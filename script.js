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

    // --- Dark mode toggle ---
    const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');

    function switchTheme(e) {
        if (e.target.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    }

    if (toggleSwitch) {
        toggleSwitch.addEventListener('change', switchTheme, false);
        
        // Load saved theme
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme) {
            document.documentElement.setAttribute('data-theme', currentTheme);
            if (currentTheme === 'dark') {
                toggleSwitch.checked = true;
            }
        }
    }

    // --- Hash routing for tabs ---
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
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
