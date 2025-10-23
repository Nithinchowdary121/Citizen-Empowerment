# Citizen Voice Platform

A modern web application for citizen feedback, surveys, and community engagement.

## Features

- User authentication (citizen and admin roles)
- Feedback submission with form validation
- Survey participation and results visualization
- Interactive dashboard with data visualization
- Responsive design for all devices

## Tech Stack

- **Frontend**: AngularJS, HTML5, CSS3, Bootstrap
- **Backend**: Node.js, Express.js
- **Database**: MongoDB

## Deployment

This application is configured for deployment on Render.

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Git

### Local Development Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/citizen-voice.git
   cd citizen-voice
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

3. Start the backend server:
   ```
   node server.js
   ```

4. In a new terminal, serve the frontend:
   ```
   cd frontend
   npx http-server -p 8080
   ```

5. Access the application at `http://localhost:8080`

### Free Deployment on Render

1. Push your code to GitHub
2. Sign up for a free Render account at [render.com](https://render.com)
3. From your Render dashboard, click "New" and select "Blueprint"
4. Connect your GitHub repository
5. Render will automatically detect the `render.yaml` configuration
6. For the database, you can use:
   - MongoDB Atlas free tier (recommended)
   - Or any other free MongoDB hosting service
7. Add your MongoDB connection string as an environment variable named `MONGO_URI`
8. Your app will be deployed on the free tier with no credit card required

## Environment Variables

- `PORT`: Server port (default: 4001)
- `MONGO_URI`: MongoDB connection string
- `NODE_ENV`: Environment (development/production)

## Project Structure

- `/backend`: Server-side code and API endpoints
- `/frontend`: Client-side application
  - `/views`: HTML templates
  - `app.js`: Angular application and controllers
  - `styles.css`: Global styles

## License

MIT


