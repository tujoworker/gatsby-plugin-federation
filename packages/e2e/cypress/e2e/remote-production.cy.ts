Cypress.config({
  baseUrl: 'http://localhost:8002/',
})

describe('remote-html', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should contain h1 with correct text', () => {
    cy.get('h1').contains('Remote App')
  })

  it('should contain button with correct text', () => {
    cy.get('button').contains('Remote Button 1')
  })
})

describe('remote-hydration', () => {
  beforeEach(() => {
    cy.visit('/')

    cy.get('html', { timeout: 10000 }).should(
      'have.attr',
      'data-is-mounted',
      '1'
    )
  })

  it('should have button with working React Hooks', () => {
    cy.get('button').contains('Remote Button 1')
    cy.get('button').click()
    cy.get('button').contains('Remote Button 2')
  })
})
