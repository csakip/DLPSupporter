class DataBetweenUIandApp {
    constructor() {
        this.callbacks = [];
    }

    set3dApp(my3dApp) {
        this.my3dApp = my3dApp;
    }

    addCallback(action, callback, component) {
        if (!this.callbacks.includes(c => c.callback === callback)) {
            this.callbacks.push({
                action: action,
                callback: callback,
                component: component,
            });
        }
    }

    removeCallbacks(component) {
        this.callbacks = this.callbacks.filter(c => c.component !== component);
    }

    go(action, data) {
        this.callbacks.filter(c => c.action === action).forEach(c => { c.callback(data); });
    }
}

window.data = new DataBetweenUIandApp();