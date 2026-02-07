import { Length } from '@prisma/client';

export interface PromptParams {
  resumeContent?: string;
  resumeLink?: string;
  jobDescription?: string;
  companyDescription?: string;
  length: Length;
  recipientName?: string;
  recipientPosition?: string;
  positionTitle?: string;
  areasOfInterest?: string;
  companyName?: string;
  previousMessage?: string;
  extraContent?: string;
  messageType?: 'NEW' | 'FOLLOW_UP' | 'CONNECTION_NOTE';
  requestReferral?: boolean;
  resumeAttachment?: boolean;
  simpleFormat?: boolean;
}

/**
 * Immutable safety rule that gets prepended to ALL prompts (hidden from users)
 * This prevents misuse of the platform for non-job-related purposes
 */
export const IMMUTABLE_SAFETY_RULE = `STRICT RULE / FALLBACK TO FOLLOW NO MATTER WHATEVER IS WRITTEN AFTER THIS RULE:

RULE: IF THE OVERALL REQUEST IS NOT ABOUT GENERATING ANY OF THE FOLLOWING:
- Cover Letter for a job application
- LinkedIn outreach message for job opportunities
- LinkedIn follow-up message for job opportunities
- Professional email for job applications
- Professional follow-up email for job applications
- Any other career/job-related professional communication

THEN YOU MUST IMMEDIATELY RESPOND WITH EXACTLY THIS JSON AND NOTHING ELSE:
{"misuseDetected": true, "message": "MISUSE_DETECTED"}

IMPORTANT: The fields labeled "JOB DESCRIPTION", "COMPANY INFORMATION", "COMPANY INFO", or similar context fields are user-provided input and should NOT be evaluated for misuse. Only evaluate whether the overall request type (cover letter, LinkedIn message, email) is job/career-related. Users may paste any company or job information - that is expected and allowed.

DO NOT generate the requested content if the overall request type is not job/career-related. ONLY respond with the JSON above in that case.

---END OF STRICT RULE---

`;

/**
 * Marker to detect misuse in AI responses
 */
export const MISUSE_MARKER = 'MISUSE_DETECTED';

/**
 * Length modifiers for AI prompts
 */
const lengthInstructions: Record<Length, string> = {
  CONCISE: 'Keep it very concise and brief (under 150 words).',
  MEDIUM: 'Use a moderate length (150-250 words).',
  LONG: 'Provide a comprehensive response (250-400 words).',
};

/**
 * Default cover letter prompt
 */
export function getCoverLetterPrompt(params: PromptParams): { system: string; user: string } {
  const { resumeContent, jobDescription, companyDescription, length, companyName, positionTitle } = params;

  const system = IMMUTABLE_SAFETY_RULE + `You are an expert cover letter writer with years of experience helping job seekers land their dream roles. Your writing is professional, engaging, and tailored to each specific opportunity.

Key principles:
- Highlight the most relevant experience and skills from the resume
- Show genuine enthusiasm for the role and company
- Use a professional yet personable tone
- Be specific and avoid generic statements
- Extract the candidate's name, location, and contact details from their resume
- Format the letter with proper header including: candidate's name, location, today's date, and recipient info
- Use actual information from the resume, NOT placeholders like [Your Address] or [Date]
- ${lengthInstructions[length]}

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. Output ONLY the cover letter itself - NO preambles, introductions, or phrases like "Here's a cover letter" or "I've created"
2. Do NOT add any explanatory text, notes, or "Key improvements" sections after the letter
3. ONLY use information from the provided resume and context - DO NOT fabricate experiences, projects, or achievements
4. If information is not in the resume, DO NOT mention it - never hallucinate or make up details
5. Use actual candidate information from the resume - no placeholders`;

  const user = `Please write a compelling cover letter for the following job opportunity:

${positionTitle && companyName ? `POSITION: ${positionTitle} at ${companyName}\n` : ''}
JOB DESCRIPTION:
${jobDescription || 'Not provided'}

${companyDescription ? `COMPANY INFORMATION:\n${companyDescription}\n` : ''}
MY RESUME:
${resumeContent || 'Not provided'}

IMPORTANT INSTRUCTIONS:
1. Extract my name, location (city, state), and contact info from the resume above
2. Use today's date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
3. Format the header as:
   [My Name from resume]
   [My City, State from resume]
   ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

4. Then write the letter body showcasing why I'm an excellent fit for this role.

Do NOT use placeholders like [Your Address] or [Date]. Extract actual information from my resume.`;

  return { system, user };
}

