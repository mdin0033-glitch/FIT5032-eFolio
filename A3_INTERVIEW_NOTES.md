# FIT5032 A3 interview notes

Production: https://fit5032-3db1a.web.app

Project: ClimateLearn Melbourne. Existing Week 7–10 functionality is retained. Coursework example records are clearly labelled; Firestore-backed does not mean an example is a real published resource or confirmed community event. No passwords or secret values belong in this document.

## D.1 External authentication

**What it does:** Firebase email/password registration, login, logout, password reset and signed administrator roles.

**Main files:** src/views/LoginView.vue; RegisterView.vue; src/firebase/auth.js; auth-errors.js; src/router/index.js

**Main functions:** signInWithEmailAndPassword; createUserWithEmailAndPassword; sendPasswordResetEmail; signOut; onIdTokenChanged; router.beforeEach

**Why implemented this way:** Firebase manages password storage and sessions; one shared auth state keeps route decisions consistent.

**Security / best practice:** Never store passwords. Admin roles come from signed custom claims, not LocalStorage. Server functions independently check claims. Reset messages avoid email enumeration.

**What to demonstrate:** Register a normal account; login/reload/logout; request reset; try /admin-dashboard as a normal user and then an approved admin.

**Likely tutor question:** Can editing LocalStorage make me an admin?

**Simple answer:** No. The router reads signed Firebase token claims, and the server checks admin independently.

**Possible small extension:** Add optional Google sign-in after configuring its provider and authorized domains.

## D.2 Email with attachment

**What it does:** An authenticated, email-verified user sends a validated attachment through a callable function and SendGrid.

**Main files:** src/views/EmailView.vue; functions/index.js; functions/email-validation.js; functions/test/email-validation.test.js

**Main functions:** selectFile; encodeFile; sendEmail; requestVerification; refreshAccount; sendEmailWithAttachment; validateEmailPayload

**Why implemented this way:** The browser collects inputs while the server validates again and holds the provider credential.

**Security / best practice:** SENDGRID_API_KEY is a Firebase Secret. FROM is a verified sender parameter. Allowlisted attachment formats, 2 MiB limit, base64 validation and server-only transactional quotas limit misuse. No credentials/provider payloads are logged.

**What to demonstrate:** Show input errors and loading; send a TXT; distinguish provider acceptance from actual receipt; open the received attachment. Production receipt and readable TXT were confirmed by the recipient.

**Likely tutor question:** Does accepted:true mean delivered?

**Simple answer:** No. SendGrid HTTP 202 accepts the request. Delivery must be verified using delivery events or the actual recipient inbox.

**Possible small extension:** Add a signed SendGrid event webhook to show delivery status.

## D.3 Interactive table data

**What it does:** Resources and events read Firestore and provide ten rows per page, sorting, global search, individual column search, empty/error/loading states.

**Main files:** src/views/ResourcesTableView.vue; EventsTableView.vue; src/components/InteractiveDataTable.vue; src/composables/useFirestoreTable.js; src/utils/table-data.js

**Main functions:** useFirestoreTable; filterRows; sortRows; reset; filtered; visibleRows

**Why implemented this way:** One reusable component gives both collections consistent behavior while view files define their columns.

**Security / best practice:** Render values with Vue text interpolation; do not use untrusted HTML. Public collections contain no credentials or user profiles. Clearly label coursework sample entries.

**What to demonstrate:** Show both live tables; sort; global search; filter category; page 10 then remaining rows; show empty result; narrow viewport.

**Likely tutor question:** Does sorting apply only to the visible page?

**Simple answer:** No. Filter and sort the full loaded dataset before slicing it into pages.

**Possible small extension:** Use server-side pagination for a much larger collection.

## D.4 Deployment to cloud

**What it does:** Firebase Hosting serves the production Vue application over HTTPS, including direct SPA URLs and public API rewrites.

**Main files:** firebase.json; .firebaserc; vite.config.js; package.json; .gitignore; .env.example

**Main functions:** npm run build; firebase deploy --only hosting --project fit5032-3db1a; Hosting rewrites

**Why implemented this way:** Vite produces dist; Hosting provides managed HTTPS. The final catch-all returns index.html for Vue Router history routes.

**Security / best practice:** Ignore local .env, Functions environment files, secrets and .firebase cache. VITE variables compile into public browser assets: Firebase web configuration is public by design; a VITE weather key is not a server secret. SendGrid remains server-only.

**What to demonstrate:** Open https://fit5032-3db1a.web.app; refresh /resources and /map directly; show /api/resources and /api/events; test an auth-protected page.

**Likely tutor question:** Why does /map refresh work without a server-side /map file?

**Simple answer:** Hosting serves index.html, then Vue Router renders the matching client route. API rewrites appear before the SPA fallback.

