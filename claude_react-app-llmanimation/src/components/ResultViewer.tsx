import React, { useState, useEffect, useRef } from 'react';

interface ResultViewerProps {
  usercode: {
    js: string;
  };
  backendcode: {
    html: string;
  };
  activeTab: string;
  updateBackendHtml: (newHtml: string) => void; // Receive the function as a prop
}

const ngrok_url = 'https://f3b5-34-29-202-234.ngrok-free.app';
const ngrok_url_sonnet = ngrok_url + '/api/message';


const ResultViewer: React.FC<ResultViewerProps> = ({ usercode, backendcode, activeTab, updateBackendHtml }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [localBackendHtml, setLocalBackendHtml] = useState(backendcode.html);

  useEffect(() => {
    setLocalBackendHtml(backendcode.html);
  }, [backendcode.html]);


  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data.type === 'UPDATE_HTML') {
        updateBackendHtml(event.data.html); // Update the backend HTML in the React app
        setLocalBackendHtml(event.data.html); // Also update the local state
        console.log('all html updated', event.data.html, localBackendHtml)
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
              <body>
                  <canvas id="c"></canvas>
                  <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/1.4.0/fabric.min.js"></script>
                  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
                  <script>
                    // Define create_canvas and make it globally accessible
                    window.create_canvas = function create_canvas(canvas_height = 600, canvas_width = 600, canvas_color) {
                      const canvas = new fabric.Canvas('c', {
                        backgroundColor: canvas_color
                      });

                      canvas.setHeight(canvas_height);
                      canvas.setWidth(canvas_width);

                      return canvas;
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

                        async draw(coord, canvas) {
                          const APIprompt = 'write me svg code to create a ' + this.basic_prompt + ', with these details: ' + this.detail_prompt + '. Make sure donot include anything other than the svg code in your response.';
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
                            console.log('content from api call:', content);

                            if (content) {
                              await new Promise((resolve) => {
                                fabric.loadSVGFromString(content, (objects, options) => {
                                  const group = fabric.util.groupSVGElements(objects, options);
                                  group.set({
                                    left: coord.x - group.width / 2,
                                    top: coord.y - group.height / 2
                                  });
                                  var leftpos = coord.x - group.width / 2;
                                  var toppos = coord.y - group.height / 2;

                                  canvas.add(group);
                                  canvas.renderAll();
                                  console.log('getting code for', content);
                                  this.generateEquivalentCode(canvas, content, leftpos, toppos).then(resolve);
                                });
                              });
                            }
                          } catch (error) {
                            console.error('Error drawing the shape:', error);
                          }
                        }

                        async generateEquivalentCode(canvas, svgContent, leftpos, toppos) {
                          console.log('left', leftpos);
                          console.log('svg', svgContent);

                          const objectName = this.basic_prompt.replace(' ', '_'); // Using the first letter of the prompt
                          
                          const canvasUpdate = 
                          \`margin: 0;
                            background-color: \`+canvas.backgroundColor+\`;
                            width: \`+canvas.width+\`px;
                            height: \`+canvas.width+\`px;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            position: relative;\`

                          const styleUpdate = 
                            \`#\`+objectName+\` {
                              position: absolute;
                              left: \`+leftpos+\`px;
                              top: \`+toppos+\`px;
                            }
                          \`;

                          const newSvg = svgContent.replace(\`<svg\`, \`<svg id ="\`+objectName+\`"\`)

                          console.log('this');
                          console.log(newSvg);
                          console.log('that');
                          console.log(styleUpdate);
                          // Ensure state is updated before accessing localBackendHtml
                          await new Promise(resolve => setTimeout(resolve, 10000)); // Let React update the state
                          const newestlocalBackendHtml = \`${localBackendHtml}\`
                          console.log('check backend');
                          console.log(newestlocalBackendHtml);

                          function extractBodyStyle(html) {
                              const startMarker = 'body {';
                              const endMarker = '}';
                              
                              const startIndex = html.indexOf(startMarker);
                              if (startIndex === -1) return null;
                              
                              const endIndex = html.indexOf(endMarker, startIndex);
                              if (endIndex === -1) return null;
                              
                              return html.substring(startIndex + startMarker.length, endIndex).trim();
                          }
                          await new Promise(resolve => setTimeout(resolve, 1000)); // Let React update the state
                          const bodyStyle = extractBodyStyle(newestlocalBackendHtml);
                          console.log(bodyStyle);
                          if (bodyStyle) {
                              console.log(bodyStyle);
                          }
                          await new Promise(resolve => setTimeout(resolve, 1000)); // Let React update the state
                          const updatedHtml = (newestlocalBackendHtml.replace(bodyStyle, canvasUpdate).replace('</style>', styleUpdate + '</style>').replace('</body>', newSvg + '</body>'));
                          window.parent.postMessage({ type: 'UPDATE_HTML', html: updatedHtml }, '*');
                          console.log(objectName, 'updated html:', updatedHtml)
                          return new Promise(resolve => setTimeout(resolve, 1000)); // small delay to ensure order
                        }
                      }

                      // Assign the class to the global window object
                      window.Generate = Generate;
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
    <div className="result-viewer">
      <iframe key={JSON.stringify(usercode)} ref={iframeRef} title="Result Viewer" />
    </div>
  );
};

export default ResultViewer;
