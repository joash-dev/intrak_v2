import { defineConfig } from 'cypress'

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:5173',
        supportFile: 'cypress/support/e2e.ts',
        specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
        viewportWidth: 1280,
        viewportHeight: 720,
        video: true,
        screenshotOnRunFailure: true,
        defaultCommandTimeout: 10000,
        env: {
            // Test credentials from seed.ts
            adminEmail: 'admin@example.com',
            coordinatorEmail: 'coordinator@example.com',
            instructorEmail: 'instructor@example.com',
            supervisorEmail: 'partner1@example.com',
            studentEmail: 'student1@example.com',
            testPassword: 'Password123!'
        }
    },
})
