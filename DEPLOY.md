# Deployment Guide

This server is designed to work with an existing Supabase database and should be deployed without affecting the existing data.

## Prerequisites

- Docker and Docker Compose installed on the deployment machine
- Access to the Supabase database credentials
- Node.js 18+ (for local development)

## Environment Variables

Create a `.env` file in the production environment with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true&connection_limit=20&pool_timeout=60&idle_timeout=60&connect_timeout=20"
DIRECT_URL="postgresql://[USER]:[PASSWORD]@[HOST]:5432/postgres"

# Other configurations as needed
NODE_ENV=production
```

## Deployment Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/DevStudio-infra/Trade-tracker-server.git
   cd Trade-tracker-server
   ```

2. Create the `.env` file with your production environment variables.

3. Build and start the containers:

   ```bash
   docker-compose up -d
   ```

4. Verify the deployment:
   ```bash
   curl http://localhost:3001/api/health
   ```

## Important Notes

- This deployment setup preserves existing database data
- No migrations are run during deployment
- The server connects to your existing Supabase database
- The cron job for credit refresh runs at midnight UTC on the first day of each month

## Monitoring

- Health check endpoint: `GET /api/health`
- Docker health checks are configured to run every 30 seconds
- Container logs can be viewed with: `docker-compose logs -f app`

## Troubleshooting

1. If the server can't connect to the database:

   - Verify DATABASE_URL and DIRECT_URL are correct
   - Check if the database is accessible from the deployment environment
   - Verify Supabase firewall rules allow connections from your deployment IP

2. If Prisma client fails:
   - Run `docker-compose down`
   - Remove the containers and rebuild: `docker-compose up -d --build`

## Scaling

The application can be scaled horizontally by deploying multiple instances behind a load balancer. The cron job for credit refresh is designed to handle concurrent runs safely.
