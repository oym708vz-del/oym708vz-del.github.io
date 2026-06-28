const year = document.querySelector("#year");
year.textContent = new Date().getFullYear();

const animatedElements = document.querySelectorAll(
  ".broadcast-panel, .section-heading, .series-card, .about-grid"
);

animatedElements.forEach((element) => element.classList.add("reveal"));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

animatedElements.forEach((element) => observer.observe(element));