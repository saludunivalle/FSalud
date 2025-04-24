// src/components/common/Layout.jsx
import React from 'react';
import Header from './Header';
import PropTypes from 'prop-types';

function Layout({ children, userData }) {
  return (
    <div>
      <Header userData={userData} />
      <main>
        {children}
      </main>
    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  userData: PropTypes.object
};

export default Layout;