**Possible small extension:** Add a custom domain and a preview-channel deployment workflow.

## E.1 Cloud functions

**What it does:** HTTP book count and full book JSON; create-only uppercase trigger; secure email/statistics callables and two public REST endpoints.

**Main files:** functions/index.js; functions/email-validation.js; functions/public-data.js; src/views/GetBookCountView.vue; CountBookAPI.vue; GetAllBookAPI.vue

**Main functions:** countBooks; getAllBooks; capitaliseBook; sendEmailWithAttachment; getAdminStatistics; publicCollectionEndpoint

**Why implemented this way:** Admin SDK performs trusted server queries. Existing Week 9 endpoints and regions are retained. New endpoints separate public and privileged data.

**Security / best practice:** GET-only HTTP handlers, CORS, try/catch and generic errors. Creation-only trigger plus current-document transaction prevents update loops and avoids overwriting concurrent edits; updates only name, retaining isbn type and other fields.

**What to demonstrate:** Call count/all; add a lowercase book and observe uppercase in Firestore; show Functions ACTIVE; show a non-admin statistics call rejected.

**Likely tutor question:** Why does uppercasing not trigger infinitely?

**Simple answer:** It listens to document creation, not updates; the transaction also skips already-uppercase names.

**Possible small extension:** Add schema validation for future resource fields and automated emulator integration tests.

## E.2 Geo location

**What it does:** Leaflet community map supports location search, optional browser position, selecting start/destination, real OSRM driving routes, distance and estimated time.

**Main files:** src/views/CommunityMapView.vue; src/views/WeatherView.vue

**Main functions:** searchPlaces; selectPlace; showMarker; useCurrentLocation; planRoute; resetRoute; getCurrentLocationWeather

**Why implemented this way:** Leaflet separates rendering from geocoding and route APIs. Browser coordinates require explicit user permission.

**Security / best practice:** Validate coordinates, throttle search, show provider errors and attribution. Never bypass permission or substitute invented coordinates. Public OSRM/Nominatim services have usage constraints.

**What to demonstrate:** Search Monash University Clayton and Melbourne CBD; select endpoints; plan route; show geometry, kilometres and minutes; reset; resize.

**Likely tutor question:** Are distance and time straight-line calculations?

**Simple answer:** No. The displayed driving distance/time and geometry come from the actual OSRM route response.

**Possible small extension:** Move production traffic to a provider with a service agreement and configurable transport modes.

## E.3 Accessibility

**What it does:** Skip link, semantic landmarks, labels, visible focus, keyboard-accessible controls, live status/error feedback, chart data alternatives and accessibility guidance.

**Main files:** src/App.vue; src/style.css; src/views/AccessibilityView.vue; src/components/InteractiveDataTable.vue; FirestoreChart.vue; src/router/index.js

**Main functions:** skip link; aria-live/role=status; role=alert; aria-sort; chart legend toggle; navigationError

**Why implemented this way:** Semantic HTML and native controls provide keyboard behavior without custom interaction code. Automated axe checks complement manual keyboard testing.

**Security / best practice:** WCAG 2.1 A/AA automated checks are scoped to app content. Zero detected violations is not a complete accessibility certification; map and chart alternatives and human checks remain important.

**What to demonstrate:** Tab from the top; activate Skip to main content; see focus; operate search/sort/chart legend by keyboard; inspect accessible table alternatives; show 390 px layout.

**Likely tutor question:** Does passing axe guarantee full WCAG compliance?

**Simple answer:** No. Automated tools cannot evaluate all criteria; keyboard, content and assistive-technology review are also needed.

**Possible small extension:** Add a screen-reader user review and a non-map route itinerary.

## E.4 Export

**What it does:** Both tables export the complete filtered/sorted dataset to readable CSV and a formatted multipage PDF, with status and error feedback.

**Main files:** src/utils/table-export.js; table-data.js; src/components/InteractiveDataTable.vue

**Main functions:** downloadCsv; makeCsv; downloadPdf; exportData; cellText

**Why implemented this way:** Reuse the table dataset; freeze rows before async PDF loading; lazy-load jsPDF/autotable to reduce initial loading.

**Security / best practice:** CSV quoting and formula protection protect spreadsheet consumers. Use plain text; revoke Blob URLs. Exports contain public collection fields only.

**What to demonstrate:** Filter Water; download CSV and read it; download PDF and open it; verify matching records across pages rather than only the current page.

**Likely tutor question:** Are exported rows limited to ten?

**Simple answer:** No. Exports use all matching filtered rows across every page.

**Possible small extension:** Add user-selected columns and a date range.

## F.1 Innovation 1 — Admin Dashboard

**What it does:** A restricted dashboard shows live resource/event/user counts, recent records and two chart datasets.

**Main files:** src/views/AdminDashboardView.vue; src/views/AdminView.vue; src/router/index.js; functions/index.js; functions/public-data.js

