document.addEventListener('DOMContentLoaded', function() {
  // Observador para as seções
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate__fadeInUp');
      }
    });
  }, {
    threshold: 0.1
  });

  // Observar todas as seções
  document.querySelectorAll('.section').forEach(section => {
    observer.observe(section);
  });

  // Efeito no navbar ao rolar
  window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
      header.style.padding = '5px 0';
      document.querySelector('.logo').style.height = '100px';
    } else {
      header.style.padding = '10px 0';
      document.querySelector('.logo').style.height = '150px';
    }
  });
});