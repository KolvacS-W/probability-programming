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

const ngrok_url = 'https://7d47-34-73-18-70.ngrok-free.app';
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
                  #canvasContainer {
                    position: relative;
                    width: 100%;
                    height: 100%;
                  }
                </style>
              <body>
                  <div id="canvasContainer"></div>
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
                          console.log('object draw called', this.basic_prompt);

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
                              const svgElement = this.createSVGElement(content, coord, canvas.offsetWidth, canvas.offsetHeight, scale);
                              canvas.appendChild(svgElement);
                              console.log('svgElement is', svgElement);
                              return svgElement;
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
                          svgElement.style.transform = \`translate(-50%, -50%) scale(\${scale})\`; // Center the SVG element

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

                                // Initialize backendhtmlString with the canvas container
                                this.backendhtmlString = \`
                                <!DOCTYPE html>
                                <html lang="en">
                                <head>
                                    <meta charset="UTF-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <title>Canvas and SVG</title>
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
                                        #canvasContainer {
                                            position: relative;
                                            width: 100%;
                                            height: 100%;
                                            background-color: \${canvas_color};
                                        }
                                    </style>
                                </head>
                                <body>
                                    <div id="canvasContainer"></div>
                                </body>
                                </html>\`;
                                console.log('Canvas created and backendhtmlString initialized');

                                // Initialize the queue as a resolved Promise to maintain order
                                this.drawQueue = Promise.resolve();
                              }

                          async draw(generateObject, coord, scale = 1) {
                            console.log('canvas draw called', generateObject);

                            // Add the draw operation to the queue
                            this.drawQueue = this.drawQueue.then(async () => {
                              const svgElement = await generateObject.draw(coord, this.canvasContainer, scale);
                              if (svgElement) {
                                console.log('SVG content added to canvasContainer');
                                this.updateHTMLString(svgElement, coord, scale);
                              }
                            }).catch(error => {
                              console.error('Error in canvas draw sequence:', error);
                            });

                            return this.drawQueue; // Return the updated queue
                          }

                          updateHTMLString(svgElement, coord, scale) {
                            // Convert the SVG element to its outer HTML
                            const svgHTML = svgElement.outerHTML;
                            console.log('svgHtml:', svgElement, svgHTML);

                            // Construct the div containing the SVG element with positioning
                            const positionedSvgHTML = \`<div>\`
                                +svgHTML+
                            \`</div>\`;

                            // Update backendhtmlString by appending the new positioned SVG's HTML
                            this.backendhtmlString = this.backendhtmlString.replace('</body>', positionedSvgHTML + '</body>');

                            // Post the updated HTML back to the parent component
                            window.parent.postMessage({ type: 'UPDATE_HTML', html: this.backendhtmlString }, '*');

                            console.log("updateHTMLString with positioned SVG:", positionedSvgHTML);
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
