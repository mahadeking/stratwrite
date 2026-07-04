export interface Template {
  id: string
  title: string
  icon: string
  blurb: string
  docTitle: string
  html: string
}

export const TEMPLATES: Template[] = [
  {
    id: 'email',
    title: 'Professional email',
    icon: '✉️',
    blurb: 'A clear, polite business email with subject and sign-off.',
    docTitle: 'Professional email',
    html:
      '<div>Subject: [Your subject line]</div><div><br></div>' +
      '<div>Hi [Name],</div><div><br></div>' +
      '<div>I hope this message finds you well. I’m reaching out about [reason for writing].</div><div><br></div>' +
      '<div>[Add the key details or your request here.]</div><div><br></div>' +
      '<div>Thank you for your time — please let me know if you have any questions.</div><div><br></div>' +
      '<div>Best regards,</div><div>[Your name]</div>',
  },
  {
    id: 'cover-letter',
    title: 'Cover letter',
    icon: '📝',
    blurb: 'A one-page cover letter that highlights your fit.',
    docTitle: 'Cover letter',
    html:
      '<div>[Your Name]</div><div>[Email] · [Phone]</div><div><br></div>' +
      '<div>Dear [Hiring Manager],</div><div><br></div>' +
      '<div>I am excited to apply for the [Position] role at [Company]. With [X years] of experience in [field], I am confident I can [the value you bring].</div><div><br></div>' +
      '<div>In my previous role at [Company], I [key achievement — include a number if you can].</div><div><br></div>' +
      '<div>I would welcome the chance to discuss how I can contribute to your team. Thank you for your consideration.</div><div><br></div>' +
      '<div>Sincerely,</div><div>[Your Name]</div>',
  },
  {
    id: 'blog',
    title: 'Blog post',
    icon: '🖊️',
    blurb: 'A structured post with headline, hook, and sections.',
    docTitle: 'Blog post',
    html:
      '<h1>[Your Catchy Headline]</h1>' +
      '<div>[Hook: open with a surprising fact, a question, or a short story.]</div>' +
      '<h2>Introduction</h2><div>[Set up the problem and why it matters to your reader.]</div>' +
      '<h2>Main point 1</h2><div>[Explain your first key idea with an example.]</div>' +
      '<h2>Main point 2</h2><div>[Explain your second key idea.]</div>' +
      '<h2>Conclusion</h2><div>[Summarize and end with a clear call to action.]</div>',
  },
  {
    id: 'essay',
    title: 'Essay / report',
    icon: '🎓',
    blurb: 'Academic structure with thesis, body, and references.',
    docTitle: 'Essay',
    html:
      '<h1>[Title]</h1>' +
      '<h2>Introduction</h2><div>[Background, context, and your thesis statement.]</div>' +
      '<h2>Body</h2><div>[Present your evidence and arguments in a logical order. One idea per paragraph.]</div>' +
      '<h2>Conclusion</h2><div>[Restate your thesis and summarize your key findings.]</div>' +
      '<h2>References</h2><div>[List your sources.]</div>',
  },
  {
    id: 'meeting-notes',
    title: 'Meeting notes',
    icon: '🗓️',
    blurb: 'Agenda, discussion, and action items.',
    docTitle: 'Meeting notes',
    html:
      '<h1>Meeting notes — [Date]</h1>' +
      '<div><b>Attendees:</b> [Names]</div><div><br></div>' +
      '<h2>Agenda</h2><ul><li>[Item 1]</li><li>[Item 2]</li></ul>' +
      '<h2>Discussion</h2><div>[Key points discussed.]</div>' +
      '<h2>Action items</h2><ul><li>[Task] — [Owner] — [Due date]</li></ul>',
  },
  {
    id: 'announcement',
    title: 'Announcement',
    icon: '📣',
    blurb: 'A friendly update or newsletter to your audience.',
    docTitle: 'Announcement',
    html:
      '<h1>[Announcement title]</h1>' +
      '<div>Hi everyone,</div><div><br></div>' +
      '<div>We’re excited to share that [your news].</div><div><br></div>' +
      '<h2>What’s new</h2><ul><li>[Highlight 1]</li><li>[Highlight 2]</li></ul>' +
      '<div>[Closing line and a clear call to action.]</div><div><br></div>' +
      '<div>— [Your team]</div>',
  },
  {
    id: 'blank',
    title: 'Blank document',
    icon: '📄',
    blurb: 'Start from scratch with an empty page.',
    docTitle: '',
    html: '',
  },
]
