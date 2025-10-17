function toggleMenu() {
  const menu = document.querySelector(".menu");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
}

function toggleHighContrast() {
  document.body.classList.toggle('high-contrast');
}

