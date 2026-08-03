# Sarhad NSS — National Service Scheme

<p align="center">
  <img src="logos/nss.jpg" alt="NSS Logo" width="80">
</p>

<p align="center">
  Official website of the National Service Scheme (NSS) unit at Sarhad College of Arts, Commerce and Science, Katraj, Pune.
</p>

--- 

## ✨ Features

### Frontend
- **Responsive Design** — Works on desktop, tablet, and mobile devices
- **Modern UI** — Glassmorphism effects, smooth animations, clean typography, theme toggle
- **25+ Pages** — Comprehensive coverage including public pages, admin panels, and volunteer dashboards
- **Shared Components** — Consistent navigation, footer, and styling across all pages
- **Interactive Elements** — Animated counters, scroll-triggered animations, mobile menu
- **SEO Ready** — Meta descriptions, Open Graph tags, and viewport settings
- **PWA Ready** — Manifest, service worker, and app icons for progressive web app support

### Backend & Database
- **Serverless Functions** — RESTful API endpoints for all functionality
- **Authentication** — Secure login system for volunteers and administrators
- **Database Integration** — Supabase-based data management
- **Real-time Features** — Notifications and live updates

### User Roles
- **Public Access** — Browse activities, events, gallery, resources, leaderboard
- **Volunteer Dashboard** — Personal profile, activity tracking, attendance management, certificate generation
- **Admin Dashboard** — User management, analytics, content administration

### Key Functionality
- **Attendance System** — Track volunteer participation with photo verification
- **Event Management** — Create, manage, and RSVP for events with capacity limits
- **Quiz System** — Interactive quizzes with scoring and leaderboards
- **Gallery** — Photo and video management with categorization
- **Resources** — Document and material sharing
- **Alumni Network** — Alumni stories and connections
- **Certificate Generation** — Automatic certificate creation for volunteers
- **Analytics** — Statistical insights and reporting

--- 

## 📁 Project Structure

