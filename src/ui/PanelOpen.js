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
    if (mode !== 'layFlat') {
      changeMode(null);
      setMode('layFlat');
      a3d.setLayFlatMode(true);
    } else {
      a3d.removeLayFlatMesh();
      changeMode(null);
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

  return (
    <>
      <label>Minimum height</label><input type='number' value={minHeight} step="0.5" onChange={(e) => changeMinHeight(e.target.value)} min="0" max="20" />

      <div className="content">
        <h3>File</h3>
        <div className="buttons">

          <button onClick={() => showFileOpen()} className="button">
            <span>Open File</span>
            <span className='shortcut'>O</span>
          </button>
          <label>Load a file into the editor.</label>

        </div>
      </div>

      {props.hasMesh &&
        <div className="content">
          <h3>Transformations</h3>
          <div className="buttons">
            <button onClick={() => changeMode('translate')} className={mode === 'translate' ? "button is-orange" : "button"}>
              <span>Move</span>
              <span className='shortcut'>M</span>
            </button>
            <button onClick={() => changeMode('rotate')} className={mode === 'rotate' ? "button is-orange" : "button"}>
              <span>Rotate</span>
              <span className='shortcut'>R</span>
            </button>
            <button onClick={() => changeMode('scale')} className={mode === 'scale' ? "button is-orange" : "button"}>
              <span>Scale</span>
              <span className='shortcut'>S</span>
            </button>
          </div>
          <div className="content">
            <div className="buttons">
              <button onClick={() => selectLayFlat()} className={mode === 'layFlat' ? "button is-orange" : "button"}>
                <span>Select bottom facing side</span>
              </button>
              {mode === 'layFlat' &&
                <>
                  <p>Click on the face on the model or the wrap that should face the buildplate.</p>
                  <button onClick={() => toggleLayFlatMesh()} className='button'>
                    <span>Toggle wrap</span>
                  </button>
                </>
              }
            </div>
          </div>
        </div>
      }

      <div className={fileModalOpen ? "modal is-active" : "modal"}>
        <div className="modal-background"></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">The current model will be discarded</p>
            <button className="delete" onClick={() => setFileModalOpen(false)}></button>
          </header>
          <section className="modal-card-body">
            It will remove the current model with all its supports.
            </section>
          <footer className="modal-card-foot" style={{ display: 'block' }}>
            <button className="button" onClick={() => setFileModalOpen(false)}>Cancel</button>
            <button className="button is-orange is-pulled-right" onClick={() => openMeshFile()}>Open File</button>
          </footer>
        </div>
      </div>

    </>
  );
}