// Cypress support file for E2E tests
// This file is loaded before each test run

// Disable uncaught exception handling for test reliability
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent Cypress from failing the test
  return false;
});

// Global test configuration
beforeEach(() => {
  // Set viewport for consistent testing
  cy.viewport(1280, 720);
});
