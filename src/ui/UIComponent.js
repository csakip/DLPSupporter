import PanelOpen from './PanelOpen.js'
import PanelSupports from './PanelSupports.js';
import PanelInfo from './PanelInfo.js';
import PanelTest from './PanelTest.js';

export default function UIComponent() {
  const a3d = window.data.my3dApp;
  const [activePanel, setActivePanel] = React.useState('open');
  const [hasMesh, setHasMesh] = React.useState(true);

  React.useEffect(() => {
    window.addEventListener('meshLoaded', (e) => handleMeshLoaded(e));
    setHotkeys();
    activatePanel('support');
  }, [])

  function setHotkeys() {
    hotkeys('F1,F2,F3,F4,shift+/', function (event, handler) {
      switch (handler.key) {
        case 'F1': activatePanel('open'); return false;
        case 'F2': activatePanel('support'); return false;
        case 'F3': activatePanel('analyze'); return false;
        case 'F4': activatePanel('save'); return false;
        case 'shift+/': activatePanel('info'); return false;
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
    window.dispatchEvent(new CustomEvent('u2sActivePanel', { detail: { activePanel: panelName } }));
  }

  let i = 0;
  return (
    <>
      <div className='floatingPanel'>
        <button className='button is-large' onClick={() => handleHome()}>
          <img src='./img/home.svg' />
        </button>
      </div>
      <div id='sidePanel' className="tile is-parent is-horizontal" style={{ padding: 0 }}>
        <div className="tile" style={{ flex: 'none' }}>
          <nav className="panel datanav">
            <a onClick={() => activatePanel('open')} style={{ top: i++ * 45 + 10 }} className={"panel-block " + (activePanel == 'open' && 'is-active')} aria-label="Open and Translate [F1]" data-microtip-position="left" role="tooltip">
              <img src='./img/icon_open.svg' draggable='false' />
            </a>
            {hasMesh && <>
              <a onClick={() => activatePanel('support')} style={{ top: i++ * 45 + 10 }} className={"panel-block " + (activePanel == 'support' && 'is-active')} aria-label="Supports [F2]" data-microtip-position="left" role="tooltip">
                <img src='./img/icon_support.svg' draggable='false' />
              </a>
              <a onClick={() => activatePanel('analyze')} style={{ top: i++ * 45 + 10 }} className={"panel-block " + (activePanel == 'analyze' && 'is-active')} aria-label="Analyze [F3]" data-microtip-position="left" role="tooltip">
                <img src='./img/icon_analysis.svg' draggable='false' />
              </a>
              <a onClick={() => activatePanel('save')} style={{ top: i++ * 45 + 10 }} className={"panel-block " + (activePanel == 'save' && 'is-active')} aria-label="Save and Export [F4]" data-microtip-position="left" role="tooltip">
                <img src='./img/icon_save.svg' draggable='false' />
              </a>
            </>}
            <a onClick={() => activatePanel('info')} style={{ top: i++ * 45 + 10 }} className={"panel-block " + (activePanel == 'info' && 'is-active')} aria-label="Help and Info [?]" data-microtip-position="left" role="tooltip">
              <img src='./img/icon_help.svg' draggable='false' />
            </a>
          </nav>
        </div>
        <div className="tile" style={{ width: 335, flex: 'none' }}>
          <div className='sideUi'>
            {activePanel === 'open' && <PanelOpen hasMesh={hasMesh} />}
            {activePanel === 'support' && <PanelSupports hasMesh={hasMesh} />}
            {activePanel === 'analyze' && <PanelTest />}
            {activePanel === 'info' && <PanelInfo />}
          </div>
        </div>
      </div>
    </>
  );
}

const domContainer = document.querySelector('#uiWrapper');
ReactDOM.render(<UIComponent />, domContainer);