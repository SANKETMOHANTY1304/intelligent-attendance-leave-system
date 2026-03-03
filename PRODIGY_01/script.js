window.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.style.backgroundColor = '#87cefa';
    } else {
        navbar.style.backgroundColor = '#87cefa';
    }
});

const navLinks = document.querySelectorAll('nav ul li a');
navLinks.forEach(link => {
    link.addEventListener('mouseover', () => {
        link.style.color = '#0000ff';
    });
    link.addEventListener('mouseout', () => {
        link.style.color = '#fff';
    });
});
