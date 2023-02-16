export const HostHtml = () => {
  it('should contain h1 with correct text', () => {
    cy.get('h1').contains('Host App')
  })

  it('should contain local button', () => {
    cy.get('button[class*="HostButton"]').contains('Local Host Button')
  })
}

export const HostHtmlNoSSR = () => {
  HostHtml()

  it('should contain fallback state', () => {
    cy.get('p[role="status"]').contains('Loading...')
  })
}

export const HostHtmlSSR = () => {
  HostHtml()

  it('should contain remote button', () => {
    cy.get('button[class*="RemoteButton"]').contains('Remote Button 1')
  })
}

export const HostHydration = () => {
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
}
