# Job Application AI Assistant

## Project Overview

A web app that generates personalized job application content (cover letters, LinkedIn messages, emails) using AI and tracks outreach history with status management.

---

## Core Features

### 1. Cover Letter Generator
**Inputs:**
- Job description
- Resume (dropdown of saved resumes)
- Company description (optional)
- Length preference (concise, medium, long)
- LLM model selection (from user's API key)

**Output:**
- Personalized cover letter

**Save Options:**
- Auto-save setting (configurable in user settings - checkbox to enable/disable)
- Manual save with timestamp

---

### 2. LinkedIn Message Generator

**Two Modes:**
- **New Message:** First outreach to a contact
- **Follow-up Message:** One-time follow-up only (users can generate max 2 messages per recipient: 1 new + 1 follow-up)

**Inputs for New Message:**
- Job description (optional)
- Company description
- Resume (dropdown select)
- LinkedIn URL of recipient (auto-parse username from `linkedin.com/in/{username}` format, editable)
- Position title
- Company name
- Length preference (concise, medium, long)
- LLM model selection
- Status selection (sent, draft, done, ghost)

**Inputs for Follow-up Message:**
- Select previous contact from dropdown (auto-fills all data)
- Previous message (auto-loaded, read-only)
- All fields from new message (pre-filled, editable)
- Cannot generate if follow-up already exists for this contact

**Save to Database:**
- LinkedIn URL
- Recipient username (parsed from URL, editable)
- Position title
- Company name
- Message content
- Message type (new/follow-up)
- Timestamp
- Status:
  - **sent** (default for generated messages)
  - **draft** (user selects before generation)
  - **done** (completed interaction, no further action)
  - **ghost** (no response, lost cause)

---

### 3. Email Generator

**Same as LinkedIn Generator but:**
- Generates full email format (subject line + body)
- No 2-message limit per recipient
- Saves to separate database table with same metadata structure
- Status tracking: sent, draft, done, ghost

---

## Advanced Features

### Custom AI Prompts
- Each tab (cover letter, linkedin, email) has editable AI prompt container
- Default prompts displayed initially
- User can edit and **must save with a custom name** before use
- Saved prompts stored in user profile per tab
- **Tab-specific:** Prompts from one tab cannot be used in another
- Dropdown to select from saved prompts
- User must save prompt before generating content

### Resume Management
- Upload and store up to **3 resumes maximum**
- Dropdown to select resume for each generation
- Set default resume in user settings
- Resumes linked to user profile

### Length Control
- Available for all generation types (cover letter, LinkedIn, email)
- Options: **Concise, Medium, Long**
- Applied to AI prompt at generation time

### LLM Model Selection
- User provides OpenAI/Anthropic API key in settings
- System detects available models from API key
- Dropdown shows only accessible models
- User selects preferred model per generation
- Selection saved in user preferences

### API Key Management
- User provides own OpenAI/Anthropic Claude API key
- Encrypted storage in user profile
- Used for all AI generations (platform doesn't provide keys)
- Can update/change key in settings

---

## User Settings & Configuration

### Profile Settings:
- Custom AI prompts (named, per tab)
- API key management (encrypted storage)
- Default resume selection
- Auto-save preferences (cover letters)
- Default LLM model
- Default message length

### Data Management:
- View all saved resumes (max 3)
- Upload/delete resumes
- Export outreach history
- Manage custom prompts

---

## Status Management System

**Status Flow:**
1. **Draft** → User saves without sending
2. **Sent** → Default after generation (user sent the message)
3. **Done** → Completed interaction, archived
4. **Ghost** → No response, marked as lost cause

**Status Actions:**
- User can change status manually at any time
- Filter outreach history by status
- Bulk status updates
- Status affects follow-up availability (can't follow-up if status is "done" or "ghost")

---

## Data Tracking & History

### LinkedIn Outreach Table:
- Recipient details (username, name, position, company, LinkedIn URL)
- Message content (new/follow-up)
- Message type flag
- Status (sent/draft/done/ghost)
- Timestamps (created, updated)
- Associated resume used
- Job description (if provided)
- Company description (if provided)

### Email Outreach Table:
- Same structure as LinkedIn
- Additional: subject line field
- Email address instead of LinkedIn URL

### Cover Letter Archive:
- Only saved if auto-save enabled OR manually saved
- Company name, position
- Full letter content
- Associated resume
- Job description
- Timestamp

---

## Tech Stack

**Frontend:**
- Next.js 14+ with App Router
- TypeScript
- TailwindCSS
- React Hook Form (form handling)
- Zustand (global state management)

**Backend:**
- Next.js API routes
- Prisma ORM (database queries)
- Supabase (PostgreSQL database + authentication)
- bcrypt (API key encryption)
- OpenAI API / Anthropic Claude API / Gemini (user-provided keys)

**Authentication:**
- Supabase Auth (preferred)
- Fallback: Clerk or NextAuth.js if Supabase auth insufficient

**Deployment:**
- Vercel (hosting + serverless functions)

---

## Key Constraints & Rules

1. **LinkedIn Follow-up Limit:** Max 2 messages per recipient (1 new + 1 follow-up)
2. **Resume Limit:** Max 3 resumes per user
3. **Custom Prompts:** Must be saved with name before use, tab-specific
4. **API Keys:** User provides own keys (no platform-provided keys)
5. **Auto-save:** Configurable per user, applies only to cover letters
6. **Status:** Draft messages must be explicitly selected before generation
7. **Model Selection:** Only shows models available via user's API key

---

## User Workflows

### First-Time Setup:
1. Sign up / authenticate
2. Add OpenAI/Anthropic/Gemini API key (encrypted) - skippable, but cannot generate anything
3. Upload resume(s) (max 3)
4. Set default resume in settings
5. Optionally customize AI prompts
6. Select default LLM model

### Generate LinkedIn Message:
1. Select "LinkedIn" tab
2. Choose "New Message" or "Follow-up"
3. If follow-up: Select recipient from dropdown
4. Fill in recipient details (or auto-filled for follow-up)
5. Select resume, add job description (optional), company info
6. Choose length (concise/medium/long)
7. Select LLM model
8. Choose status (sent/draft)
9. Generate message
10. Copy to clipboard or edit before saving
11. Save to database with metadata

### Generate Cover Letter:
1. Select "Cover Letter" tab
2. Select resume from dropdown
3. Paste job description
4. Add company description (optional)
5. Choose length and LLM model
6. Generate cover letter
7. Auto-saved if enabled in settings, or manually save

### View Outreach History:
1. Navigate to "History" tab
2. Filter by:
   - Platform (LinkedIn/Email)
   - Status (sent/draft/done/ghost)
   - Date range
   - Company
3. Click on entry to view details
4. Update status or generate follow-up (if available)

---

## Future Enhancements (Not anytime Soon)

- **Notification Reminders:** Alert user to follow up after X days
- **Analytics Dashboard:** Response rates, best times to reach out
- **Chrome Extension:** Generate messages directly on LinkedIn/Gmail
- **Email Integration:** Send emails directly from platform
- **Interview Prep Generator:** Based on JD + company research
- **Company Research Automation:** Scrape recent news, company info
- **A/B Testing:** Test different message styles
- **Team Collaboration:** Share prompts/templates with team

---

## Success Metrics

- User can generate personalized content in < 2 minutes
- All outreach history tracked with status
- API keys securely encrypted
- Seamless resume management (upload/select)
- Custom prompts enable personalization
- Clear status tracking prevents duplicate outreach
- Follow-up limit prevents spam behavior

---

This project demonstrates:
- Full-stack development (Next.js + Prisma + Supabase)
- AI integration (OpenAI/Claude/Gemini APIs with user keys)
- Secure data handling (encryption, authentication)
- Complex state management (Zustand + React Hook Form)
- Real-world problem solving (job application workflow)
- Production-ready features (status tracking, history, settings)
