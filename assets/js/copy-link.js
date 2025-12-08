// copy-link.js
document.querySelectorAll('.copy-link-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    const link = this.getAttribute('data-link') || window.location.href;

    navigator.clipboard.writeText(link).then(() => {
      const alertBox = document.createElement('div');
      alertBox.innerText = 'Link copied!';
      alertBox.style.position = 'fixed';
      alertBox.style.bottom = '20px';
      alertBox.style.right = '20px';
      alertBox.style.backgroundColor = '#1F1F1F';
      alertBox.style.color = '#fff';
      alertBox.style.padding = '10px 20px';
      alertBox.style.borderRadius = '8px';
      alertBox.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      alertBox.style.zIndex = '9999';
      document.body.appendChild(alertBox);

      setTimeout(() => {
        alertBox.remove();
      }, 2000);
    });
  });
});
