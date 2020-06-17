import PanelOpen from './PanelOpen.js';
import PanelSupports from './PanelSupports.js';
import PanelInfo from './PanelInfo.js';
import PanelTest from './PanelTest.js';
export default function UIComponent() {
  const a3d = window.data.my3dApp;
  const [activePanel, setActivePanel] = React.useState('open');
  const [hasMesh, setHasMesh] = React.useState(!!a3d.mesh);
  const [helpText, setHelpText] = React.useState([]);
  React.useEffect(() => {
    window.data.addCallback('meshLoaded', handleMeshLoaded, 'UIComponent');
    setHotkeys();
    activatePanel('support');
    return () => {
      window.data.removeCallbacks('UIComponent');
    };
  }, []);
  React.useEffect(() => {
    showHelpText();
  }, [activePanel]);

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

  function handleMeshLoaded(hasMesh) {
    setHasMesh(hasMesh);
  }

  function handleHome() {
    document.activeElement.blur();
    a3d.cameraControls.homeCamera();
  }

  function activatePanel(panelName) {
    setActivePanel(panelName);
    a3d.setActivePanel(panelName);
  }

  function showHelpText(switches) {
    let ht = [];
    helpTexts.filter(h => h.panelName == activePanel).forEach(pi => {
      const newLines = Array.isArray(pi.text) ? pi.text : [pi.text];
      ht = ht.concat(newLines);
      pi.switches.filter(si => switches && switches.contains(si.switch)).forEach(si => ht.concat(Array.isArray(si.text) ? si.text : [si.text]));
    });
    setHelpText(ht);
  }

  const helpTexts = [{
    "panelName": "open",
    "text": "This is a common help for open",
    "switches": [{
      "switch": "file",
      "text": "Switch help"
    }]
  }, {
    "panelName": "support",
    "text": ["This is a common help for support", "[Ctrl + A] to select all supports", "[I] to invert selection"],
    "switches": [{
      "switch": "supportSelected",
      "text": ["[del] to delete selected supports"]
    }]
  }];
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
    className: "tile is-parent is-vertical",
    style: {
      width: 335,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tile"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sideUi"
  }, activePanel === 'open' && /*#__PURE__*/React.createElement(PanelOpen, {
    hasMesh: hasMesh
  }), activePanel === 'support' && /*#__PURE__*/React.createElement(PanelSupports, {
    hasMesh: hasMesh
  }), activePanel === 'analyze' && /*#__PURE__*/React.createElement(PanelTest, null), activePanel === 'info' && /*#__PURE__*/React.createElement(PanelInfo, null))), /*#__PURE__*/React.createElement("div", {
    className: "sideBottom"
  }, helpText.map((ht, idx) => /*#__PURE__*/React.createElement("p", {
    key: idx
  }, ht))))));
}
const domContainer = document.querySelector('#uiWrapper');
ReactDOM.render( /*#__PURE__*/React.createElement(UIComponent, null), domContainer);