```
NSS-Website/
├── Public Pages/
│   ├── index.html              # Home page
│   ├── aboutus.html            # About NSS
│   ├── activities.html         # Activities overview
│   ├── contactus.html          # Contact information
│   ├── register.html           # Registration information
│   ├── form.html               # Enrollment form
│   ├── events.html             # Events listing
│   ├── gallery.html            # Photo gallery
│   ├── resources.html          # Resources & materials
│   ├── leaderboard.html        # Volunteer leaderboard
│   ├── alumni.html             # Alumni information
│   ├── quiz.html               # Quiz interface
│   ├── 404.html                # Error page
│   ├── privacy-policy.html     # Privacy policy
│   └── terms.html              # Terms & conditions
│
├── Volunteer Portal/
│   ├── volunteer-login.html    # Volunteer login
│   ├── volunteer-signup.html   # Volunteer signup
│   ├── volunteer-dashboard.html # Volunteer dashboard
│   ├── volunteer-attendance.html # Attendance tracking
│   └── forgot-password.html    # Password recovery
│
├── Admin Portal/
│   ├── admin-login.html        # Admin login
│   ├── admin-dashboard.html    # Admin dashboard
│   └── admin-panel.html        # Admin management panel
│
├── Styles/
│   ├── shared.css              # Global styles
│   ├── index.css               # Home page styles
│   ├── aboutus.css             # About page styles
│   ├── activities.css          # Activities styles
│   ├── contactus.css           # Contact styles
│   ├── register.css            # Registration styles
│   ├── form.css                # Form styles
│   ├── events.css              # Events styles
│   ├── gallery.css             # Gallery styles
│   ├── resources.css           # Resources styles
│   ├── leaderboard.css         # Leaderboard styles
│   ├── alumni.css              # Alumni styles
│   ├── quiz.css                # Quiz styles
│   ├── 404.css                 # Error page styles
│   ├── volunteer-login.css     # Volunteer login styles
│   ├── volunteer-signup.css    # Volunteer signup styles
│   ├── volunteer-dashboard.css # Volunteer dashboard styles
│   ├── volunteer-attendance.css # Attendance styles
│   ├── admin-login.css         # Admin login styles
│   ├── admin-dashboard.css     # Admin dashboard styles
│   ├── admin-panel.css         # Admin panel styles
│   ├── forgot-password.css     # Password recovery styles
│   ├── reset-password.css      # Password reset styles
│   ├── privacy-policy.css      # Privacy policy styles
│   └── terms.css               # Terms styles
│
├── JavaScript/
│   ├── shared.js               # Global utilities
│   ├── register.js             # Form validation
│   └── service-worker.js       # PWA service worker
│
├── Backend/
│   └── functions/
│       ├── package.json        # Dependencies
│       ├── _utils.js           # Utility functions
│       └── api/
│           ├── config.js       # API configuration
│           ├── auth/
│           │   └── forgot-password.js
│           ├── volunteer/
│           │   ├── login.js
│           │   ├── logout.js
│           │   ├── signup.js
│           │   ├── me.js
│           │   ├── rsvp.js
│           │   ├── certificate.js
│           │   ├── activities.js
│           │   ├── attendance/
│           │   │   └── claim.js
│           │   └── notifications/
│           │       ├── list.js
│           │       └── mark-read.js
│           └── admin/
│               ├── login.js
│               ├── logout.js
│               ├── me.js
│               ├── dashboard.js
│               ├── analytics.js
│               ├── admins/
│               ├── alumni/
│               ├── resources/
│               ├── volunteers/
│               ├── activities/
│               ├── gallery/
│               ├── attendance/
│               └── backup/
│
├── Database/
│   └── sql/
│       ├── 02_resources_alumni.sql
│       ├── 03_events_capacity.sql
│       ├── 04_quiz_system.sql
│       ├── 05_events_cleanup.sql
│       ├── 06_seed_standard_activities.sql
│       └── 07_activities_hindi_name.sql
│
├── Assets/
│   ├── logos/                  # Logo images
│   │   ├── nss.jpg
│   │   ├── clg.jpg
│   │   └── sppu.jpg
│   ├── actvt.jpg               # Activity calendar
│   ├── favicon.svg             # Favicon
│   ├── icon-192.png            # PWA icon
│   ├── icon-512.png            # PWA icon
│   └── manifest.json           # PWA manifest
│
└── Configuration/
    ├── _headers               # Cloudflare headers
    ├── robots.txt             # Search engine rules
    └── sitemap.xml            # Site map
```

--- 

## 🛠️ Tech Stack

### Frontend
- **HTML5** — Semantic markup
- **CSS3** — Custom properties, Flexbox, Grid, media queries
- **JavaScript** — Vanilla JS with ES6+ features
- **Icons** — Font Awesome 6.6
- **PWA** — Manifest, service worker, and app icons

### Backend
- **Serverless Functions** — Cloudflare Workers / Pages Functions
- **Supabase** — Authentication and database
- **PDF-Lib** — Certificate generation
- **Node.js** — Runtime environment

### Database
- **PostgreSQL** — Relational database via Supabase
- **Realtime** — Real-time updates and notifications

### Development
- **Git** — Version control
- **GitHub** — Code repository
- **Cloudflare Pages** — Hosting platform


## 📸 Preview

### Public Pages
- Hero section with call-to-action
- Vision & Mission cards
- Stats counter (volunteers, activities, hours, lives impacted)
- Activity gallery with filtering
- Interactive events calendar
- Resource library
- Quiz system with leaderboard
- Alumni stories

### Volunteer Features
- Personal dashboard with activity tracking
- Attendance submission and verification
- RSVP for events
- Certificate download
- Notifications
- Profile management

### Admin Features
- User management (volunteers and admins)
- Activity and event management
- Attendance tracking
- Analytics and reporting
- Content management (gallery, resources, alumni)
- System backup and restore

