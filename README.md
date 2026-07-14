# 📦 YouTube API

A fully functional backend server built as part of the **Chai aur Backend Assignment** by [Hitesh Choudhary](https://github.com/hiteshchoudhary). This project implements backend features like user authentication, video upload, playlist management, tweet system, likes, subscriptions dashboard, and more — using **Node.js**, **Express.js**, and **MongoDB**.

---

## 📁 Folder Structure

```
backend/
├── public/               # Static files (e.g., uploaded videos)
│   └── temp/
├── src/
|   |-- config/           # configuration settings
│   ├── controllers/      # Route controller logic
│   ├── db/               # MongoDB connection config
│   ├── middlewares/      # Custom middlewares (auth, error, asyncHandler)
│   ├── models/           # Mongoose schemas
│   ├── routes/           # All route files (videos, tweets, likes, etc.)
│   ├── utils/            # Utility/helper functions
│   ├── app.js            # Express app config
│   ├── constants.js      # constants
│   └── index.js          # Server entry point
├── .env
├── .gitignore
|-- .prettierrc
|-- .nodemon.json
├── package.json
├── tsconfig.json
README.md
```

---

## 🚀 Features

- ✅ JWT-based authentication
- ✅ Video CRUD + owner info via aggregation
- ✅ Commenting system with pagination
- ✅ Tweet system (post, edit, delete)
- ✅ Likes system (for videos & comments)
- ✅ Subscriptions (toggle-based)
- ✅ Playlist management (create, update, delete, fetch)
- ✅ Channel dashboard stats (views, likes, videos, subs)
- ✅ All routes tested via **Postman**

---

## 🧰 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (Access Tokens)
- **Environment**: ES Modules (`type: "module"`)
- **Others**:  
  `mongoose-aggregate-paginate-v2`, `dotenv`, custom error handling, custom API response handling `multer`, and `cloudinary`

---

## 🔐 Environment Variables

Create a `.env` file in root:

```env
MONGODB_URI=mongodb uri connection string
PORT=any port number
NODE_ENV=development
CORS_ORIGIN=local or production origin
ACCESS_TOKEN_SECRET=generated access secret
ACCESS_TOKEN_EXPIRY=eg. 1d
REFRESH_TOKEN_SECRET=generated refresh secret
REFRESH_TOKEN_EXPIRY=eg. 10d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_CLOUD_API_KEY=
CLOUDINARY_CLOUD_SECRET=
```

---

## 🛠️ Installation & Running Locally

```bash
git clone https://github.com/MrRo-bot/YouTube_API.git
cd YouTube_API
npm install
npm run dev
```

---

## 📮 API Testing

All routes have been thoroughly tested using **Postman**. Each controller provides clear JSON responses and meaningful error messages.

---

## 📌 Author

**Chhavimani Choubey**  
GitHub: [MrRo-bot](https://github.com/MrRo-bot)

---

## 🙏 Acknowledgment

Thanks to **[Hitesh Chaudhary](https://github.com/hiteshchaudhary)** sir for guiding through this amazing backend development journey via **Chai aur Backend** series.

---
