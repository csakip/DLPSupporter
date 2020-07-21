export default function PanelOpen(props) {
  const a3d = window.data.my3dApp;
  const [mode, setMode] = React.useState(null);
  const [fileModalOpen, setFileModalOpen] = React.useState(false);
  const [minHeight, setMinHeight] = React.useState(a3d.minHeight);

  function changeMinHeight(value) {
    a3d.setMinHeight(value);
    setMinHeight(value);
  }

  function changeMode(newMode) {
    if (newMode === mode) newMode = null;
    setMode(newMode);
    a3d.setTransformControlMode(newMode);
    document.activeElement.blur();
  }

  function selectLayFlat() {
    document.activeElement.blur();

    if (mode !== 'layFlat') {
      a3d.setTransformControlMode(null);
      setMode('layFlat');
      a3d.setLayFlatMode(true);
    } else {
      a3d.setLayFlatMode(false);
      setMode(null);
    }
  }

  function toggleLayFlatMesh() {
    a3d.toggleLayFlatMesh();
    document.activeElement.blur();
  }

  function showFileOpen() {
    setMode('fileOpen');

    if (props.hasMesh) {
      setFileModalOpen(true);
    } else {
      openMeshFile();
    }
  }

  function openMeshFile() {
    a3d.loadStl('./Trimmer.stl');
    setFileModalOpen(false);
  }

  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("label", null, "Minimum height"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: minHeight,
    step: "0.5",
    onChange: e => changeMinHeight(e.target.value),
    min: "0",
    max: "20"
  }), /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("h3", null, "File"), /*#__PURE__*/React.createElement("div", {
    className: "buttons"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => showFileOpen(),
    className: "button"
  }, /*#__PURE__*/React.createElement("span", null, "Open File"), /*#__PURE__*/React.createElement("span", {
    className: "shortcut"
  }, "O")), /*#__PURE__*/React.createElement("label", null, "Load a file into the editor."))), props.hasMesh && /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("h3", null, "Transformations"), /*#__PURE__*/React.createElement("div", {
    className: "buttons"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => changeMode('translate'),
    className: mode === 'translate' ? "button is-orange" : "button"
  }, /*#__PURE__*/React.createElement("span", null, "Move"), /*#__PURE__*/React.createElement("span", {
    className: "shortcut"
  }, "M")), /*#__PURE__*/React.createElement("button", {
    onClick: () => changeMode('rotate'),
    className: mode === 'rotate' ? "button is-orange" : "button"
  }, /*#__PURE__*/React.createElement("span", null, "Rotate"), /*#__PURE__*/React.createElement("span", {
    className: "shortcut"
  }, "R")), /*#__PURE__*/React.createElement("button", {
    onClick: () => changeMode('scale'),
    className: mode === 'scale' ? "button is-orange" : "button"
  }, /*#__PURE__*/React.createElement("span", null, "Scale"), /*#__PURE__*/React.createElement("span", {
    className: "shortcut"
  }, "S"))), /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "buttons"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => selectLayFlat(),
    className: mode === 'layFlat' ? "button is-orange" : "button"
  }, /*#__PURE__*/React.createElement("span", null, "Select bottom facing side")), mode === 'layFlat' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", null, "Click on the face on the model or the wrap that should face the buildplate."), /*#__PURE__*/React.createElement("button", {
    onClick: () => toggleLayFlatMesh(),
    className: "button"
  }, /*#__PURE__*/React.createElement("span", null, "Toggle wrap")))))), /*#__PURE__*/React.createElement("div", {
    className: fileModalOpen ? "modal is-active" : "modal"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-background"
  }), /*#__PURE__*/React.createElement("div", {
    className: "modal-card"
  }, /*#__PURE__*/React.createElement("header", {
    className: "modal-card-head"
  }, /*#__PURE__*/React.createElement("p", {
    className: "modal-card-title"
  }, "The current model will be discarded"), /*#__PURE__*/React.createElement("button", {
    className: "delete",
    onClick: () => setFileModalOpen(false)
  })), /*#__PURE__*/React.createElement("section", {
    className: "modal-card-body"
  }, "It will remove the current model with all its supports."), /*#__PURE__*/React.createElement("footer", {
    className: "modal-card-foot",
    style: {
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "button",
    onClick: () => setFileModalOpen(false)
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    className: "button is-orange is-pulled-right",
    onClick: () => openMeshFile()
  }, "Open File")))));
}