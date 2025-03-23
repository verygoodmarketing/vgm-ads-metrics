# VGM Ads Metrics

A Next.js application for tracking and analyzing Google Ads metrics for multiple customers.

## Development Setup

### Environment Variables

Make sure you have the following environment variables set in your `.env` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_URL=your_supabase_url
```

### Development Mode

In development mode, the application will use a mock user if Supabase is unavailable:

- Email: admin@example.com
- Role: admin

This allows you to develop and test the application without requiring a working Supabase connection.

### Running the Application

```bash
npm run dev
```

The application will be available at http://localhost:3001.

## Troubleshooting

### Supabase Connection Issues

If you're experiencing issues with Supabase connection:

1. Check that your environment variables are correctly set
2. In development mode, the application will automatically use mock data
3. For production, ensure your Supabase project is properly configured and accessible