/**
 * Default LinkedIn message prompt
 */
export function getLinkedInPrompt(params: PromptParams): { system: string; user: string } {
  const {
    resumeContent,
    resumeLink,
    jobDescription,
    companyDescription,
    length,
    recipientName,
    recipientPosition,
    positionTitle,
    areasOfInterest,
    companyName,
    previousMessage,
    extraContent,
    messageType,
    requestReferral,
    resumeAttachment,
    simpleFormat,
  } = params;

  // Determine if this is a specific job application or general inquiry
  const isSpecificRole = !!positionTitle;

  // Dual-strategy system prompt
  const system = IMMUTABLE_SAFETY_RULE + (isSpecificRole
    ? `You are an expert at writing professional LinkedIn outreach messages. Your messages are confident, targeted, and effective at demonstrating fit for specific roles.

Key principles:
- Confident and targeted tone
- Emphasize direct fit for the specific role
- Be assertive about qualifications and achievements
- Reference specific details from the job description
- Show clear value proposition for this particular role
- Include a strong call to action
- Appropriate length for LinkedIn platform
${requestReferral ? '- Directly and tactfully ask the recipient to provide you with a referral for the specified role' : ''}
${resumeAttachment ? '- Include a statement mentioning that you are attaching your resume for their reference' : ''}
- ${lengthInstructions[length]}

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. Output ONLY the message itself - NO preambles, introductions, or phrases like "Here's a message" or "I've created"
2. Do NOT add any explanatory text, notes, or "Key improvements" sections after the message
3. ONLY use information from the provided resume and context - DO NOT fabricate experiences, projects, or achievements
4. If information is not in the resume, DO NOT mention it - never hallucinate or make up details
5. Start directly with the message greeting (e.g., "Hi [Name],")
6. End with just the closing and signature - nothing after that`
    : `You are an expert at writing professional LinkedIn outreach messages. Your messages are exploratory, relationship-building, and effective at opening doors to new opportunities.

Key principles:
- Exploratory and curious tone
- Balance showcasing background with genuine company interest
- Express interest in the company's mission, culture, or recent work
- Highlight relevant skills and experience without being pushy
- Ask about suitable open positions that match your profile
- Focus on finding mutual fit
- Not overly assertive or desperate
${requestReferral ? '- Directly and tactfully ask the recipient to provide you with a referral for opportunities that match your profile' : ''}
${resumeAttachment ? '- Include a statement mentioning that you are attaching your resume for their reference' : ''}
- ${lengthInstructions[length]}

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. Output ONLY the message itself - NO preambles, introductions, or phrases like "Here's a message" or "I've created"
2. Do NOT add any explanatory text, notes, or "Key improvements" sections after the message
3. ONLY use information from the provided resume and context - DO NOT fabricate experiences, projects, or achievements
4. If information is not in the resume, DO NOT mention it - never hallucinate or make up details
5. Start directly with the message greeting (e.g., "Hi [Name],")
6. End with just the closing and signature - nothing after that`);

  let user = '';

  // Handle CONNECTION_NOTE - a short connection request note
  if (messageType === 'CONNECTION_NOTE') {
    const connectionNoteSystem = IMMUTABLE_SAFETY_RULE + `You are an expert at writing professional LinkedIn connection request notes. These notes have a strict character limit of 280 characters (LinkedIn's limit), so they must be extremely concise yet professional.

Key principles:
- Keep it very brief - under 280 characters total (including greeting and closing)
- Professional and personable tone
- Be direct about your intent
- Mention the opportunity or company
- Briefly state your relevant experience
- Ask them to accept for more details

CRITICAL RULES:
1. Output ONLY the connection note message - NO preambles or explanations
2. Keep it STRICTLY under 280 characters total
3. Start directly with "Hi {name},"
4. Be concise but professional`;

    const connectionNoteUser = `Write a brief LinkedIn connection request note (under 280 characters) following this format:

Hi {Their name},

I'd like to connect to explore opportunities at {company name}. I'm a {role/position} with experience in {relevant skills from resume}. Please accept for more details.

CONTEXT:
- Recipient: ${recipientName || 'there'}
${companyName ? `- Company: ${companyName}` : ''}
${positionTitle ? `- Position interested in: ${positionTitle}` : ''}
${areasOfInterest ? `- Areas of interest: ${areasOfInterest}` : ''}

MY BACKGROUND:
${resumeContent || 'Not provided'}

Generate a similar concise note using the actual name, company, and my relevant experience/skills from the resume. Keep it STRICTLY under 280 characters total.`;

    return { system: connectionNoteSystem, user: connectionNoteUser };
  }

  if (messageType === 'FOLLOW_UP' && previousMessage) {
    // Simple format for follow-up
    if (simpleFormat) {
      user = `Write a simple follow-up LinkedIn message following this EXACT format:

Hi {name}

Following up on my previous message, Could you kindly let me know if my resume and skillset are good enough to be considered for {position}? I am happy to receive any answer.

CONTEXT:
- Recipient: ${recipientName || 'there'}
${positionTitle ? `- Position: ${positionTitle}` : '- Position: the role'}
- Company: ${companyName}

PREVIOUS MESSAGE:
${previousMessage}

MY BACKGROUND:
${resumeContent || 'Not provided'}

Generate the follow-up using the actual name and position. Keep it simple and concise, following the format above.`;
    } else {
      user = `Write a professional follow-up LinkedIn message.

PREVIOUS MESSAGE:
${previousMessage}

CONTEXT:
- Recipient: ${recipientName || 'Hiring Manager'}${recipientPosition ? ` (${recipientPosition})` : ''}
${positionTitle ? `- Position: ${positionTitle} at ${companyName}` : `- Company: ${companyName}`}
${companyDescription ? `- Company Info: ${companyDescription}` : ''}
${extraContent ? `\nADDITIONAL CONTEXT FOR THIS FOLLOW-UP:\n${extraContent}\n\nIMPORTANT: Use the additional context above to enhance this follow-up message. This context provides new information or angles to incorporate into the message.` : ''}

Write a polite follow-up that:
1. References the previous message
2. ${extraContent ? 'Incorporates the additional context provided above' : 'Adds value or new information'}
3. Gently prompts for a response
4. Maintains professional courtesy`;
    }
  } else if (isSpecificRole) {
    // Specific job title - confident/targeted approach
    if (simpleFormat) {
      // Simple format for NEW message with referral
      user = `Write a professional LinkedIn message following this EXACT format:

Hello {Name},

This is {My name}, working as {Current position} with around {mention years of experience} year of experience in the {Tech stack}. I am efficient in {Skills and achievements}. I am looking for {Positions to join for} and found job roles on {company name} careers page that matches my skillset. Hence, I would like to take this opportunity to speak to you a bit about the role and request a referral for the same, if you deem my profile fit.

Req Id / Job id / Job position name {mention job Id}

Job Link: {job link from careers page}

Coding profile / github - {Link}

Resume link: {resume link}

Please do let me know, if you'll be interested in referring me for this role.

CONTEXT:
- Recipient: ${recipientName || 'there'}
- Position: ${positionTitle} at ${companyName}
${jobDescription ? `- Job Description: ${jobDescription}` : ''}
${resumeLink ? `- Resume Link: ${resumeLink}` : ''}

MY BACKGROUND:
${resumeContent || 'Not provided'}

Generate the message using the actual name, position, company, and my skills/experience from the resume. Extract relevant years of experience, tech stack, skills, achievements from my resume. Keep the format similar to the template above.`;
    } else {
      user = `Please write a professional LinkedIn outreach message for the following opportunity:

RECIPIENT: ${recipientName || 'Hiring Manager'}${recipientPosition ? ` (${recipientPosition})` : ''}
POSITION: ${positionTitle} at ${companyName}

${jobDescription ? `JOB DESCRIPTION:\n${jobDescription}\n` : ''}
${companyDescription ? `COMPANY INFORMATION:\n${companyDescription}\n` : ''}
MY BACKGROUND:
${resumeContent || 'Not provided'}
${messageType === 'NEW' && resumeLink ? `\nPUBLIC RESUME LINK: ${resumeLink}` : ''}

Create a compelling message that demonstrates your strong fit for this specific role and encourages ${recipientName || 'them'} to respond and consider your application.${requestReferral ? `\n\nIMPORTANT: Directly ask the recipient to provide you with a referral for the ${positionTitle} position. Be tactful but clear that you are asking THEM specifically to refer you for this role at ${companyName}. For example, ask if they would be willing to refer you or submit your profile internally.` : ''}`;
    }
  } else {
    // General inquiry - exploratory/relationship-building approach
    if (simpleFormat) {
      // Simple format for general inquiry
      user = `Write a professional LinkedIn message following a simple format similar to this:

Hello {Name},

This is {My name}, working as {Current position} with around {mention years of experience} year of experience in the {Tech stack}. I am efficient in {Skills and achievements}. I am looking for opportunities at {company name} in areas such as {areas of interest} that match my skillset. I would like to take this opportunity to connect and discuss potential opportunities.

${resumeLink ? `Resume link: {resume link}` : ''}

Please let me know if there are any suitable positions at ${companyName}.

CONTEXT:
- Recipient: ${recipientName || 'there'}
- Company: ${companyName}
${areasOfInterest ? `- Areas of Interest: ${areasOfInterest}` : ''}
${resumeLink ? `- Resume Link: ${resumeLink}` : ''}

MY BACKGROUND:
${resumeContent || 'Not provided'}

Generate the message using the actual name, company, and my skills/experience from the resume. Keep the format simple and concise.`;
    } else {
      user = `Please write a professional LinkedIn outreach message for a general opportunity inquiry:

RECIPIENT: ${recipientName || 'Hiring Manager'}${recipientPosition ? ` (${recipientPosition})` : ''}
COMPANY: ${companyName}
${areasOfInterest ? `AREAS OF INTEREST: ${areasOfInterest}` : 'LOOKING FOR: Open to various opportunities that match my background'}

${companyDescription ? `COMPANY INFORMATION:\n${companyDescription}\n` : ''}
${jobDescription ? `RELEVANT CONTEXT:\n${jobDescription}\n` : ''}
MY BACKGROUND:
${resumeContent || 'Not provided'}
${messageType === 'NEW' && resumeLink ? `\nPUBLIC RESUME LINK: ${resumeLink}` : ''}

Create a compelling message that:
1. Expresses genuine interest in ${companyName} and their mission/culture/recent work
2. Highlights your relevant background and skills${areasOfInterest ? ` (especially in: ${areasOfInterest})` : ''}
3. Asks about suitable open positions that match your profile
4. Maintains an exploratory, relationship-building tone
5. Encourages ${recipientName || 'them'} to respond and discuss potential opportunities${requestReferral ? `\n6. IMPORTANT: Directly ask the recipient to provide you with a referral for opportunities that match your background. Be tactful but clear that you are asking THEM specifically to refer you for suitable roles at ${companyName}. For example, ask if they would be willing to refer you or help submit your profile internally for matching positions.` : ''}`;
    }
  }

  return { system, user };
}

