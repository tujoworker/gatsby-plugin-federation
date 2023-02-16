import { HostHtmlSSR, HostHydration } from './SharedHostTests'

Cypress.config({
  baseUrl: 'http://localhost:8001/',
})

describe('host-html', () => {
  beforeEach(() => {
    cy.visitAsHtml('/')
  })

  HostHtmlSSR()
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

  HostHydration()
})

describe('host-html /vanilla', () => {
  beforeEach(() => {
    cy.visitAsHtml('/vanilla')
  })

  HostHtmlSSR()
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

  HostHydration()
})
