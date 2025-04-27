import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { Widget } from '@lumino/widgets';

let ws: WebSocket;
let state: Record<string, any> = {}; // store the local cache

/**
 * Initialization data for the hello-world extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'hello-world',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    const { shell } = app;

    const widget = new Widget();
    widget.id = 'redis-widget';
    widget.title.label = 'Redis Viewer';
    widget.title.closable = true;

    const container = document.createElement('div');
    container.style.padding = '10px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';

    const output = document.createElement('pre');
    output.textContent = 'Connecting...';
    output.style.backgroundColor = '#000';
    output.style.padding = '10px';
    output.style.border = '1px solid #ddd';
    output.style.height = '400px';
    output.style.overflow = 'auto';
    container.appendChild(output);

    const sendSet = (key: string, value: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'set', key, value }));
      }
    };

    const sendDelete = (key: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'delete', key }));
      }
    };

    const renderState = () => {
      output.textContent = JSON.stringify(state, null, 2);
    };

    function connectWebSocket() {
      ws = new WebSocket('ws://localhost:3001');

      ws.onopen = () => {
        console.log('WebSocket connected.');
        ws.send(JSON.stringify({ type: 'request_full_state' }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message);

        if (message.type === 'full_state') {
          state = message.data;
          renderState();
        } else if (message.type === 'update') {
          state[message.key] = message.value;
          renderState();
        } else if (message.type === 'delete') {
          delete state[message.key];
          renderState();
        }
      };

      ws.onclose = () => {
        console.log('WebSocket closed. Reconnecting in 1s...');
        setTimeout(connectWebSocket, 1000);
      };
    }

    connectWebSocket();

    widget.node.appendChild(container);
    shell.add(widget, 'left');
  }
};

export default plugin;
