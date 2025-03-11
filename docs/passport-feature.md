# IntiMate Passport Feature

## Overview

The Intimacy Passport is a core feature of the IntiMate app that helps users:

1. Document their preferences, boundaries, and relationship needs
2. Track their progress in completing their profile
3. Compare compatibility with their partner (if connected)
4. Get personalized insights based on their answers

## Key Components

### Passport Page

The main passport page displays:

- **Basic user information**: Name, username, and partner status
- **Passport completion**: Visual progress indicator
- **Answer review**: Categorized view of all answered questions
- **Partner compatibility**: Compatibility scores and insights if connected to a partner

### Questionnaire Page

The questionnaire allows users to:

- Answer multiple-choice, scale, and open-ended questions
- Navigate between questions easily
- Track their progress
- Edit previous answers

## Setting Up the Database

The passport feature requires several tables in your Supabase database:

1. `passport_questions`: Stores the questions displayed to users
2. `passport_answers`: Stores user responses to questions
3. A `passport_completion` column in the `profiles` table

You can set up these tables by running the SQL in the `migrations/passport_tables.sql` file.

## Troubleshooting

If you encounter issues with the passport feature:

### Common Issues

1. **404 Errors**: Make sure the Supabase tables exist and are properly configured
2. **Error saving answers**: Check that the `passport_answers` table has the correct structure
3. **Blank questionnaire**: Ensure the `passport_questions` table has questions inserted

### Database Setup

To manually set up the passport tables in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the contents of `migrations/passport_tables.sql`

## Development

The passport feature consists of:

- **Pages**: `Passport.tsx` and `Questions.tsx`
- **Helper functions**: `passportHelpers.ts`
- **Database tables**: As described above

When extending the passport feature, make sure to update both the UI components and the helper functions as needed.

## Future Enhancements

Planned enhancements for the passport feature include:

- More detailed compatibility analysis
- Recommendations based on passport answers
- Additional question categories
- Improved visualization of compatibility 