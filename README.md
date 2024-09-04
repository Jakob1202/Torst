# Tørst
Web app to monitor and manage blood alcohol consumption (BAC) in a drinking session with multiple users.

![Alt text for the image](https://github.com/Jakob1202/Torst/tree/main/assets/screenshots/screenshot1)
![Alt text for the image](https://github.com/Jakob1202/Torst/tree/main/assets/screenshots/screenshot2)
![Alt text for the image](https://github.com/Jakob1202/Torst/tree/main/assets/screenshots/screenshot3)
![Alt text for the image](https://github.com/Jakob1202/Torst/tree/main/assets/screenshots/screenshot4)
![Alt text for the image](https://github.com/Jakob1202/Torst/tree/main/assets/screenshots/screenshot5)


To run the project:
First set ut a Firebase project with the following collections: users, drinks and sessions, and an email/password authentification provider. Copy the Firebase config into this file: [firebase.js](https://github.com/Jakob1202/Torst/tree/main/src/config/firebase.js). Then run:
```bash
npm install
npx expo start

