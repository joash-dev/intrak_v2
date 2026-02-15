// ***********************************************************
// This file is processed and loaded automatically before test files.
// You can add custom commands and reusable behavior here.
// ***********************************************************

// Custom command for login - matches Login.tsx form structure
Cypress.Commands.add('login', (email: string, password: string) => {
    cy.visit('/login')
    // The login form uses type="email" and type="password" inputs (no name attribute)
    cy.get('input[type="email"]').clear().type(email)
    cy.get('input[type="password"]').clear().type(password)
    // The submit button says "Continue"
    cy.get('button[type="submit"]').click()
    // Wait for redirect after login (should go to role-specific dashboard)
    cy.url().should('not.include', '/login', { timeout: 15000 })
})

// Custom command for login with test credentials (from seed.ts)
Cypress.Commands.add('loginAsAdmin', () => {
    cy.login(Cypress.env('adminEmail'), Cypress.env('testPassword'))
})

Cypress.Commands.add('loginAsStudent', () => {
    cy.login(Cypress.env('studentEmail'), Cypress.env('testPassword'))
})

Cypress.Commands.add('loginAsInstructor', () => {
    cy.login(Cypress.env('instructorEmail'), Cypress.env('testPassword'))
})

Cypress.Commands.add('loginAsCoordinator', () => {
    cy.login(Cypress.env('coordinatorEmail'), Cypress.env('testPassword'))
})

Cypress.Commands.add('loginAsSupervisor', () => {
    cy.login(Cypress.env('supervisorEmail'), Cypress.env('testPassword'))
})

// Custom command for logout
Cypress.Commands.add('logout', () => {
    cy.get('[data-testid="logout-btn"], button:contains("Logout"), a:contains("Logout")').first().click({ force: true })
})

// Custom command for navigating to settings
Cypress.Commands.add('goToSettings', () => {
    cy.get('a[href*="settings"], button:contains("Settings"), [data-testid="settings-btn"]').first().click({ force: true })
})

// TypeScript declarations
declare global {
    namespace Cypress {
        interface Chainable {
            login(email: string, password: string): Chainable<void>
            loginAsAdmin(): Chainable<void>
            loginAsStudent(): Chainable<void>
            loginAsInstructor(): Chainable<void>
            loginAsCoordinator(): Chainable<void>
            loginAsSupervisor(): Chainable<void>
            logout(): Chainable<void>
            goToSettings(): Chainable<void>
        }
    }
}

export { }
