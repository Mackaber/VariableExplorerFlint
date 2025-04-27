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

    // Create the main widget
    const widget = new Widget();
    widget.id = 'redis-widget';
    widget.title.label = 'Redis Viewer';
    widget.title.closable = true;

    // Create a container for everything
    const container = document.createElement('div');
    container.style.padding = '10px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';

    // Create the Refresh button
    const refreshButton = document.createElement('button');
    refreshButton.innerText = 'Refresh';
    refreshButton.style.marginBottom = '10px';
    container.appendChild(refreshButton);

    // Create the output area
    const output = document.createElement('pre');
    output.textContent = 'Press Refresh to load Redis data...';
    output.style.backgroundColor = '#000';
    output.style.padding = '10px';
    output.style.border = '1px solid #ddd';
    output.style.height = '400px';
    output.style.overflow = 'auto';
    container.appendChild(output);

    // Function to fetch Redis data
    const fetchRedisData = async () => {
      output.textContent = 'Loading...';
      try {
        const response = await fetch('http://localhost:3000/redis-data');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        output.textContent = JSON.stringify(data, null, 2);
      } catch (error) {
        output.textContent = `Error fetching Redis data:\n${error}`;
      }
    };

    // Set up the button click event
    refreshButton.onclick = fetchRedisData;

    // Add container to widget
    widget.node.appendChild(container);

    // Add widget to JupyterLab
    shell.add(widget, 'left');
  }
};

export default plugin;
