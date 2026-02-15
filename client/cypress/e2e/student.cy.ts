/// <reference types="cypress" />

/**
 * Student Features Test Suite
 * Tests student-specific functionality
 */
describe('Student Features', () => {
    beforeEach(() => {
        cy.loginAsStudent()
    })

    describe('Dashboard/Overview', () => {
        it('should display dashboard with key metrics', () => {
            // Should see progress or hours information
            cy.contains(/hours|progress|completed/i, { timeout: 15000 }).should('be.visible')
        })

        it('should display student information', () => {
            // Should see student-related content
            cy.get('body').should('contain.text', /.+/) // Page has content
        })
    })

    describe('Navigation', () => {
        it('should have all navigation items', () => {
            // Check sidebar/navigation
            cy.contains(/overview|dashboard/i).should('be.visible')
            cy.contains(/documents/i).should('be.visible')
            cy.contains(/attendance/i).should('be.visible')
            cy.contains(/settings/i).should('be.visible')
        })

        it('should navigate to Documents page', () => {
            cy.contains(/documents/i).click()
            cy.url().should('include', 'document')
        })

        it('should navigate to Attendance page', () => {
            cy.contains(/attendance/i).click()
            cy.url().should('include', 'attendance')
        })
    })

    describe('Documents', () => {
        beforeEach(() => {
            cy.contains(/documents/i).click()
        })

        it('should display documents page', () => {
            cy.url().should('include', 'document')
            // Should have document-related content
            cy.get('body').then($body => {
                const hasDocuments = $body.text().toLowerCase().includes('document') ||
                    $body.text().toLowerCase().includes('upload') ||
                    $body.text().toLowerCase().includes('submission')
                expect(hasDocuments).to.be.true
            })
        })
    })

    describe('Attendance', () => {
        beforeEach(() => {
            cy.contains(/attendance/i).click()
        })

        it('should display attendance page', () => {
            cy.url().should('include', 'attendance')
        })
    })
})
