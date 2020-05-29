import PanelOpen from './PanelOpen.js';
import PanelSupports from './PanelSupports.js';
import PanelInfo from './PanelInfo.js';
import PanelTest from './PanelTest.js';
export default function UIComponent() {
  const a3d = window.data.my3dApp;
  const [activePanel, setActivePanel] = React.useState('open');
  const [hasMesh, setHasMesh] = React.useState(true);
  React.useEffect(() => {
    window.addEventListener('meshLoaded', e => handleMeshLoaded(e));
    setHotkeys();
    activatePanel('support');
  }, []);

  function setHotkeys() {
    hotkeys('F1,F2,F3,F4,shift+/', function (event, handler) {
      switch (handler.key) {
        case 'F1':
          activatePanel('open');
          return false;

        case 'F2':
          activatePanel('support');
          return false;

        case 'F3':
          activatePanel('analyze');
          return false;

        case 'F4':
          activatePanel('save');
          return false;

        case 'shift+/':
          activatePanel('info');
          return false;
      }
    });
  }

  function handleMeshLoaded(e) {
    setHasMesh(e.detail.hasMesh);
  }

  function handleHome() {
    document.activeElement.blur();
    a3d.cameraControls.homeCamera();
  }

  function activatePanel(panelName) {
    setActivePanel(panelName);
    window.dispatchEvent(new CustomEvent('u2sActivePanel', {
      detail: {
        activePanel: panelName
      }
    }));
  }

  let i = 0;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "floatingPanel"
  }, /*#__PURE__*/React.createElement("button", {
    className: "button is-large",
    onClick: () => handleHome()
  }, /*#__PURE__*/React.createElement("img", {
    src: "./img/home.svg"
  }))), /*#__PURE__*/React.createElement("div", {
    id: "sidePanel",
    className: "tile is-parent is-horizontal",
    style: {
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tile",
    style: {
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("nav", {
    className: "panel datanav"
  }, /*#__PURE__*/React.createElement("a", {
    onClick: () => activatePanel('open'),
    style: {
      top: i++ * 45 + 10
    },
    className: "panel-block " + (activePanel == 'open' && 'is-active'),
    "aria-label": "Open and Translate [F1]",
    "data-microtip-position": "left",
    role: "tooltip"
  }, /*#__PURE__*/React.createElement("img", {
    src: "./img/icon_open.svg",
    draggable: "false"
  })), hasMesh && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("a", {
    onClick: () => activatePanel('support'),
    style: {
      top: i++ * 45 + 10
    },
    className: "panel-block " + (activePanel == 'support' && 'is-active'),
    "aria-label": "Supports [F2]",
    "data-microtip-position": "left",
    role: "tooltip"
  }, /*#__PURE__*/React.createElement("img", {
    src: "./img/icon_support.svg",
    draggable: "false"
  })), /*#__PURE__*/React.createElement("a", {
    onClick: () => activatePanel('analyze'),
    style: {
      top: i++ * 45 + 10
    },
    className: "panel-block " + (activePanel == 'analyze' && 'is-active'),
    "aria-label": "Analyze [F3]",
    "data-microtip-position": "left",
    role: "tooltip"
  }, /*#__PURE__*/React.createElement("img", {
    src: "./img/icon_analysis.svg",
    draggable: "false"
  })), /*#__PURE__*/React.createElement("a", {
    onClick: () => activatePanel('save'),
    style: {
      top: i++ * 45 + 10
    },
    className: "panel-block " + (activePanel == 'save' && 'is-active'),
    "aria-label": "Save and Export [F4]",
    "data-microtip-position": "left",
    role: "tooltip"
  }, /*#__PURE__*/React.createElement("img", {
    src: "./img/icon_save.svg",
    draggable: "false"
  }))), /*#__PURE__*/React.createElement("a", {
    onClick: () => activatePanel('info'),
    style: {
      top: i++ * 45 + 10
    },
    className: "panel-block " + (activePanel == 'info' && 'is-active'),
    "aria-label": "Help and Info [?]",
    "data-microtip-position": "left",
    role: "tooltip"
  }, /*#__PURE__*/React.createElement("img", {
    src: "./img/icon_help.svg",
    draggable: "false"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "tile",
    style: {
      width: 335,
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sideUi"
  }, activePanel === 'open' && /*#__PURE__*/React.createElement(PanelOpen, {
    hasMesh: hasMesh
  }), activePanel === 'support' && /*#__PURE__*/React.createElement(PanelSupports, {
    hasMesh: hasMesh
  }), activePanel === 'analyze' && /*#__PURE__*/React.createElement(PanelTest, null), activePanel === 'info' && /*#__PURE__*/React.createElement(PanelInfo, null)))));
}
const domContainer = document.querySelector('#uiWrapper');
ReactDOM.render( /*#__PURE__*/React.createElement(UIComponent, null), domContainer);