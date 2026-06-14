document.addEventListener("DOMContentLoaded", () => {
    // Initialize the Intersection Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            // If the element enters the viewport, add the visible class
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Optional: Stop observing once revealed so it doesn't repeat on scroll up
                observer.unobserve(entry.target);
            }
        });
    }, { 
        threshold: 0.15 // Triggers when 15% of the element is visible
    });

    // Target all elements with the reveal class
    const hiddenElements = document.querySelectorAll('.u01-reveal');
    hiddenElements.forEach((el) => observer.observe(el));
});
// --- Mobile Menu Toggle Logic ---
    const menuTrigger = document.getElementById('menu-trigger');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    const mobileHint = document.getElementById('mobile-hint');

    menuTrigger.addEventListener('click', (e) => {
        // Only hijack the logo click if we are on a mobile-sized screen
        if (window.innerWidth <= 768) {
            e.preventDefault(); // Stops the page from jumping to the top
            mobileMenu.classList.toggle('is-active');
            
            // Fade out the "TAP FOR MENU" hint when the menu is open
            if(mobileMenu.classList.contains('is-active')) {
                mobileHint.style.opacity = '0';
            } else {
                mobileHint.style.opacity = '1';
            }
        }
    });

    // Automatically close the menu when a link is clicked
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('is-active');
            mobileHint.style.opacity = '1'; // Bring the hint back
        });
    });