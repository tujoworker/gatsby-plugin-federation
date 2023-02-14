Cypress.config({
  baseUrl: 'http://localhost:8001/',
})

describe('host-html', () => {
  beforeEach(() => {
    cy.visitAsHtml('/')
  })

  it('should contain h1 with correct text', () => {
    cy.get('h1').contains('Host App')
  })

  it('should contain local button', () => {
    cy.get('button[class*="HostButton"]').contains('Local Host Button')
  })

  it('should contain remote button', () => {
    cy.get('button[class*="RemoteButton"]').contains('Remote Button 1')
  })

  // For when no SSR is used:
  // it('should contain fallback state', () => {
  //   cy.get('p[role="status"]').contains('Loading...')
  // })
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

describe('host-html /vanilla', () => {
  beforeEach(() => {
    cy.visitAsHtml('/vanilla')
  })

  it('should contain h1 with correct text', () => {
    cy.get('h1').contains('Host App')
  })

  it('should contain local button', () => {
    cy.get('button[class*="HostButton"]').contains('Local Host Button')
  })

  it('should contain remote button', () => {
    cy.get('button[class*="RemoteButton"]').contains('Remote Button 1')
  })

  // For when no SSR is used:
  // it('should contain fallback state', () => {
  //   cy.get('p[role="status"]').contains('Loading...')
  // })
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
