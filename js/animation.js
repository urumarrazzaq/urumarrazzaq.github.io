// Initialize WOW.js for scroll animations
new WOW().init();

// Custom animations when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Skill bars animation
    const skillBars = document.querySelectorAll('.progress-bar');
    skillBars.forEach(bar => {
        const width = bar.getAttribute('aria-valuenow') + '%';
        setTimeout(() => {
            bar.style.width = width;
        }, 500);
    });

    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Add floating animation to profile image
    const profileImg = document.querySelector('#home .img-fluid');
    if (profileImg) {
        profileImg.style.animation = 'float 6s ease-in-out infinite';
    }

    // Add parallax effect to sections
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        document.querySelectorAll('.container-xxl').forEach(section => {
            const speed = 0.5;
            section.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });

    // Add hover effects to service items
    document.querySelectorAll('.service-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add typing animation to roles
    const roles = document.querySelector('.typed-text-output');
    if (roles) {
        roles.style.opacity = '1';
        roles.style.animation = 'fadeIn 1s ease-in';
    }
});

// Add necessary CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
        100% { transform: translateY(0px); }
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .progress-bar {
        transition: width 1s ease-in-out !important;
    }

    .service-item {
        transition: transform 0.3s ease, box-shadow 0.3s ease !important;
    }

    .service-item:hover {
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    .wow {
        visibility: hidden;
    }

    .navbar .nav-item .nav-link:hover {
        transform: translateY(-2px);
        transition: transform 0.2s ease;
    }

    .btn:hover {
        transform: translateY(-2px);
        transition: transform 0.2s ease;
    }
`;
