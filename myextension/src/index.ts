import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { Widget } from '@lumino/widgets';

/**
 * Initialization data for the hello-world extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'hello-world',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    const { shell } = app;

    const widget = new Widget();
    widget.id = 'hello-world-widget';
    widget.title.label = 'Hello World';
    widget.title.closable = true;

    const content = document.createElement('div');
    content.textContent = 'Hello Niggga!';
    content.style.padding = '10px';

    widget.node.appendChild(content);

    shell.add(widget, 'left');
  }
};

export default plugin;
