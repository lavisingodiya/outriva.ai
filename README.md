# AI Job Master

A comprehensive web application that generates personalized job application content (cover letters, LinkedIn messages, emails) using AI and tracks outreach history with status management.

## Features

- **Cover Letter Generator**: Create tailored cover letters based on job descriptions and your resume
- **LinkedIn Message Generator**: Craft professional LinkedIn outreach messages (with follow-up tracking)
- **Email Generator**: Generate complete job application emails with subject lines
- **Outreach History**: Track all your applications with status management (sent/draft/done/ghost)
- **Custom AI Prompts**: Create and save custom prompts for each generation type
- **Resume Management**: Upload and manage up to 3 resumes
- **Multi-Provider AI**: Support for OpenAI, Anthropic Claude, and Google Gemini APIs

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS
- **UI Components**: shadcn/ui, Radix UI
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (via Supabase), Prisma ORM
- **Authentication**: Supabase Auth
- **AI Providers**: OpenAI, Anthropic, Google Gemini (user-provided API keys)
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod validation

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)
- API keys for AI providers (OpenAI, Anthropic, or Gemini)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd AI-Job-Master
npm install
```

### 2. Set Up Supabase

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned (this may take a few minutes)
3. Once ready, navigate to **Project Settings > API**
4. Copy the following values:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - `anon` `public` key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `service_role` `secret` key (`SUPABASE_SERVICE_ROLE_KEY`)
5. Navigate to **Project Settings > Database**
6. Copy the **Connection String** (use the **URI** format, not the **Transaction** format)
   - This will be your `DATABASE_URL`
   - Make sure to replace `[YOUR-PASSWORD]` with your actual database password

### 3. Configure Environment Variables

1. Open `.env.local` in your project root
2. Fill in the Supabase credentials you copied:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database (PostgreSQL connection string from Supabase)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres

# Encryption Key (generate a random 32-character string)
ENCRYPTION_KEY=your_32_character_random_string_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Generate a secure encryption key:**
```bash
# On macOS/Linux
openssl rand -base64 32

# Or use any 32-character random string
```

### 4. Set Up Authentication in Supabase

1. In your Supabase project, go to **Authentication > Providers**
2. Enable **Email** provider
3. Configure email templates if desired (optional)
4. Go to **Authentication > URL Configuration**
5. Add `http://localhost:3000/auth/callback` to **Redirect URLs**

### 5. Set Up Storage in Supabase

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket called `resumes`
3. Set the bucket to **Public** (or configure RLS policies as needed)

### 6. Run Database Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Or run migrations (recommended for production)
npx prisma migrate dev --name init
```

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
AI-Job-Master/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main app pages
│   ├── settings/          # User settings
│   └── globals.css        # Global styles
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utility libraries
│   ├── ai/               # AI provider integrations
│   ├── db/               # Database utilities
│   ├── supabase/         # Supabase client setup
│   └── validations/      # Zod schemas
├── prisma/
│   └── schema.prisma     # Database schema
├── types/                 # TypeScript type definitions
└── hooks/                 # Custom React hooks
```

## Usage

### First-Time Setup

1. **Sign Up**: Create an account at `/auth/signup`
2. **Add API Key**: Go to Settings and add your OpenAI/Anthropic/Gemini API key
3. **Upload Resume**: Upload at least one resume (max 3)
4. **Set Preferences**: Configure your default model, length preference, etc.

### Generate Content

1. **Cover Letter**:
   - Select resume, paste job description
   - Choose length and AI model
   - Generate and save

2. **LinkedIn Message**:
   - Choose "New Message" or "Follow-up"
   - Fill in recipient details
   - Generate and save with status

3. **Email**:
   - Similar to LinkedIn but generates subject + body
   - No message limit per recipient

### Track Applications

- View all sent messages in **History**
- Filter by platform, status, date, company
- Update status (sent → done/ghost)
- Generate follow-ups from history

## Key Features Explained

### Resume Limit
- Maximum of 3 resumes per user
- Set a default resume in settings

### LinkedIn Follow-up Limit
- Max 2 messages per recipient (1 new + 1 follow-up)
- Prevents spam behavior

### Custom Prompts
- Create custom AI prompts for each tab (Cover Letter, LinkedIn, Email)
- Must be saved with a name before use
- Tab-specific (prompts from one tab can't be used in another)

### Status Tracking
- **Draft**: Saved but not sent
- **Sent**: Default after generation
- **Done**: Completed interaction
- **Ghost**: No response received

### API Key Security
- API keys are encrypted using AES-256-CBC
- Stored securely in database
- Decrypted only when making AI requests

## Development

### Run Prisma Studio (Database GUI)
```bash
npx prisma studio
```

### Update Database Schema
```bash
# After modifying schema.prisma
npx prisma db push
# Or create a migration
npx prisma migrate dev --name your_migration_name
```

### Add New UI Components
```bash
npx shadcn@latest add [component-name]
```

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Update Supabase Redirect URLs

Add your production URL to Supabase:
- `https://your-domain.com/auth/callback`

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check if Supabase project is active
- Ensure password doesn't contain special characters that need URL encoding

### Authentication Not Working
- Check Supabase URL and keys in `.env.local`
- Verify redirect URLs are configured in Supabase
- Clear browser cookies and try again

### AI Generation Errors
- Verify API key is correctly entered and encrypted
- Check API key has sufficient credits/quota
- Try a different AI model

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
