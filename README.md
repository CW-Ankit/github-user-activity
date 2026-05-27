# 🚀 GitHub User Activity CLI (Professional)

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](https://nodejs.org/)

A high-performance, professional-grade Command Line Interface (CLI) designed to retrieve and visualize public activity streams from any GitHub user. This tool is engineered for speed, efficiency, and readability, utilizing concurrent network requests and a local caching layer to provide a seamless developer experience.

**Repository:** [https://github.com/CW-Ankit/github-user-activity.git](https://github.com/CW-Ankit/github-user-activity.git)

---

## 🌟 Key Features

### ⚡ High-Performance Architecture
- **Concurrent Data Fetching:** Instead of sequential requests, the tool utilizes `Promise.all()` to fetch user profiles and activity events simultaneously, reducing the total wait time by approximately 50%.
- **Intelligent Caching Layer:** Implements a 'Cache-Aside' pattern. API responses are persisted to the system's temporary directory with a configurable Time-To-Live (TTL), preventing redundant network calls and protecting against GitHub API rate limits.

### 🎨 Professional Visualization
- **Structured Table Layout:** Activity is presented in a strictly aligned columnar format, ensuring that repository names and event types remain visually consistent across the feed.
- **Semantic Color Coding:** Uses ANSI escape codes to categorize events (e.g., Green for Pushes, Magenta for Stars, Yellow for Issues), allowing users to scan activity at a glance.
- **Dynamic Filtering:** Ability to isolate specific event types (e.g., only viewing `PushEvent`) via command-line flags.

### 🛠 Developer Experience
- **Dual-Command Access:** Supports both the full command `github-activity` and the ultra-fast shorthand `gha`.
- **Graceful Error Handling:** Comprehensive try-catch blocks manage everything from 404 (User Not Found) to network timeouts and DNS failures.

---

## 🚀 Installation

### Prerequisites
- **Node.js:** Version 18.0.0 or higher.
- **npm:** Version 8.0.0 or higher.

### Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/CW-Ankit/github-user-activity.git
   cd github-user-activity
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Link the package globally:**
   This step registers the `github-activity` and `gha` commands in your system's binary path.
   ```bash
   npm link
   ```

---

## 📖 Usage Guide

### Basic Command
Fetch all public activity for a specific user:
```bash
gha <username>
# OR
github-activity <username>
```

### Filtering Activity
If you only want to see specific types of events (e.g., `PushEvent`, `WatchEvent`, `IssuesEvent`):
```bash
gha <username> --filter=PushEvent
```

### Help Manual
To view all available options and examples:
```bash
gha --help
```

### Example Output
```text
👤 USER PROFILE
----------------------------------------------------------------------
Name:     Gaearon
Bio:      Creator of Redux, React-Three-Fiber
Repos:    150
Followers: 25000
----------------------------------------------------------------------

⚡ Loaded from local cache

Recent Activity:
Date                 | Type         | Repository                | Detail
---------------------------------------------------------------------------
Oct 27, 10:00 am     | 🚀 PUSH       | reduxjs/redux             | 3 commit(s)
Oct 27, 11:30 am     | ⭐ STAR       | pmndrs/react-three-fiber  | Starred
Oct 27, 12:15 pm     | 🎫 ISSUE      | facebook/react            | Opened
```

---

## 🛠 Technical Deep Dive

### 🧠 Architectural Flow
1. **Argument Parsing:** The `cli.js` module extracts inputs from `process.argv`.
2. **Cache Validation:** `api.js` generates a unique key based on the endpoint and username. It checks the `os.tmpdir()` for a matching `.json` file.
3. **Network Execution:** Upon a cache miss, `node:https` is used to perform a GET request. A custom `User-Agent` is sent to comply with GitHub's API requirements.
4. **Data Normalization:** The `formatter.js` module maps raw JSON event types to human-readable labels and applies padding for terminal alignment.

### ⏱ Caching Logic
The cache uses a **Time-To-Live (TTL)** mechanism. By default, data is considered fresh for **10 minutes**. After this window, the tool automatically invalidates the local file and performs a fresh network fetch to ensure data accuracy.

---

## 🔗 Project Reference
This project was built as part of the [roadmap.sh GitHub User Activity project](https://roadmap.sh/projects/github-user-activity), implementing the requested functionality with professional architectural enhancements.

---

## 📜 License
This project is licensed under the **ISC License**. See the [LICENSE](LICENSE) file for details.
