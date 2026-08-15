# 🚀 Deployment Guide: CAMP-CON

This guide will take you from local development to a live URL that you can share with friends!

## 📋 Prerequisites
1.  **Git Installed** (You have Git Bash).
2.  **GitHub Account**.
3.  **MongoDB Atlas Account** (For cloud database).
4.  **Vercel Account** (For Frontend).
5.  **Render.com Account** (For Backend - free tier available).

---

## Step 1: Push to GitHub 🐙

1.  Open **Git Bash** (or your terminal) in the project folder:
    ```bash
    cd "c:\Users\karan\Desktop\projects\smart-campus-app"
    ```
2.  Initialize Git and commit your code:
    ```bash
    git init
    git add .
    git commit -m "Initial commit of Smart Campus App"
    ```
3.  **Go to GitHub.com**:
    *   Create a **New Repository** (e.g., `smart-campus`).
    *   **Do not** add README/gitignore (we already have them).
4.  Copy the commands showing "…or push an existing repository..." and paste them into Git Bash:
    ```bash
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/smart-campus.git
    git push -u origin main
    ```

---

## Step 2: Set up Cloud Database (MongoDB Atlas) 🍃

Since `localhost` won't work in the cloud, you need a cloud DB.

1.  Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Create a **Free Cluster (M0)**.
3.  **Database Access**: Create a user (e.g., `admin`) and password.
4.  **Network Access**: Allow Access from **Anywhere** (`0.0.0.0/0`).
5.  **Connect**: Click "Connect" > "Drivers" > Copy the connection string.
    *   It looks like: `mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`
    *   Replace `<password>` with your actual password.

---

## Step 3: Deploy Backend (Render.com) ⚙️

We will deploy the `social-graph-service` (and others) to Render because it handles Node.js servers well.

1.  Log in to **[Render.com](https://render.com)**.
2.  Click **New +** -> **Web Service**.
3.  Connect your **GitHub Repository**.
4.  **Configuration**:
    *   **Name**: `smart-campus-backend`
    *   **Root Directory**: `backend/social-graph-service`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node index.js`
    *   **Environment Variables** (Add these):
        *   `MONGO_URI`: (Paste your MongoDB Atlas string from Step 2)
        *   `PORT`: `3003` (or leave empty, Render assigns one, code must wrap it, but standard 10000 is fine)
5.  Click **Create Web Service**.
6.  **Copy the URL**: Once deployed, you will get a URL like `https://smart-campus-backend.onrender.com`.

*(Repeat this step for `auth-service` if you need that running too, adjusting the Root Directory).*

---

## Step 4: Deploy Frontend (Vercel) ▲

1.  Log in to **[Vercel.com](https://vercel.com)**.
2.  Click **Add New...** -> **Project**.
3.  Import your **GitHub Repository**.
4.  **Configure Project**:
    *   **Framework Preset**: Select **Next.js**.
    *   **Root Directory**: Click "Edit" and select `apps/web`.
    *   **Environment Variables**:
        *   To make the frontend talk to your *new* live backend (not localhost):
        *   Create variables in your frontend code (e.g., `NEXT_PUBLIC_API_URL`) and set them here to your Render Backend URL.
        *   *Note: If your code currently hardcodes `http://localhost:3003`, you will need to find/replace that with your Render URL before pushing, OR better yet, use an environment variable.*

5.  Click **Deploy**.

---

## 🔁 Vital Code Change Before Deployment

Your code currently points to `http://localhost:3003` and `3006`.

**Before deploying**, you should update your frontend to use Environment Variables so it works in production.

1.  **In `apps/web/next.config.js`** (or just use `process.env.NEXT_PUBLIC_API_URL` in code):
    *   Replace `http://localhost:3003` with `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'` in your `fetch` calls.
2.  **In Vercel**, set `NEXT_PUBLIC_API_URL` to your Render Backend URL (e.g., `https://smart-campus-backend.onrender.com`).

---

## 🏁 Done!
Share your Vercel URL with friends. They can sign up (if Auth service is live) or browse as guests!
