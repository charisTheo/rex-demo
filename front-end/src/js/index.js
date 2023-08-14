import '../css/global.css';
import '../css/theme.css';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/icon/icon';
import '@material/web/list/list';
import '@material/web/list/list-item';
import '@material/web/progress/circular-progress'

async function toggleSelected(e) {
  const el = e.target;
  const propertiesListEl = document.querySelector('#properties-list');

  if (el.getAttribute('selected')) {
    el.removeAttribute('selected');
    propertiesListEl.setAttribute('hidden', 'true')
  } else {
    // remove attribute from previously selected element if there is any
    const parentEl = el.parentElement;
    parentEl.querySelector(`${el.nodeName}[selected]`)?.removeAttribute('selected');

    el.setAttribute('selected', 'true');

    await new Promise(resolve => setTimeout(resolve, 0));
    // show all property list items for selected account
    const propertiesListItemsEl = propertiesListEl.querySelectorAll('md-list-item');
    propertiesListItemsEl.forEach(listItem => {
      if (listItem.dataset.account === el.dataset.account) {
        listItem.removeAttribute('hidden')
      } else {
        listItem.setAttribute('hidden', 'true')
      }
    });
    propertiesListEl.removeAttribute('hidden')
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const loginWithGoogleButton = document.querySelector('#login-with-google-button');
  loginWithGoogleButton.addEventListener('click', async () => {

    document
      .querySelector('body > .loading-indicator')
      .removeAttribute('hidden');

    const response = await fetch('/api/googleapis/oauth2Url');
    const { url } = await response.json();
    location.href = url
  });

  if (window.location.search.indexOf('auth=1') >= 0) {
    document.querySelector('#google-analytics-wrapper').removeAttribute('hidden')
    const response = await fetch('/api/googleapis/analytics/accounts');
    const {accounts} = await response.json();
    const accountsListEl = document.querySelector('#accounts-list');

    // render accounts list
    accountsListEl.innerHTML += `
      ${accounts.map(a => `
        <md-list-item data-account="${a.name}" headline="${a.displayName}" supportingText="${a.name}">
          <md-icon data-variant="icon" slot="end">chevron_right</md-icon>
        </md-list-item>
      `).join("")}
    `
    document
      .querySelector('#google-analytics-lists .loading-indicator')
      .remove();
    accountsListEl.removeAttribute('hidden');

    await new Promise(resolve => setTimeout(resolve, 0));
    const accountsListItemsEl = document.querySelectorAll('#accounts-list > md-list-item');
    accountsListItemsEl.forEach((li) => li.addEventListener('click', toggleSelected))

    // render properties list
    const propertiesListEl = document.querySelector('#properties-list');
    accounts.forEach(({properties, name: accountName}) => {
      propertiesListEl.innerHTML += `
        ${properties.map(p => `
          <md-list-item 
            hidden 
            data-account="${accountName}" 
            headline="${p.displayName}" 
            supportingText="${p.name}"
          >
            <md-icon data-variant="icon" slot="end">folder_open</md-icon>
          </md-list-item>
        `).join("")}
      `;
    })
  }
});
