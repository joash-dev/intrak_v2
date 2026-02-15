/// <reference types="cypress" />

/**
 * Settings Test Suite
 * Tests the Settings page functionality including the new About Us section
 */
describe('Settings Page', () => {

    describe('Student Settings', () => {
        beforeEach(() => {
            cy.loginAsStudent()
            cy.goToSettings()
        })

        it('should display settings navigation menu', () => {
            // Check for settings navigation items
            cy.contains(/profile/i).should('be.visible')
            cy.contains(/password/i).should('be.visible')
            cy.contains(/appearance/i).should('be.visible')
            cy.contains(/notifications/i).should('be.visible')
        })

        it('should display About Us section', () => {
            // Click on About Us in navigation
            cy.contains(/about us/i).click()

            // Verify About Us content is visible
            cy.contains('INTRAK OJT Management System').should('be.visible')
            cy.contains(/version/i).should('be.visible')
            cy.contains(/developer/i).should('be.visible')
            cy.contains(/built with/i).should('be.visible')

            // Check for technologies
            cy.contains('React').should('be.visible')
            cy.contains('TypeScript').should('be.visible')
            cy.contains('Node.js').should('be.visible')
        })

        it('should display Help & Support section', () => {
            cy.contains(/help/i).click()

            // Verify Help content
            cy.contains(/faq|frequently asked/i).should('be.visible')
            cy.contains(/guide/i).should('be.visible')
            cy.contains(/privacy/i).should('be.visible')
        })

        it('should allow theme toggle in Appearance section', () => {
            cy.contains(/appearance/i).click()

            // Should see theme options
            cy.contains(/dark|light|theme/i).should('be.visible')
        })

        it('should display Profile section', () => {
            cy.contains(/profile/i).first().click()

            // Should see profile fields
            cy.get('input').should('have.length.at.least', 1)
        })
    })

    describe('Instructor Settings', () => {
        beforeEach(() => {
            cy.loginAsInstructor()
            cy.goToSettings()
        })

        it('should display About Us section', () => {
            cy.contains(/about us/i).click()
            cy.contains('INTRAK OJT Management System').should('be.visible')
            cy.contains(/developer/i).should('be.visible')
        })
    })

    describe('Coordinator Settings', () => {
        beforeEach(() => {
            cy.loginAsCoordinator()
            cy.goToSettings()
        })

        it('should display About Us section', () => {
            cy.contains(/about us/i).click()
            cy.contains('INTRAK OJT Management System').should('be.visible')
            cy.contains(/developer/i).should('be.visible')
        })
    })

    describe('Admin Settings', () => {
        beforeEach(() => {
            cy.loginAsAdmin()
            cy.goToSettings()
        })

        it('should display About Us section', () => {
            cy.contains(/about us/i).click()
            cy.contains('INTRAK OJT Management System').should('be.visible')
            cy.contains(/developer/i).should('be.visible')
        })

        it('should have system settings option', () => {
            // Admin should have additional system settings
            cy.contains(/system/i).should('be.visible')
        })
    })

    describe('Supervisor Settings', () => {
        beforeEach(() => {
            cy.loginAsSupervisor()
            cy.goToSettings()
        })

        it('should display About Us section', () => {
            cy.contains(/about us/i).click()
            cy.contains('INTRAK OJT Management System').should('be.visible')
            cy.contains(/developer/i).should('be.visible')
        })
    })
})
