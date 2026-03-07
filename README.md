# 📋 Project Management System

A full-featured RESTful API for managing projects and tasks with real-time notifications, built with Node.js, Express, MongoDB, Redis, and Socket.io.

## 🌟 Features

- **User Authentication & Authorization**
    - JWT-based authentication
    - Role-based access control (Admin, Manager, Employee)
    - Secure password hashing with bcrypt
- **Project Management**
    - Create, read, update, and delete projects
    - Project status tracking (In Progress, Completed)
    - Manager-specific project ownership
    - Project statistics and analytics

- **Task Management**
    - Assign tasks to employees
    - Task status tracking (pending, in progress, completed)
    - Due date management
    - Task filtering and search

- **Real-time Features**
    - Socket.io integration for live updates
    - Authenticated WebSocket connections
    - Room-based notifications

- **Performance & Security**
    - Redis caching for improved performance
    - Rate limiting to prevent abuse
    - Helmet.js for security headers
    - MongoDB sanitization against injection attacks
    - CORS enabled
    - File upload support with Multer

- **Background Jobs**
    - BullMQ for email queue processing
    - Asynchronous email notifications

## 🛠️ Tech Stack

**Backend Framework:**

- Node.js
- Express.js (v5.2.1)

**Database:**

- MongoDB (with Mongoose ODM)
- Redis (for caching and sessions)

**Real-time Communication:**

- Socket.io (v4.8.3)

**Authentication:**

- JSON Web Tokens (JWT)
- bcrypt.js for password hashing

**Job Queue:**

- BullMQ (v5.70.1)
- IORedis (v5.9.3)

**Security & Utilities:**

- Helmet.js
- express-rate-limit
- express-mongo-sanitize
- CORS
- Morgan (logging)
- Multer (file uploads)

## 📁 Project Structure

```
Project-Management/
├── config/
│   ├── database.js           # MongoDB connection configuration
│   └── redisClient.js        # Redis client configuration
├── controllers/
│   ├── authController.js     # Authentication & authorization logic
│   ├── projectController.js  # Project CRUD operations
│   ├── taskController.js     # Task CRUD operations
│   └── userController.js     # User management
├── middlewares/
│   ├── cacheMiddleware.js    # Redis caching middleware
│   ├── errorMiddleware.js    # Global error handler
│   └── uploadMiddleware.js   # File upload middleware
├── models/
│   ├── projectModel.js       # Project schema
│   ├── taskModel.js          # Task schema
│   └── userModel.js          # User schema
├── queues/
│   └── emailQueue.js         # Email queue worker (BullMQ)
├── routes/
│   ├── authRoute.js          # Authentication routes
│   ├── projectRoute.js       # Project routes
│   ├── taskRoute.js          # Task routes
│   └── userRoute.js          # User routes
├── utils/
│   ├── apiError.js           # Custom error class
│   ├── apiFeatures.js        # Query features (filtering, sorting, etc.)
│   └── clearCache.js         # Cache invalidation utility
├── uploads/                   # File upload directory
├── config.env                 # Environment variables
├── docker-compose.yml         # Docker Compose configuration
├── Dockerfile                 # Docker image configuration
├── package.json
└── server.js                  # Application entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Redis (local or cloud instance)
- Docker (optional, for containerized deployment)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Mahmoud142/Project-Management.git
cd Project-Management
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `config.env` file in the root directory with the following variables:

```env
NODE_ENV=development
PORT=3000
DB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
BASE_URL=http://localhost:3000
REDIS_URL=your_redis_connection_string
```

4. **Run the application**

**Development mode with nodemon:**

```bash
npm run dev
```

**Production mode:**

```bash
node server.js
```

The server will start on `http://localhost:3000`

### 🐳 Docker Deployment

1. **Build and run with Docker Compose**

```bash
docker-compose up -d
```

This will:

- Build the Docker image
- Start the API server on port 3000
- Auto-restart on failure

2. **Stop the containers**

```bash
docker-compose down
```

