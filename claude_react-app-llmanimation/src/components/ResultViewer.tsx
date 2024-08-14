import React, { useEffect, useRef } from 'react';

interface ResultViewerProps {
  usercode: {
    js: string;
  };
  backendcode: {
    html: string;
  };
  activeTab: string;
  updateBackendHtml: (newHtml: string) => void;
}

const ngrok_url = 'https://c492-34-74-53-149.ngrok-free.app';
const ngrok_url_sonnet = ngrok_url + '/api/message';

const ResultViewer: React.FC<ResultViewerProps> = ({ usercode, backendcode, activeTab, updateBackendHtml }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data.type === 'UPDATE_HTML') {
        updateBackendHtml(event.data.html); // Update the backend HTML in the React app
        console.log('backendhtml updated to app', event.data.html);
      }
    };

    window.addEventListener('message', handleIframeMessage);
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDocument = iframe.contentDocument;

      if (iframeDocument) {
        // Clear existing content
        iframeDocument.open();
        iframeDocument.write('<!DOCTYPE html><html lang="en"><head></head><body></body></html>');
        iframeDocument.close();
        console.log('cleared', iframeDocument);

        // Create the new content
        const newDocument = iframeDocument;
        if (newDocument) {
          newDocument.open();

          // Get container dimensions for scaling
          const containerWidth = containerRef.current?.offsetWidth || 600;
          const containerHeight = containerRef.current?.offsetHeight || 600;

          if (activeTab === 'html') {
            // Render backend HTML when HTML tab is selected
            iframeDocument.write(backendcode.html);
          } else if (activeTab === 'js') {
            newDocument.write(`
              <!DOCTYPE html>
              <html lang="en">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Fabric.js Library Example</title>
              </head>
              <style>
                  html, body {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                  }
                </style>
              <body>
                  <div id="canvasContainer" style="position: relative; width: 100%; height: 100%;"></div>
                  <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/1.4.0/fabric.min.js"></script>
                  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
                  <script>
                    // Define create_canvas and make it globally accessible
                    window.create_canvas = function create_canvas(canvas_color) {
                        const canvasContainer = document.getElementById('canvasContainer');
                        canvasContainer.style.backgroundColor = canvas_color;
                        return canvasContainer;
                    }

                    // Check if the Generate class has already been defined
                    if (!window.Generate) {
                      class Generate {
                        constructor(name) {
                          this.ngrok_url_sonnet = '${ngrok_url_sonnet}';
                          this.basic_prompt = name;
                          this.detail_prompt = '';
                          console.log('object created:', name);
                        }

                        detail(detail) {
                          this.detail_prompt = detail;
                          console.log('detail added:', detail);
                        }

                        async draw(coord, canvas, scale = 1) {
                          const APIprompt = 'write me svg code to create a ' + this.basic_prompt + ', with these details: ' + this.detail_prompt + '. Donnot include any background in generated svg. Make sure donot include anything other than the svg code in your response.';
                          console.log('api prompt', APIprompt);
                          console.log(this.ngrok_url_sonnet);

                          try {
                              const response = await axios.post(this.ngrok_url_sonnet, {
                              prompt: APIprompt
                              }, {
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                });

                              const data = response.data;
                              const content = data?.content;
                              console.log('Content from API call:', content);

                              if (content) {
                                  const svgElement = this.createSVGElement(content, coord, scale, canvas.offsetWidth, canvas.offsetHeight);
                                  canvas.appendChild(svgElement);
                                  console.log('svgelement is', svgElement);
                                  return content;
                              }
                          } catch (error) {
                              console.error('Error drawing the shape:', error);
                          }
                        }

                        createSVGElement(svgContent, coord, canvasWidth, canvasHeight, scale) {
                          const svgWrapper = document.createElement('div');
                          svgWrapper.innerHTML = svgContent.trim();
                          const svgElement = svgWrapper.firstElementChild;

                          // Get the original dimensions of the SVG
                          const viewBox = svgElement.viewBox.baseVal;
                          const originalWidth = viewBox.width;
                          const originalHeight = viewBox.height;

                          // Apply scaling using transform
                          svgElement.setAttribute('transform', \`scale(\${scale})\`);

                          // Calculate the scaled dimensions
                          const scaledWidth = originalWidth * scale;
                          const scaledHeight = originalHeight * scale;

                          // Calculate the percentage-based coordinates
                          const leftPercent = (coord.x );
                          const topPercent = (coord.y );

                          // Position the SVG so that it is centered at the given coordinates
                          svgElement.style.position = 'absolute';
                          svgElement.style.left = \`\${leftPercent}%\`;
                          svgElement.style.top = \`\${topPercent}%\`;
                          svgElement.style.transform = 'scale(\${scale}) translate(-50%, -50%)'; // Center the SVG element

                          return svgElement;
                        }
                      }

                      // Assign the class to the global window object
                      window.Generate = Generate;
                    }

                    // Another class
                    if (!window.whole_canvas) {
                      class whole_canvas {
                            constructor(canvas_color) {
                                this.canvasContainer = create_canvas(canvas_color);
                                this.backendhtmlString = \`${backendcode.html}\`;
                                console.log('Canvas created');
                              }

                          async draw(generateObject, coord, scale = 1) {
                            const svgContent = await generateObject.draw(coord, this.canvasContainer, scale);
                            if (svgContent) {
                                console.log('SVG content added to canvasContainer');
                                this.updateHTMLString(svgContent, coord, scale);
                            }
                          }

                          updateHTMLString(svgContent, coord, scale) {
                            const svgWrapper = document.createElement('div');
                            svgWrapper.innerHTML = svgContent.trim();
                            const svgElement = svgWrapper.firstElementChild;

                            // Calculate width and height of the SVG
                            let width = svgElement.getAttribute('width') || svgElement.viewBox.baseVal.width;
                            let height = svgElement.getAttribute('height') || svgElement.viewBox.baseVal.height;

                            // Apply scaling
                            width *= scale;
                            height *= scale;

                            console.log('in updateHTMLString', width, height, coord);

                            const svgHTML = \`<div style="position: absolute; left:\` + (coord.x - width / 2) +\`px; top: \` + (coord.y - width) / 2 +\`px;">
                                \`+svgContent.trim()+\`</div>\`;

                            console.log("updateHTMLString", svgHTML);
                          }
                      }  
                      window.whole_canvas = whole_canvas;
                    }

                    (function() {
                      ${usercode.js}
                    })();
                  </script>
              </body>
              </html>
            `);
          }
          newDocument.close();
        }
      }
      console.log('loaded', iframeDocument);
    }

    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  }, [usercode, activeTab]);

  return (
    <div ref={containerRef} className="result-viewer">
      <iframe key={JSON.stringify(usercode)} ref={iframeRef} title="Result Viewer" style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default ResultViewer;
