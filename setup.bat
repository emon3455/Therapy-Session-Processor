@echo off
REM Therapy Session Processor Setup Script for Windows

echo 🏗️ Setting up Therapy Session Processor...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

echo ✅ Node.js found
node --version

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install

REM Build backend to check for issues
echo 🔨 Building backend...
call npm run build

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd ..\frontend
call npm install

REM Build frontend to check for issues  
echo 🔨 Building frontend...
call npm run build

echo.
echo 🎉 Setup completed successfully!
echo.
echo Next steps:
echo 1. Set up your Supabase project at https://supabase.com
echo 2. Run the SQL schema from supabase-schema.sql in your Supabase SQL editor
echo 3. Copy .env.example to .env in both backend and frontend folders
echo 4. Fill in your configuration values (Supabase URLs, OpenAI API key)
echo 5. Start the applications:
echo    - Backend: cd backend ^&^& npm run start:dev
echo    - Frontend: cd frontend ^&^& npm run dev
echo.
echo 🌐 Access the application at http://localhost:3000