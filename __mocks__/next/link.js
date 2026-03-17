const React = require('react');

function Link({ href, children, style }) {
  return React.createElement('a', { href, style }, children);
}

module.exports = Link;
module.exports.default = Link;