--- 

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/forgot-password` — Password recovery
- `POST /api/volunteer/login` — Volunteer login
- `POST /api/volunteer/signup` — Volunteer signup
- `POST /api/volunteer/logout` — Volunteer logout
- `GET /api/volunteer/me` — Get volunteer profile
- `POST /api/admin/login` — Admin login
- `POST /api/admin/logout` — Admin logout
- `GET /api/admin/me` — Get admin profile

### Volunteer Actions
- `POST /api/volunteer/rsvp` — RSVP for events
- `GET /api/volunteer/activities` — Get volunteer activities
- `POST /api/volunteer/attendance/claim` — Claim attendance
- `GET /api/volunteer/certificate` — Get certificate
- `GET /api/volunteer/notifications/list` — List notifications
- `POST /api/volunteer/notifications/mark-read` — Mark notification as read

### Admin Actions
- `GET /api/admin/dashboard` — Admin dashboard data
- `GET /api/admin/analytics` — Analytics data
- `GET/POST /api/admin/volunteers/*` — Manage volunteers
- `GET/POST /api/admin/activities/*` — Manage activities
- `GET/POST /api/admin/events/*` — Manage events
- `GET/POST /api/admin/gallery/*` — Manage gallery
- `GET/POST /api/admin/resources/*` — Manage resources
- `GET/POST /api/admin/alumni/*` — Manage alumni
- `GET/POST /api/admin/attendance/*` — Manage attendance
- `GET/POST /api/admin/backup/*` — System backup

### Public Data
- `GET /api/public-stats` — Public statistics
- `GET /api/activities/*` — Activities data
- `GET /api/alumni/*` — Alumni data
- `GET /api/alumni-stories/*` — Alumni stories
- `GET /api/events/*` — Events data
- `GET /api/gallery/*` — Gallery data
- `GET /api/leaderboard/*` — Leaderboard data
- `GET /api/resources/*` — Resources data
- `GET /api/quiz/*` — Quiz data
- `GET /api/volunteers/*` — Volunteers data

--- 

## 📊 Database Schema

The project uses Supabase with PostgreSQL. Key tables include:
- `volunteers` — Volunteer profiles
- `admins` — Administrator accounts
- `activities` — NSS activities
- `events` — Events and workshops
- `attendance` — Attendance records
- `gallery` — Photos and media
- `resources` — Documents and materials
- `alumni` — Alumni information
- `alumni_stories` — Alumni testimonials
- `quiz_questions` — Quiz questions
- `quiz_responses` — Quiz responses
- `notifications` — User notifications

See the `sql/` directory for complete schema definitions and migrations.

--- 

## 🔧 Configuration

### Project Settings
- Update `functions/api/config.js` for API endpoints
- Configure CORS headers in `_headers` file
- Update `manifest.json` for PWA settings
- Update `robots.txt` for search engine indexing

### Branding
- Logos in `logos/` directory
- Favicon and app icons
- Color scheme in CSS variables
- Site metadata in HTML heads

--- 

## 📞 Contact

- **Address**: Sarhad College of Arts, Commerce & Science, Katraj, Pune-46
- **Email**: nssposarhad@gmail.com
- **Website**: https://nss-website-8uv.pages.dev

--- 

## 📜 License

This project is for educational purposes.

--- 

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- Use semantic HTML5
- Follow BEM methodology for CSS
- Use camelCase for JavaScript variables
- Keep functions small and focused
- Add comments for complex logic

--- 

## 📝 Changelog

### Recent Updates
- Added comprehensive admin dashboard with analytics
- Implemented volunteer attendance tracking with photo verification
- Added quiz system with leaderboard
- Enhanced event management with capacity limits
- Improved mobile responsiveness
- Added PWA support
- Integrated Supabase authentication
- Added real-time notifications

### Version History
- v2.0 — Complete rewrite with backend integration (July-August 2026)
- v1.0 — Initial static website (July 2026)

--- 

## 🚀 Deployment Notes

The project is currently deployed on Cloudflare Pages with:
- Frontend: Static site hosting
- Backend: Cloudflare Pages Functions
- Database: Supabase PostgreSQL
- Storage: Supabase Storage for media files

For deployment:
1. Set up Cloudflare Pages project
2. Configure environment variables
3. Deploy from GitHub repository
4. Set up Supabase project and configure connection strings

--- 

<p align="center">Made with ❤️ by <a href="https://github.com/abhishek-balsure">Abhishek Balsure</a></p>