**Main functions:** load; getAdminStatistics; adminStatistics; totals; formatDate

**Why implemented this way:** A secure callable aggregates trusted data; the browser gets only the fields required for the dashboard.

**Security / best practice:** Both router and server enforce admin claims. Auth listUsers remains server-only and returns only a count. Sample totals are explicitly labelled.

**What to demonstrate:** Normal user denied; approved persistent admin loads dashboard; refresh; compare counts with Firestore.

**Likely tutor question:** Why not list every user in the browser?

**Simple answer:** The dashboard needs only a count. Keeping profiles on the server limits unnecessary personal-data exposure.

**Possible small extension:** Add date-range trend summaries with a suitable aggregate collection.

## F.1 Innovation 2 — Interactive Charts

**What it does:** Two Firestore-derived doughnut charts show resource categories and event statuses with real tooltips, interactive legends and text tables.

**Main files:** src/components/FirestoreChart.vue; src/views/AdminDashboardView.vue; functions/public-data.js

**Main functions:** render; toggle; watch; resourcesByCategory; eventsByStatus

**Why implemented this way:** Shared Chart.js component updates from real statistics; accessible HTML legends and data tables supplement canvas visuals.

**Security / best practice:** No hardcoded statistics. Destroy old chart instances; respect reduced-motion settings; provide text alternatives and labelled buttons.

**What to demonstrate:** Hover a segment for actual count; hide/restore a category; compare fallback table totals; test phone width.

**Likely tutor question:** Where do chart numbers come from?

**Simple answer:** The admin function groups actual Firestore documents, and the component renders those returned counts.

**Possible small extension:** Add an optional bar view and date filtering.

## F.1 Innovation 3 — Provide API access to others

**What it does:** Two public read-only REST routes expose selected resource and event fields with filtering and cursor pagination.

**Main files:** functions/index.js; functions/public-data.js; functions/test/public-data.test.js; src/views/ApiDocsView.vue; firebase.json

**Main functions:** getPublicResources; getPublicEvents; publicCollectionEndpoint; parsePublicQuery; publicResource; publicEvent; tryEndpoint

**Why implemented this way:** One endpoint factory gives both routes consistent validation, CORS, HTTP status codes and pagination. Hosting offers /api/resources and /api/events.

**Security / best practice:** Allowlist response fields; never return user profiles or admin data. GET only; limit 1–100; validate query/cursor; cache 60 seconds; sample flag retained. Legacy getAllBooks is restricted in purpose to the public books collection and returns its complete documents.

**What to demonstrate:** Try both live GETs; limit=2 then nextCursor; exact category filter; invalid limit=400; unsupported method=405; inspect response fields.

**Likely tutor question:** Does count mean the total collection size?

**Simple answer:** On these REST routes it is the current response page size. Use nextCursor to request the next page. countBooks separately returns the books total.

**Possible small extension:** Add an OpenAPI specification and usage monitoring.

## F.1 Innovation 4 — Offline features

**What it does:** Online/offline detection, persisted favourites and table preferences, saved real data snapshots, stale-data notices and reconnect recovery.

**Main files:** src/composables/useOnlineStatus.js; useFirestoreTable.js; navigationFeedback.js; src/utils/browser-storage.js; src/components/FavouriteResources.vue; src/App.vue

**Main functions:** useOnlineStatus; readSaved; writeSaved; tablePreferences; snapshot helpers; navigationError

**Why implemented this way:** Small local persistence gives useful continuity while preserving the existing Vue application. Cached records originate from real online Firestore reads.

**Security / best practice:** No passwords/tokens/secrets in application LocalStorage. Cache public data only and display saved time. Handle storage failure. This is not a full PWA: an unvisited lazy route still needs network and a fresh offline application start is not guaranteed.

**What to demonstrate:** Save a favourite/filter and reload; preload tables online; go offline; refresh and inspect saved-data notice; reconnect and refresh/reload as appropriate.

**Likely tutor question:** Can every page open from scratch while offline?

**Simple answer:** No. Public-data caching works for loaded pages; no service worker caches the entire application. The UI reports unavailable offline routes and offers recovery after reconnect.

**Possible small extension:** Add a reviewed service worker for offline application-shell loading.

## Demonstration boundaries

- Email acceptance alone is not delivery evidence; production recipient receipt and readable TXT were confirmed. Spam placement is separate from successful delivery.
- Password-reset mail was received; the test did not change the account password.
- API and weather credentials are never printed. Browser VITE keys are visible to browser users; use a backend proxy if a key must remain confidential. Firebase Security Rules and server claims enforce data access rather than secrecy of Firebase Web configuration.
- Automated checks support, but do not guarantee, the rubric grade or complete WCAG conformance.
- Do not push or create the final-stage commit without owner approval.
