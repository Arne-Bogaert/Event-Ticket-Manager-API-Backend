# Examenopdracht Web Services

- Student: Arne Bogaert
- Studentennummer: 230912176089
- E-mailadres: <arne.bogaert@student.hogent.be>

## Requirements

Install the following software

- [NodeJS v22 LTS](https://nodejs.org)
- [pnpm](https://pnpm.io)
- Nest CLI `pnpm add -g @nestjs/cli`
- [MySQL v8](https://dev.mysql.com/downloads/windows/installer/8.0.html)
- [MySQL Workbench](https://dev.mysql.com/downloads/workbench/)

## Back-end

## Before starting/testing this project

Create a `.env` (development) file with the following template. Complete the environment variables with your secrets, credentials, etc.

```env
# General configuration
NODE_ENV=development
PORT=3000

# Cors configuration
CORS_ORIGINS = ["http://localhost:5173"]
CORS_MAX_AGE =10800

# Database configuration
DATABASE_URL=mysql://devusr:devpwd@localhost:3307/event_ticket_manager

# Logging Configuration
LOG_LEVELS = ["warn", "error", "log"]

# Authentication Configuration
AUTH_JWT_SECRET=eensuperveiligsecretvoorindevelopment
AUTH_HASH_LENGTH=32
AUTH_HASH_TIME_COST=6
AUTH_HASH_MEMORY_COST=65536
AUTH_MAX_DELAY=2000
AUTH_JWT_AUDIENCE=event_ticket_manager.hogent.be
AUTH_JWT_ISSUER=event_ticket_manager.hogent.be
```

## Start the project

### Development

- Install all dependencies: `pnpm install`
- Make sure a `.env` exists (see above)
- Create a database with the name given in the `.env` file
- Migrate the database: `pnpm db:migrate`
- Seed the database: `pnpm db:seed`
- Start the development server: `pnpm start:dev`

### Production

For my production server i chose [Render](https://render.com/) because it is free and easy to use. Also this project doesn't require much computing power so the free Render plan is sufficient.

- Install all dependencies: `pnpm install`
- Make sure all environment variables are available in the environment
- Create a database with the name given in the environment variable
- Migrate the database: `pnpm db:migrate`
- Start the production server: `pnpm start`

## Test this project

Create a `.env.test` file in the root of your project with the following template, replace with your own credentials.

```env
# .env.test
# General configuration
NODE_ENV=testing
PORT=3000

# CORS configuration
CORS_ORIGINS=["http://localhost:5173"]
CORS_MAX_AGE=10800

# Auth configuration
AUTH_JWT_SECRET=eenveeltemoeilijksecretdatniemandooitzalradenandersisdesitegehacked
AUTH_JWT_AUDIENCE=event_ticket_manager_test.hogent.be
AUTH_JWT_ISSUER=event_ticket_manager_test.hogent.be
AUTH_HASH_LENGTH=32
AUTH_HASH_TIME_COST=6
AUTH_HASH_MEMORY_COST=65536
AUTH_MAX_DELAY=2000

# Logging configuration
LOG_DISABLED=true
```

The test database will be created and dropped each time the tests are run! You don't have to specify the  `DATABASE_URL` in the `.env.test` file. It is also recommended to leave the `LOG_DISABLED` variable on true.

- Install all dependencies: `pnpm install`
- Run the tests: `pnpm test:e2e`
  - This will start a new server for each test suite that runs, you won't see any output as logging is disabled to make output more clean.
  - To enable logging change the config parameter `LOG_DISABLED` to `false`.
  - You can also use `pnpm test:e2e:cov` to generate a coverage file you can find this in the newly generated coverage folder
