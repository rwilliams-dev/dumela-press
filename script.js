// Flag that JS is running (scroll-reveal hidden states key off this)
document.documentElement.classList.add("js-enabled");

// Contact form submission (index page only)
const contactForm = document.getElementById("contactForm");
if (contactForm) {
    contactForm.addEventListener("submit", function(e) {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const subject = document.getElementById("subject").value.trim();
        const message = document.getElementById("message").value.trim();
        const statusElement = document.getElementById("form-status");
        const submitBtn = document.getElementById("submit-btn");

        if (!name || !email || !subject || !message) {
            statusElement.textContent = "Please fill in all fields.";
            statusElement.className = "error";
            return;
        }

        submitBtn.disabled = true;
        statusElement.textContent = "Sending...";
        statusElement.className = "";

        emailjs.send("service_9cd9884", "template_252kzzv", {
            from_name: name,
            from_email: email,
            subject: subject,
            message: message
        })
        .then(response => {
            statusElement.textContent = "Message sent successfully! I'll get back to you soon.";
            statusElement.className = "success";
            contactForm.reset();
        })
        .catch(error => {
            console.error("Email send failed:", error);
            statusElement.textContent = "Failed to send message. Please try again.";
            statusElement.className = "error";
        })
        .finally(() => {
            submitBtn.disabled = false;
        });
    });
}

// Mobile nav toggle
function toggleNav() {
    document.querySelector('.nav-links').classList.toggle('open');
}

// Close mobile nav when a link is chosen
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelector('.nav-links').classList.remove('open');
    });
});

// Navbar: compact glass state on scroll
const navbar = document.querySelector('.navbar');
if (navbar) {
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

// Reading progress bar — article pages only
const articleEl = document.querySelector('.article');
if (articleEl && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const bar = document.createElement('div');
    bar.className = 'read-progress';
    document.body.appendChild(bar);

    const updateProgress = () => {
        const rect = articleEl.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const scrolled = -rect.top;
        const pct = total > 0 ? Math.min(Math.max(scrolled / total, 0), 1) : 0;
        bar.style.transform = 'scaleX(' + pct + ')';
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
    updateProgress();
}

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => observer.observe(el));
} else {
    revealEls.forEach(el => el.classList.add('visible'));
}
