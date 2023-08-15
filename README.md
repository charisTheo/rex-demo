# ReplayExperiences - Rex 🐕

## Run locally

1. Clone repository and navigate to it:

    ```
    git clone https://github.com/charisTheo/rex-demo.git && cd rex-demo
    ```

2. Initialise and install root dependencies:

    ```
    npm i && npm run init
    ```
    
3. Install front-end and server dependencies:

    ```
    cd front-end && npm i && cd ../server && npm i
    ```

4. Add secrets

    1. Create a `.env` file in ./server directory

        ```
        JWT_SECRET=<secret here>
        ```

    2. Add OAuth client secrets for your GCP project under `./server/controllers/oauth-client-secret.json`:

        ```
        {
          "web": {
            "client_id": "",
            "project_id": "",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": "",
            "redirect_uris": [
              "http://localhost:<PORT>/api/googleapis/oauth2Callback"
            ],
            "javascript_origins": [
              "http://localhost:<PORT>"
            ]
          }
        }
        ```

5. Run in dev mode, from the root directory of the project:

    ```
    npm run dev
    ```