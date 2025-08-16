
# LinkedIn Scraper Backend

This is the backend API for the LinkedIn Scraper Chrome Extension.  
It stores scraped LinkedIn profile data in a database using **Node.js**, **Express**, and **Sequelize**.

## Features

- Receives scraped LinkedIn profile data via a POST API.
- Stores profile information in a SQL database using Sequelize.
- Handles profile fields like:
  - Name
  - LinkedIn URL
  - About
  - Bio
  - Location
  - Follower Count
  - Connection Count
  - Bio Line

---

## Technologies

- Node.js
- Express.js
- Sequelize ORM
- SQLite / MySQL / PostgreSQL (configurable)
- Git & GitHub for version control

---

## Installation

1. Clone the repo:

```bash
git clone https://github.com/yojashri/Task_2.git
cd linkedin-scraper-backend
````

2. Install dependencies:

```bash
npm install
```

3. Configure the database in `config/config.json`.

4. Run migrations:

```bash
npx sequelize db:migrate
```

5. Start the server:

```bash
node app.js
```

Server runs on: `http://127.0.0.1:5000/`

---

## API

### POST `/profiles`

Receive scraped profile data from the Chrome extension:

**Request Body Example:**

```json
{
  "name": "John Doe",
  "url": "https://linkedin.com/in/johndoe",
  "about": "Tech enthusiast",
  "bio": "Software Engineer at XYZ",
  "location": "San Francisco",
  "followerCount": 1200,
  "connectionCount": 500,
  "bioLine": "Building scalable apps"
}
```

**Response:**

```json
{
  "id": 1,
  "name": "John Doe",
  "url": "https://linkedin.com/in/johndoe",
  ...
}
```
 
