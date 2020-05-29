'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PanelLanding = function (_React$Component) {
  _inherits(PanelLanding, _React$Component);

  function PanelLanding() {
    _classCallCheck(this, PanelLanding);

    return _possibleConstructorReturn(this, (PanelLanding.__proto__ || Object.getPrototypeOf(PanelLanding)).apply(this, arguments));
  }

  _createClass(PanelLanding, [{
    key: 'render',
    value: function render() {
      var i = 0;
      return React.createElement(
        React.Fragment,
        null,
        React.createElement(
          'ul',
          null,
          React.createElement(
            'li',
            { style: { lineHeight: '42px' } },
            React.createElement(
              'span',
              { style: { fontSize: '1.5em' } },
              '\u2190'
            ),
            ' [1]  Open and translate model'
          ),
          React.createElement(
            'li',
            { style: { lineHeight: '42px' } },
            React.createElement(
              'span',
              { style: { fontSize: '1.5em' } },
              '\u2190'
            ),
            ' [2]  Set supports'
          ),
          React.createElement(
            'li',
            { style: { lineHeight: '42px' } },
            React.createElement(
              'span',
              { style: { fontSize: '1.5em' } },
              '\u2190'
            ),
            ' [3]  Analyze model'
          ),
          React.createElement(
            'li',
            { style: { lineHeight: '42px' } },
            React.createElement(
              'span',
              { style: { fontSize: '1.5em' } },
              '\u2190'
            ),
            ' [4]  Export model or settings'
          ),
          React.createElement(
            'li',
            { style: { lineHeight: '42px' } },
            React.createElement(
              'span',
              { style: { fontSize: '1.5em' } },
              '\u2190'
            ),
            ' [5]  Info'
          )
        ),
        React.createElement(
          'div',
          null,
          React.createElement(
            'p',
            null,
            'Shortcuts are shown next to functions in [brackets].'
          )
        )
      );
    }
  }]);

  return PanelLanding;
}(React.Component);

export default PanelLanding;