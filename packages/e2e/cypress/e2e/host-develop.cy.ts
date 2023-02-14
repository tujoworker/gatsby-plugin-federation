Cypress.config({
  baseUrl: 'http://localhost:8001/',
})

describe('host-hydration', () => {
  beforeEach(() => {
    cy.visit('/')

    cy.get('html', { timeout: 10000 }).should(
      'have.attr',
      'data-is-mounted',
      '1'
    )
  })

  it('should contain h1 with correct text', () => {
    cy.get('h1').contains('Host App')
  })

  it('should contain local button with correct text', () => {
    cy.get('button[class*="HostButton"]').contains('Local Host Button')
  })

  it('should have the remote button with working React Hooks', () => {
    const elem = cy
      .get('button[class*="RemoteButton"]', { timeout: 10000 })
      .should('be.visible')

    elem.contains('Remote Button 1')
    elem.click()
    elem.contains('Remote Button 2')
    elem.click()
    elem.contains('Remote Button 3')
  })
})

describe('host-hydration /vanilla', () => {
  beforeEach(() => {
    cy.visit('/vanilla')

    cy.get('html', { timeout: 10000 }).should(
      'have.attr',
      'data-is-mounted',
      '1'
    )
  })

  it('should contain h1 with correct text', () => {
    cy.get('h1').contains('Host App')
  })

  it('should contain local button with correct text', () => {
    cy.get('button[class*="HostButton"]').contains('Local Host Button')
  })

  it('should have the remote button with working React Hooks', () => {
    const elem = cy
      .get('button[class*="RemoteButton"]', { timeout: 10000 })
      .should('be.visible')

    elem.contains('Remote Button 1')
    elem.click()
    elem.contains('Remote Button 2')
    elem.click()
    elem.contains('Remote Button 3')
  })
})
