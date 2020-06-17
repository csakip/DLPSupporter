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

    return (() => {
      window.data.removeCallbacks('panelSupport');
      hotkeys.unbind('1,2,3,4,5,6,7,8,9,0,ctrl+a,ctrl+d,delete,l,i,n,t,shift+t');
    })
  }, []);

  React.useEffect(() => {
    if (presetContext.visible) {
      document.getElementById('presetContextMenu').onmouseleave = () => { setPresetContext({ visible: false }) }
    }
  }, [presetContext]);

  function setupHotkeys() {
    hotkeys('1,2,3,4,5,6,7,8,9,0,ctrl+a,ctrl+d,delete,l,i,n,t,shift+t', function (event, handler) {
      switch (handler.key) {
        case ('ctrl+a'): {
          selectAllSupports();
          break;
        }
        case ('ctrl+d'): {
          deselectAllSupports();
          break;
        }
        case ('delete'): {
          deleteSelectedSupports();
          break;
        }
        case ('l'): {
          deleteLastSupport();
          break;
        }
        case ('i'): {
          invertSupportsSelection();
          break;
        }
        case ('n'): {
          setSupportHeightToNormal();
          break;
        }
        case ('t'): {
          setTipEndSpheres(true);
          break;
        } case ('shift+t'): {
          setTipEndSpheres(false);
          break;
        }
        default: {
          const p = presets.find((p, idx) => idx + 1 == handler.key);
          selectPreset(p.name);
        }
      }
      return false;
    });
  }

  function selectAllSupports() {
    a3d.selectAllSupports();
    setSupports((prev) => [...prev]); // refresh table
    document.activeElement.blur();
  }

  function deselectAllSupports() {
    a3d.deselectAllSupports();
    setSupports((prev) => [...prev]); // refresh table
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
    setSupports((prev) => [...prev, s]);
    supportContainer.scrollTop = supportContainer.scrollHeight;
  }

  function selectedSupport() {
    setSupports((prev) => [...prev]);
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
    setSupports((prev) => [...prev]); // refresh table
  }

  function selectSupportsWithPreset(presetName, selected) {
    a3d.selectSupportsPreset(presetName, selected);
    setSupports((prev) => [...prev]);
    setPresetContext({ visible: false });
  }

  function toggleAllSupports() {
    const isAll = supports.some(s => !s.selected);
    isAll ? selectAllSupports() : deselectAllSupports();
  }

  function invertSupportsSelection() {
    a3d.invertSupportsSelection();
    setSupports((prev) => [...prev]);
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
    setSupports((prev) => [...prev]);
  }

  return (
    <>
      {presetContext.visible &&
        <div id="presetContextMenu" style={{ top: presetContext.top, right: presetContext.right }} className="dropdown-content">
          <a href="#" className="dropdown-item" onClick={() => selectSupportsWithPreset(presetContext.name, true)}>
            Select all {presetContext.name}
          </a>
          <a href="#" className="dropdown-item" onClick={() => selectSupportsWithPreset(presetContext.name, false)}>
            Deselect all {presetContext.name}
          </a>
          <hr className="dropdown-divider" />
          <a href="#" className="dropdown-item" onClick={() => selectSupportsWithPreset(presetContext.name, true)}>
            Edit preset
          </a>
        </div>
      }

      <div className='content noBottom'>
        <h4 className="is-pulled-left">Presets</h4>
        <a className="tag is-pulled-right" onClick={() => toggleAllSupports()}>Add New Preset</a>
      </div>

      <div className='content'>
        <div ss-container="ss-container" className="tableContainer" style={{ maxHeight: 85 }}>
          <table className="table is-hoverable" id="presetTable">
            <tbody>
              {presets.map((p, idx) => (
                <tr key={idx} onClick={() => selectPreset(p.name)} className={selectedPreset.name === p.name ? "is-selected" : undefined}>
                  <td>{p.name}</td>
                  <td>{countPresets(p.name)}</td>
                  <td className="shortcutColumn">[{idx + 1}]</td>
                  <td className='has-text-right'>
                    <a href='#' onClick={(e) => showPresetContext(p, idx, e)}>...</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* 
      <div className="field is-grouped">
        <div className="control is-expanded">
          <input className="input is-small" type="text" placeholder="Name" value={selectedPreset.name} />
        </div>
        <div className="control" style={{ width: '5em' }}>
          <input className="input is-small" type="text" placeholder="Value" value={selectedPreset.shaftDiameter} />
        </div>
      </div> */}

      <div className='content noBottom'>
        <h4 className="is-pulled-left">Supports <a className="iconText" href="#" onClick={(e) => displayHelp("supports", e)}>?</a></h4>
        {supports.length > 0 && <a className="tag is-pulled-right" onClick={() => invertSupportsSelection()}>Invert<span className='shortcut'>I</span></a>}
        {supports.length > 0 && <a className="tag is-pulled-right" onClick={() => toggleAllSupports()}>{supports.some(s => !s.selected) ? "All" : "None"}<span className='shortcut'>Ctrl+A/D</span></a>}
      </div>
      <div className='content'>
        <div id='supportContainer' ss-container="ss-container" className="tableContainer" style={{ maxHeight: 205 }}>
          <table className="table is-hoverable">
            <tbody>
              {supports.map(s => (
                <tr key={s.id} onClick={(e) => selectSupport(s, e)} className={s.selected ? 'is-selected' : undefined}>
                  <td>{s.id}</td>
                  <td>{s.presetName}{s.isMini && " (mini)"}</td>
                  <td>
                    {s.tips.map((t, idx) => <span key={idx} className={!s.selected && t.selected ? "selected" : undefined}>{t.tipSphere ? '\u23FA' : '\u25B2'}</span>)}
                  </td>
                  <td className='has-text-right'><a href='#'>...</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className='content noBottom buttons'>
        {supports.length > 0 && <a className="button is-small" onClick={() => setTipEndSpheres(true)}>Set tip ends<span className='shortcut'>T</span></a>}
        {supports.length > 0 && <a className="button is-small" onClick={() => setTipEndSpheres(false)}>Remove tip ends<span className='shortcut'>Shift+T</span></a>}
      </div>


      {supports.length > 0 &&
        <div className="content">
          <h4>Remove</h4>
          <div className="buttons">
            <button onClick={() => deleteLastSupport()} className="button is-small">
              <span className="icon is-small">
                <img src='./img/bin.svg' draggable='false' />
              </span>
              <span>Last</span>
              <span className='shortcut'>L</span>
            </button>
            {supports.some(s => s.selected) &&
              <button onClick={() => deleteSelectedSupports()} className="button is-small">
                <span className="icon is-small">
                  <img src='./img/bin.svg' draggable='false' />
                </span>
                <span>Selected</span>
                <span className='shortcut'>Del</span>
              </button>
            }
            <button onClick={() => setClearSupportsModalOpen(!clearSupportsModalOpen)} className="button is-small">
              <span className="icon is-small">
                <img src='./img/bin.svg' draggable='false' />
              </span>
              <span>All</span>
            </button>
          </div>
        </div>
      }

      {clearSupportsModalOpen &&
        <div className="card">
          <header className="card-header">
            <p className="card-header-title">This will remove all supports.</p>
          </header>
          <div className="columns">
            <div className="column is-half">
              <button className="column button is-fullwidth" onClick={() => setClearSupportsModalOpen(false)}>Cancel</button>
            </div>
            <div className="column is-half">
              <button className="button is-fullwidth is-danger" onClick={() => deleteAllSupports()}>Remove all</button>
            </div>
          </div>

        </div>
      }

      {supportsRemovedNotification &&
        <div className="notification is-success">
          All the supports have been removed.
        </div>
      }

    </>
  )
}