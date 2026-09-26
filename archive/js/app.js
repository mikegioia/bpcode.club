/**
 * Store checkbox selections to localstorage.
 * When the page is reloaded, update the checkbox selections based
 * on what was saved to localstorage.
 */
let checks = JSON.parse(localStorage.getItem('checks')) || {};

// Restore values from storage if set
for (const id in checks) {
  document.getElementById(id).checked = checks[id];
}

// Event handler
document.querySelectorAll('input[type="checkbox"]').forEach(function (checkbox) {
	checkbox.addEventListener('change', saveCheckbox, false);
});

function saveCheckbox (event) {
  if (event.currentTarget.type === 'checkbox') {
    checks[event.currentTarget.id] = event.currentTarget.checked;
    saveLocalStorage();
  }
}

function saveLocalStorage () {
  localStorage.setItem('checks', JSON.stringify(checks));
}
