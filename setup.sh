#!/bin/bash

# Therapy Session Processor Setup Script

echo "🏗️ Setting up Therapy Session Processor..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Build backend to check for issues
echo "🔨 Building backend..."
npm run build

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Build frontend to check for issues
echo "🔨 Building frontend..."
npm run build

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Set up your Supabase project at https://supabase.com"
echo "2. Run the SQL schema from supabase-schema.sql in your Supabase SQL editor"
echo "3. Copy .env.example to .env in both backend and frontend folders"
echo "4. Fill in your configuration values (Supabase URLs, OpenAI API key)"
echo "5. Start the applications:"
echo "   - Backend: cd backend && npm run start:dev"
echo "   - Frontend: cd frontend && npm run dev"
echo ""
echo "🌐 Access the application at http://localhost:3000"