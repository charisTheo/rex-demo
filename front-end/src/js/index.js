import '../css/global.css';
import '@material/web/button/filled-tonal-button.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginWithGoogleButton = document.querySelector('#login-with-google-button');
  loginWithGoogleButton.addEventListener('click', async () => {
    const response = await fetch('/api/googleapis/oauth2Url');
    const { url } = await response.json();
    window.open(url)
  })
});