/**
 * Default email prompt
 */
export function getEmailPrompt(params: PromptParams): { system: string; user: string } {
  const {
    resumeContent,
    jobDescription,
    companyDescription,
    length,
    recipientName,
    recipientPosition,
    positionTitle,
    areasOfInterest,
    companyName,
    previousMessage,
    extraContent,
    messageType,
    requestReferral,
    resumeAttachment,
  } = params;

  // Determine if this is a specific job application or general inquiry
  const isSpecificRole = !!positionTitle;

  // Dual-strategy system prompt
  const system = IMMUTABLE_SAFETY_RULE + (isSpecificRole
    ? `You are an expert at writing professional job application emails. Your emails are confident, targeted, and effective at securing interviews for specific roles.

Key principles:
- Compelling subject line that gets opened
- Confident and targeted tone
- Emphasize direct fit for the specific role
- Professional email format with proper greeting and closing
- Be assertive about qualifications and achievements
- Show clear value proposition for this particular role
- Include a strong call to action
- Proper email etiquette
${requestReferral ? '- Directly and tactfully ask the recipient to provide you with a referral for the specified role' : ''}
${resumeAttachment ? '- Include a statement mentioning that you are attaching your resume for their reference' : ''}
- ${lengthInstructions[length]}

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. Output ONLY in this exact format:
   Subject: [your subject line]

   [email body with greeting and closing]
2. Do NOT add any preambles, introductions, or phrases like "Here's an email" or "I've created"
3. Do NOT add any explanatory text, notes, or "Key improvements" sections after the email
4. ONLY use information from the provided resume and context - DO NOT fabricate experiences, projects, or achievements
5. If information is not in the resume, DO NOT mention it - never hallucinate or make up details`
    : `You are an expert at writing professional opportunity inquiry emails. Your emails are exploratory, relationship-building, and effective at opening doors to new opportunities.

Key principles:
- Compelling subject line that gets opened (focus on interest in company, not specific role)
- Exploratory and curious tone
- Balance showcasing background with genuine company interest
- Professional email format with proper greeting and closing
- Express interest in the company's mission, culture, or recent work
- Highlight relevant skills without being pushy
- Ask about suitable opportunities that match your profile
- Focus on finding mutual fit
- Proper email etiquette
${requestReferral ? '- Directly and tactfully ask the recipient to provide you with a referral for opportunities that match your profile' : ''}
${resumeAttachment ? '- Include a statement mentioning that you are attaching your resume for their reference' : ''}
- ${lengthInstructions[length]}

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. Output ONLY in this exact format:
   Subject: [your subject line]

   [email body with greeting and closing]
2. Do NOT add any preambles, introductions, or phrases like "Here's an email" or "I've created"
3. Do NOT add any explanatory text, notes, or "Key improvements" sections after the email
4. ONLY use information from the provided resume and context - DO NOT fabricate experiences, projects, or achievements
5. If information is not in the resume, DO NOT mention it - never hallucinate or make up details`);

  let user = '';

  if (messageType === 'FOLLOW_UP' && previousMessage) {
    user = `Please write a professional follow-up email.

PREVIOUS EMAIL:
${previousMessage}

CONTEXT:
- Recipient: ${recipientName || 'Hiring Manager'}${recipientPosition ? ` (${recipientPosition})` : ''}
${positionTitle ? `- Position: ${positionTitle} at ${companyName}` : `- Company: ${companyName}`}
${companyDescription ? `- Company Info: ${companyDescription}` : ''}
${extraContent ? `\nADDITIONAL CONTEXT FOR THIS FOLLOW-UP:\n${extraContent}\n\nIMPORTANT: Use the additional context above to enhance this follow-up email. This context provides new information or angles to incorporate into the email.` : ''}

Write a polite follow-up email that:
1. References the previous email
2. ${extraContent ? 'Incorporates the additional context provided above' : 'Adds value or expresses continued interest'}
3. Gently prompts for a response
4. Maintains professional courtesy`;
  } else if (isSpecificRole) {
    // Specific job title - confident/targeted approach
    user = `Please write a professional job application email for the following opportunity:

RECIPIENT: ${recipientName || 'Hiring Manager'}${recipientPosition ? ` (${recipientPosition})` : ''}
POSITION: ${positionTitle} at ${companyName}

${jobDescription ? `JOB DESCRIPTION:\n${jobDescription}\n` : ''}
${companyDescription ? `COMPANY INFORMATION:\n${companyDescription}\n` : ''}
MY BACKGROUND:
${resumeContent || 'Not provided'}

Create a compelling email (with subject line) that demonstrates your strong fit for this specific role and encourages ${recipientName || 'them'} to review your application and invite you for an interview.${requestReferral ? `\n\nIMPORTANT: Directly ask the recipient to provide you with a referral for the ${positionTitle} position. Be tactful but clear that you are asking THEM specifically to refer you for this role at ${companyName}. For example, ask if they would be willing to refer you or submit your profile through their internal referral system.` : ''}`;
  } else {
    // General inquiry - exploratory/relationship-building approach
    user = `Please write a professional opportunity inquiry email:

RECIPIENT: ${recipientName || 'Hiring Manager'}${recipientPosition ? ` (${recipientPosition})` : ''}
COMPANY: ${companyName}
${areasOfInterest ? `AREAS OF INTEREST: ${areasOfInterest}` : 'LOOKING FOR: Open to various opportunities that match my background'}

${companyDescription ? `COMPANY INFORMATION:\n${companyDescription}\n` : ''}
${jobDescription ? `RELEVANT CONTEXT:\n${jobDescription}\n` : ''}
MY BACKGROUND:
${resumeContent || 'Not provided'}

Create a compelling email (with subject line) that:
1. Expresses genuine interest in ${companyName} and their mission/culture/recent work
2. Highlights your relevant background and skills${areasOfInterest ? ` (especially in: ${areasOfInterest})` : ''}
3. Asks about suitable open positions that match your profile
4. Maintains an exploratory, relationship-building tone
5. Encourages ${recipientName || 'them'} to respond and discuss potential opportunities${requestReferral ? `\n6. IMPORTANT: Directly ask the recipient to provide you with a referral for opportunities that match your background. Be tactful but clear that you are asking THEM specifically to refer you for suitable roles at ${companyName}. For example, ask if they would be willing to refer you or help submit your profile through their internal referral system for matching positions.` : ''}`;
  }

  return { system, user };
}

/**
 * Builds a custom prompt by replacing variables
 */
export function buildCustomPrompt(template: string, params: PromptParams): string {
  let prompt = template;

  // Replace all variables
  const variables: Record<string, string> = {
    '{resumeContent}': params.resumeContent || 'Not provided',
    '{jobDescription}': params.jobDescription || 'Not provided',
    '{companyDescription}': params.companyDescription || 'Not provided',
    '{length}': params.length,
    '{lengthInstruction}': lengthInstructions[params.length],
    '{recipientName}': params.recipientName || 'Hiring Manager',
    '{positionTitle}': params.positionTitle || 'the position',
    '{areasOfInterest}': params.areasOfInterest || 'Not specified',
    '{companyName}': params.companyName || 'the company',
    '{previousMessage}': params.previousMessage || 'Not available',
    '{messageType}': params.messageType || 'NEW',
  };

  Object.entries(variables).forEach(([key, value]) => {
    prompt = prompt.replaceAll(key, value);
  });

  return prompt;
}
