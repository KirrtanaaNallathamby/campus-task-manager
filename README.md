# Campus Task Manager

Campus Task Manager is an AI-powered academic planning tool designed for students to manage coursework, assignments, deadlines, and study focus in one place.

## Problem

Students often receive assignment briefs but struggle to break them down into clear tasks, estimate workload, and decide what to work on first when deadlines overlap.

## Solution

Campus Task Manager helps students:
- Add courses they are taking
- Paste assignment instructions
- Generate AI-powered action plans
- Estimate workload and difficulty
- Track deadlines in an academic calendar
- View upcoming deadline alerts
- See today's recommended focus tasks
- Generate emergency rescue plans when deadlines are near

## Key Features

- User authentication with Supabase Auth
- Course-based task organization
- AI assignment planner using Gemini API
- Deadline-based priority calculation
- Academic calendar view
- Today's Focus recommendations
- Due date alerts
- Task progress tracking
- Emergency rescue plan generation

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- Gemini API
- Vercel

## Product Thinking

The project follows the Campus Task Manager challenge brief, but extends it with AI-powered academic planning. Instead of only storing tasks, the system helps students understand what to do next, especially when they have multiple deadlines.

## Demo Account

Email: your-demo-email@example.com  
Password: your-demo-password

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key