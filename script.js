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
                targetContent.classList.add('active');
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
});
