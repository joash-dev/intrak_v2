/// <reference types="cypress" />

/**
 * Authentication Test Suite
 * Tests login functionality for all user roles
 * Based on Login.tsx form structure
 */
describe('Authentication', () => {
    beforeEach(() => {
        cy.visit('/login')
    })

    describe('Login Page', () => {
        it('should display the login page', () => {
            cy.contains('Welcome to INTRAK').should('be.visible')
            cy.get('input[type="email"]').should('be.visible')
            cy.get('input[type="password"]').should('be.visible')
            cy.get('button[type="submit"]').contains('Continue').should('be.visible')
        })

        it('should show error for invalid credentials', () => {
            cy.get('input[type="email"]').type('invalid@email.com')
            cy.get('input[type="password"]').type('wrongpassword')
            cy.get('button[type="submit"]').click()
            // Should show error message (Login failed, Invalid email, Incorrect password, etc.)
            cy.get('.text-red-500, .text-red-600, .bg-red-50', { timeout: 10000 }).should('be.visible')
        })

        it('should show validation error for empty fields', () => {
            cy.get('button[type="submit"]').click()
            // Form has required attributes, should show validation
            cy.get('.text-red-500, input:invalid').should('exist')
        })

        it('should show validation error for invalid email', () => {
            cy.get('input[type="email"]').type('not-an-email')
            cy.get('input[type="email"]').blur()
            // Should show email validation error
            cy.contains(/valid email/i).should('be.visible')
        })
    })

    describe('Student Login', () => {
        it('should successfully login as student', () => {
            cy.loginAsStudent()
            // Should redirect to /student/dashboard based on Login.tsx roleRoutes
            cy.url().should('include', '/student')
        })
    })

    describe('Instructor Login', () => {
        it('should successfully login as instructor', () => {
            cy.loginAsInstructor()
            // Should redirect to /instructor/dashboard
            cy.url().should('include', '/instructor')
        })
    })

    describe('Coordinator Login', () => {
        it('should successfully login as coordinator', () => {
            cy.loginAsCoordinator()
            // Should redirect to /coordinator/dashboard
            cy.url().should('include', '/coordinator')
        })
    })

    describe('Admin Login', () => {
        it('should successfully login as admin', () => {
            cy.loginAsAdmin()
            // Should redirect to /admin
            cy.url().should('include', '/admin')
        })
    })

    describe('Supervisor Login', () => {
        it('should successfully login as supervisor (Industry Partner)', () => {
            cy.loginAsSupervisor()
            // Should redirect to /industry-partner/dashboard based on Login.tsx roleRoutes
            cy.url().should('include', '/industry-partner')
        })
    })
})