## 📡 API Endpoints

### Authentication

| Method | Endpoint              | Description         | Access |
| ------ | --------------------- | ------------------- | ------ |
| POST   | `/api/v1/auth/signup` | Register a new user | Public |
| POST   | `/api/v1/auth/login`  | Login user          | Public |

### Users

| Method | Endpoint            | Description    | Access |
| ------ | ------------------- | -------------- | ------ |
| GET    | `/api/v1/users`     | Get all users  | Admin  |
| GET    | `/api/v1/users/:id` | Get user by ID | Admin  |
| PATCH  | `/api/v1/users/:id` | Update user    | Admin  |
| DELETE | `/api/v1/users/:id` | Delete user    | Admin  |

### Projects

| Method | Endpoint                 | Description            | Access        |
| ------ | ------------------------ | ---------------------- | ------------- |
| POST   | `/api/v1/projects`       | Create project         | Manager       |
| GET    | `/api/v1/projects`       | Get all projects       | Manager/Admin |
| GET    | `/api/v1/projects/:id`   | Get project by ID      | Manager/Admin |
| PATCH  | `/api/v1/projects/:id`   | Update project         | Manager       |
| DELETE | `/api/v1/projects/:id`   | Delete project         | Manager       |
| GET    | `/api/v1/projects/stats` | Get project statistics | Manager/Admin |

### Tasks

| Method | Endpoint            | Description    | Access           |
| ------ | ------------------- | -------------- | ---------------- |
| POST   | `/api/v1/tasks`     | Create task    | Manager          |
| GET    | `/api/v1/tasks`     | Get all tasks  | Authenticated    |
| GET    | `/api/v1/tasks/:id` | Get task by ID | Authenticated    |
| PATCH  | `/api/v1/tasks/:id` | Update task    | Employee/Manager |
| DELETE | `/api/v1/tasks/:id` | Delete task    | Manager          |

## 🔐 User Roles & Permissions

### Admin

- Full access to all endpoints
- User management
- View all projects and tasks

### Manager

- Create and manage own projects
- Create and assign tasks
- Update and delete own projects
- View project statistics

### Employee

- View assigned tasks
- Update task status
- View project details

## 🔌 Real-time Features (Socket.io)

### Connection

Connect to the WebSocket server with JWT authentication:

```javascript
const socket = io("http://localhost:3000", {
    auth: {
        token: "Bearer YOUR_JWT_TOKEN",
    },
});
```

### Events

**Join a user-specific room:**

```javascript
socket.emit("join-room", userId);
```

**Listen for updates:**

```javascript
socket.on("notification", (data) => {
    console.log("New notification:", data);
});
```

## 🗄️ Database Models

### User Model

- name, email, phone, password
- role (admin, manager, employee)
- profileImage
- passwordChangedAt

### Project Model

- manager (reference to User)
- title, description
- status (In Progress, Completed)
- timestamps

### Task Model

- project (reference to Project)
- employee (reference to User)
- title, description
- status (pending, in progress, completed)
- dueDate
- timestamps

## ⚡ Caching Strategy

The application uses Redis for caching frequently accessed data:

- Project lists
- Project statistics
- Automatic cache invalidation on updates

## 🔒 Security Features

- **Helmet.js**: Sets secure HTTP headers
- **Rate Limiting**: Prevents brute-force attacks
- **MongoDB Sanitization**: Prevents NoSQL injection
- **CORS**: Configured for cross-origin requests
- **JWT**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds

## 📧 Background Jobs

The application uses BullMQ for handling background jobs:

- Email notifications
- Asynchronous task processing
- Queue-based job management

## 🧪 Development

### Script Commands

```bash
# Run in development mode with auto-reload
npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Mahmoud**

- GitHub: [@Mahmoud142](https://github.com/Mahmoud142)

## 📞 Support

For support, please open an issue in the GitHub repository.

---

**Note**: Remember to update the `config.env` file with your actual credentials before running the application. Never commit sensitive information to version control.
