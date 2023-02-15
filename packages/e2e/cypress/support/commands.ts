// In order to let cy wait for MF to get loaded
Cypress.on('uncaught:exception', () => {
  return false
})

// In order to visit a page without JavaScript
Cypress.Commands.add('visitAsHtml', (route: string) => {
  cy.request(route)
    .its('body')
    .then((html) => {
      html = html.replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        ''
      )

      cy.document().invoke({ log: false }, 'write', html)
    })
})
