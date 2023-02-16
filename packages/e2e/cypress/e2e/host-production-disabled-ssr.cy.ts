import { HostHtmlNoSSR, HostHydration } from './shared-tests/host-production'

Cypress.config({
  baseUrl: 'http://localhost:8001/',
})

describe('host-disabled-ssr html', () => {
  beforeEach(() => {
    cy.visitAsHtml('/')
  })

  HostHtmlNoSSR()
})

describe('host-disabled-ssr hydration', () => {
  beforeEach(() => {
    cy.visit('/')

    cy.get('html', { timeout: 10000 }).should(
      'have.attr',
      'data-host-mounted',
      '1'
    )
  })

  HostHydration()
})

describe('host-disabled-ssr html /vanilla', () => {
  beforeEach(() => {
    cy.visitAsHtml('/vanilla')
  })

  HostHtmlNoSSR()
})

describe('host-disabled-ssr hydration /vanilla', () => {
  beforeEach(() => {
    cy.visit('/vanilla')

    cy.get('html', { timeout: 10000 }).should(
      'have.attr',
      'data-host-mounted',
      '1'
    )
  })

  HostHydration()
})
