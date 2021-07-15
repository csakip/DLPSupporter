export default function PanelSupports(props) {
  const a3d = window.data.my3dApp;
  const [clearSupportsModalOpen, setClearSupportsModalOpen] = React.useState(false);
  const [supportsRemovedNotification, setSupportsRemovedNotification] = React.useState(false);
  const [presets, setPresets] = React.useState(a3d.presets);
  const [selectedPreset, setSelectedPreset] = React.useState(a3d.selectedPreset);
  const [supports, setSupports] = React.useState(a3d.supports);
  const [lastSelectedSupport, setLastSelectedSupport] = React.useState();
  const [presetContext, setPresetContext] = React.useState({
    visible: false,
    top: 0,
    right: 0,
    idx: null,
    name: null
  });
  React.useEffect(() => {
    window.data.addCallback('addSupport', addSupport, 'panelSupport');
    window.data.addCallback('selectedSupport', selectedSupport, 'panelSupport');
    SimpleScrollbar.initAll();
    supportContainer = document.querySelector('#supportContainer .ss-content');
    setupHotkeys();
    supportContainer.scrollTop = supportContainer.scrollHeight;
    return () => {
      window.data.removeCallbacks('panelSupport');
      hotkeys.unbind('1,2,3,4,5,6,7,8,9,0,ctrl+a,ctrl+d,delete,l,i,n,t,shift+t');
    };
  }, []);
  React.useEffect(() => {
    if (presetContext.visible) {
      document.getElementById('presetContextMenu').onmouseleave = () => {
        setPresetContext({
          visible: false
        });
      };
    }
  }, [presetContext]);

  function setupHotkeys() {
    hotkeys('1,2,3,4,5,6,7,8,9,0,ctrl+a,ctrl+d,delete,l,i,n,t,shift+t', function (event, handler) {
      switch (handler.key) {
        case 'ctrl+a':
          {
            selectAllSupports();
            break;
          }

        case 'ctrl+d':
          {
            deselectAllSupports();
            break;
          }

        case 'delete':
          {
            deleteSelectedSupports();
            break;
          }

        case 'l':
          {
            deleteLastSupport();
            break;
          }

        case 'i':
          {
            invertSupportsSelection();
            break;
          }

        case 'n':
          {
            setSupportHeightToNormal();
            break;
          }

        case 't':
          {
            setTipEndSpheres(true);
            break;
          }

        case 'shift+t':
          {
            setTipEndSpheres(false);
            break;
          }

        default:
          {
            const p = presets.find((p, idx) => idx + 1 == handler.key);
            selectPreset(p.name);
          }
      }

      return false;
    });
  }

  function selectAllSupports() {
    a3d.selectAllSupports();
    setSupports(prev => [...prev]); // refresh table

    document.activeElement.blur();
  }

  function deselectAllSupports() {
    a3d.deselectAllSupports();
    setSupports(prev => [...prev]); // refresh table

    document.activeElement.blur();
  }

  function deleteLastSupport() {
    if (supports.length == 0) return;
    a3d.deleteLastSupport();
    setSupports([...a3d.supports]);
    document.activeElement.blur();
  }

  function deleteSelectedSupports() {
    a3d.deleteSelectedSupports();
    setSupports([...a3d.supports]);
    document.activeElement.blur();
  }

  function selectPreset(presetName) {
    a3d.selectPreset(presetName);
    setSelectedPreset(a3d.selectedPreset); // refresh table
  }

  function countPresets(presetName) {
    return supports.filter(s => s.presetName === presetName).length;
  }

  function addSupport(s) {
    setSupports(prev => [...prev, s]);
    supportContainer.scrollTop = supportContainer.scrollHeight;
  }

  function selectedSupport() {
    setSupports(prev => [...prev]);
  }

  function deleteAllSupports() {
    a3d.deleteAllSupports();
    setClearSupportsModalOpen(false);
    setSupports([...a3d.supports]);
    setSupportsRemovedNotification(true);
    setTimeout(() => {
      setSupportsRemovedNotification(false);
    }, 1500);
  }

  function selectSupport(support, event) {
    if (event && event.shiftKey && lastSelectedSupport && lastSelectedSupport != support.id) {
      supports.filter(s => s.id >= Math.min(support.id, lastSelectedSupport) && s.id <= Math.max(support.id, lastSelectedSupport)).forEach(s => a3d.selectSupport(s.id));
    } else {
      if (support.selected) {
        if (event.ctrlKey) {
          a3d.deselectSupport(support.id);
        } else {
          a3d.deselectAllSupports();
        }
      } else {
        a3d.selectSupport(support.id, !event.ctrlKey);
      }

      setLastSelectedSupport(support.id);
    }

    setSupports(prev => [...prev]); // refresh table
  }

  function selectSupportsWithPreset(presetName, selected) {
    a3d.selectSupportsPreset(presetName, selected);
    setSupports(prev => [...prev]);
    setPresetContext({
      visible: false
    });
  }

  function toggleAllSupports() {
    const isAll = supports.some(s => !s.selected);
    isAll ? selectAllSupports() : deselectAllSupports();
  }

  function invertSupportsSelection() {
    a3d.invertSupportsSelection();
    setSupports(prev => [...prev]);
  }

  function setSupportHeightToNormal() {
    a3d.setSupportHeightToNormal();
  }

  function showPresetContext(preset, idx, e) {
    setPresetContext({
      visible: true,
      top: e.clientY - 3,
      right: 38,
      name: preset.name,
      idx: idx
    });
  }

  function displayHelp(type, e) {
    e.preventDefault();
    console.log(type);
  }

  function setTipEndSpheres(enabled) {
    a3d.setTipEndSpheres(enabled);
    setSupports(prev => [...prev]);
  }

  return /*#__PURE__*/React.createElement(React.Fragment, null, presetContext.visible && /*#__PURE__*/React.createElement("div", {
    id: "presetContextMenu",
    style: {
      top: presetContext.top,
      right: presetContext.right
    },
    className: "dropdown-content"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    className: "dropdown-item",
    onClick: () => selectSupportsWithPreset(presetContext.name, true)
  }, "Select all ", presetContext.name), /*#__PURE__*/React.createElement("a", {
    href: "#",
    className: "dropdown-item",
    onClick: () => selectSupportsWithPreset(presetContext.name, false)
  }, "Deselect all ", presetContext.name), /*#__PURE__*/React.createElement("hr", {
    className: "dropdown-divider"
  }), /*#__PURE__*/React.createElement("a", {
    href: "#",
    className: "dropdown-item",
    onClick: () => selectSupportsWithPreset(presetContext.name, true)
  }, "Edit preset")), /*#__PURE__*/React.createElement("div", {
    className: "content noBottom"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "is-pulled-left"
  }, "Presets"), /*#__PURE__*/React.createElement("a", {
    className: "tag is-pulled-right",
    onClick: () => toggleAllSupports()
  }, "Add New Preset")), /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("div", {
    "ss-container": "ss-container",
    className: "tableContainer",
    style: {
      maxHeight: 85
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "table is-hoverable",
    id: "presetTable"
  }, /*#__PURE__*/React.createElement("tbody", null, presets.map((p, idx) => /*#__PURE__*/React.createElement("tr", {
    key: idx,
    onClick: () => selectPreset(p.name),
    className: selectedPreset.name === p.name ? "is-selected" : undefined
  }, /*#__PURE__*/React.createElement("td", null, p.name), /*#__PURE__*/React.createElement("td", null, countPresets(p.name)), /*#__PURE__*/React.createElement("td", {
    className: "shortcutColumn"
  }, "[", idx + 1, "]"), /*#__PURE__*/React.createElement("td", {
    className: "has-text-right"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => showPresetContext(p, idx, e)
  }, "...")))))))), /*#__PURE__*/React.createElement("div", {
    className: "content noBottom"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "is-pulled-left"
  }, "Supports ", /*#__PURE__*/React.createElement("a", {
    className: "iconText",
    href: "#",
    onClick: e => displayHelp("supports", e)
  }, "?")), supports.length > 0 && /*#__PURE__*/React.createElement("a", {
    className: "tag is-pulled-right",
    onClick: () => invertSupportsSelection()
  }, "Invert", /*#__PURE__*/React.createElement("span", {
    className: "shortcut"
  }, "I")), supports.length > 0 && /*#__PURE__*/React.createElement("a", {
    className: "tag is-pulled-right",
    onClick: () => toggleAllSupports()
  }, supports.some(s => !s.selected) ? "All" : "None", /*#__PURE__*/React.createElement("span", {
    className: "shortcut"
  }, "Ctrl+A/D"))), /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("div", {
    id: "supportContainer",
    "ss-container": "ss-container",
    className: "tableContainer",
    style: {
      maxHeight: 205
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "table is-hoverable"
  }, /*#__PURE__*/React.createElement("tbody", null, supports.map(s => /*#__PURE__*/React.createElement("tr", {
    key: s.id,
    onClick: e => selectSupport(s, e),
    className: s.selected ? 'is-selected' : undefined
  }, /*#__PURE__*/React.createElement("td", null, s.id), /*#__PURE__*/React.createElement("td", null, s.presetName, s.isMini && " (mini)"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    className: "tipCell"
  }, s.tips.map((t, idx) => /*#__PURE__*/React.createElement("span", {
    key: idx,
    className: !s.selected && t.selected ? "selected" : undefined
  }, t.tipSphere ? '\u23FA' : '\u25B2')))), /*#__PURE__*/React.createElement("td", {
    className: "has-text-right"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "...")))))))), /*#__PURE__*/React.createElement("div", {
    className: "content noBottom buttons"
  }, supports.length > 0 && /*#__PURE__*/React.createElement("a", {
    className: "button is-small",
    onClick: () => setTipEndSpheres(true)
  }, "Set tip ends", /*#__PURE__*/React.createElement("span", {
    className: "shortcut"
  }, "T")), supports.length > 0 && /*#__PURE__*/React.createElement("a", {
    className: "button is-small",
    onClick: () => setTipEndSpheres(false)
  }, "Remove tip ends", /*#__PURE__*/React.createElement("span", {
    className: "shortcut"
  }, "Shift+T"))), supports.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("h4", null, "Remove"), /*#__PURE__*/React.createElement("div", {
    className: "buttons"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => deleteLastSupport(),
    className: "button is-small"
  }, /*#__PURE__*/React.createElement("span", {
    className: "icon is-small"
  }, /*#__PURE__*/React.createElement("img", {
    src: "./img/bin.svg",
    draggable: "false"
  })), /*#__PURE__*/React.createElement("span", null, "Last"), /*#__PURE__*/React.createElement("span", {
    className: "shortcut"
  }, "L")), supports.some(s => s.selected) && /*#__PURE__*/React.createElement("button", {
    onClick: () => deleteSelectedSupports(),
    className: "button is-small"
  }, /*#__PURE__*/React.createElement("span", {
    className: "icon is-small"
  }, /*#__PURE__*/React.createElement("img", {
    src: "./img/bin.svg",
    draggable: "false"
  })), /*#__PURE__*/React.createElement("span", null, "Selected"), /*#__PURE__*/React.createElement("span", {
    className: "shortcut"
  }, "Del")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setClearSupportsModalOpen(!clearSupportsModalOpen),
    className: "button is-small"
  }, /*#__PURE__*/React.createElement("span", {
    className: "icon is-small"
  }, /*#__PURE__*/React.createElement("img", {
    src: "./img/bin.svg",
    draggable: "false"
  })), /*#__PURE__*/React.createElement("span", null, "All")))), clearSupportsModalOpen && /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("header", {
    className: "card-header"
  }, /*#__PURE__*/React.createElement("p", {
    className: "card-header-title"
  }, "This will remove all supports.")), /*#__PURE__*/React.createElement("div", {
    className: "columns"
  }, /*#__PURE__*/React.createElement("div", {
    className: "column is-half"
  }, /*#__PURE__*/React.createElement("button", {
    className: "column button is-fullwidth",
    onClick: () => setClearSupportsModalOpen(false)
  }, "Cancel")), /*#__PURE__*/React.createElement("div", {
    className: "column is-half"
  }, /*#__PURE__*/React.createElement("button", {
    className: "button is-fullwidth is-danger",
    onClick: () => deleteAllSupports()
  }, "Remove all")))), supportsRemovedNotification && /*#__PURE__*/React.createElement("div", {
    className: "notification is-success"
  }, "All the supports have been removed."));
}