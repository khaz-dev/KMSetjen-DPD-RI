import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';

/**
 * Custom render function that includes common providers
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - RTL render options
 * @returns {Object} RTL render result
 */
function render(ui, options = {}) {
  function Wrapper({ children }) {
    return (
      <Router>
        {children}
      </Router>
    );
  }

  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
export { render };
