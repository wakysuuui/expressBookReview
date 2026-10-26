# Online Book Review — implementation package

## Status
Source implementation prepared. Password/concurrent-registration tests and JavaScript syntax checks can run without installing packages. Full API tests and cURL captures require npm dependencies and the original IBM dataset. No GitHub fork, live API outputs or submission URLs have been fabricated.

## Set up your real fork
1. Open https://github.com/ibm-developer-skills-network/expressBookReviews and click Fork.
   The public repository has a plural name; confirm it matches your course's starter link.
2. Clone YOUR fork:
   `git clone https://github.com/YOUR_USERNAME/expressBookReviews.git`
3. Copy this package's final_project directory into your clone, merging folders and replacing matching implementation files. KEEP the starter's original router/booksdb.js and its book data unchanged. This package intentionally does not contain a replacement dataset.
4. In your fork's final_project directory:
   `npm install`
   `npm test`
   `npm start`
5. In a second terminal, in final_project:
   `npm run evidence -- YOUR_USERNAME/expressBookReviews`
   Requires cURL on PATH. The script captures actual responses and fails on HTTP errors.
6. Review the generated submission files, then commit and push:
   `git add .`
   `git commit -m "Implement book reviews API and assignment evidence"`
   `git push`
7. Submit the files in final_project/submission and the URL in generaljs-url.txt.
   Check that general.js is visible at that URL after pushing.

## Deliverables
Tasks 1–9: getallbooks.txt, getbooksbyISBN.txt, getbooksbyauthor.txt,
getbooksbytitle.txt, getbookreview.txt, register.txt, login.txt,
reviewadded.txt, deletereview.txt.
Additional reviewmodified.txt demonstrates modification.
Task 10: router/general.js exports four async Axios methods; generaljs-url.txt gives its GitHub URL.
Task 11: githubrepo.txt contains a real GitHub API cURL response. The script verifies fork=true and the IBM parent.

## API
GET / — all books
GET /isbn/:isbn — a book
GET /author/:author — case-insensitive partial author search
GET /title/:title — case-insensitive partial title search
GET /review/:isbn — reviews
POST /register — username and password
POST /customer/login — username and password; stores signed JWT in server session
PUT /customer/auth/review/:isbn — review in JSON, form or query; create/update own review
DELETE /customer/auth/review/:isbn — delete own review
POST /customer/logout — destroy session

Use a cookie jar with cURL (-c on login, -b on protected requests).
Usernames: 3–40 letters/digits/underscores/hyphens; passwords: 8–128 characters.
Unknown ISBN: 404; no login: 401; duplicate user: 409; invalid input: 400.
One review per username per book. The authenticated identity is always used for ownership.

## Design and limits
For compatibility, reviews are strings as in the starter dataset. Numeric star ratings are not part of the listed grading tasks.
Users, sessions, and review changes live in memory and reset on restart.
Concurrent HTTP requests and password hashing are asynchronous; the four Axios methods can run with Promise.all.
Small in-memory review mutations are synchronous and atomic within one Node process.
This is a course project, not a multi-server persistent production deployment.
Optional PORT, SESSION_SECRET and JWT_SECRET environment variables configure the server.
It binds to localhost for testing. Production deployment needs persistent storage and HTTPS cookie configuration.

Documentation: https://expressjs.com/en/guide/routing/ and https://axios-http.com/docs/example
