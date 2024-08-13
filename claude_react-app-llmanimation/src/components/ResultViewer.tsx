import React, { useState, useEffect, useRef } from 'react';

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

const ngrok_url = 'https://4f54-35-204-192-111.ngrok-free.app';
const ngrok_url_sonnet = ngrok_url + '/api/message';

const ResultViewer: React.FC<ResultViewerProps> = ({ usercode, backendcode, activeTab, updateBackendHtml }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // const [localBackendHtml, setLocalBackendHtml] = useState(backendcode.html);

  // useEffect(() => {
  //   setLocalBackendHtml(backendcode.html);
  // }, [backendcode.html]);

  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data.type === 'UPDATE_HTML') {
        updateBackendHtml(event.data.html); // Update the backend HTML in the React app
        // setLocalBackendHtml(event.data.html); // Also update the local state
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
                  <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/1.4.0/fabric.min.js"></script>
                  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
                  <script>
                    // Define create_canvas and make it globally accessible
                    window.create_canvas = function create_canvas(canvas_height = 600, canvas_width = 600, canvas_color) {
                        const canvasContainer = document.createElement('div');
                        canvasContainer.id = 'canvasContainer';
                        canvasContainer.style.position = 'relative';
                        canvasContainer.style.width = \`\`+canvas_width+\`px\`;
                        canvasContainer.style.height = \`\`+canvas_height+\`px\`;
                        canvasContainer.style.backgroundColor = canvas_color;
                        document.body.appendChild(canvasContainer);

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
                                  const svgElement = this.createSVGElement(content, coord, scale);
                                  canvasContainer.appendChild(svgElement);
                                  console.log('svgelement is', svgElement)
                                  return content;
                              }
                          } catch (error) {
                              console.error('Error drawing the shape:', error);
                          }
                        }
                        createSVGElement(svgContent, coord, scale) {
                              const svgWrapper = document.createElement('div');
                              svgWrapper.innerHTML = svgContent.trim();
                              const svgElement = svgWrapper.firstElementChild;

                              // Calculate width and height of the SVG
                              let width = svgElement.getAttribute('width') || svgElement.viewBox.baseVal.width;
                              let height = svgElement.getAttribute('height') || svgElement.viewBox.baseVal.height;

                              // Apply scaling
                              width *= scale;
                              height *= scale;

                              svgElement.setAttribute('width', width);
                              svgElement.setAttribute('height', height);

                              // Center the SVG at the provided coordinates
                              svgElement.style.position = 'absolute';
                              svgElement.style.left = \`\` + (coord.x - width / 2) +\`px\`;
                              svgElement.style.top = \`\` + (coord.y - width / 2) +\`px\`;

                              return svgElement;
                          
                        }
                      }
                      // Assign the class to the global window object
                      window.Generate = Generate;
                    }

                    //another class
                    if (!window.whole_canvas) {
                      class whole_canvas 
                      {
                            constructor(canvas_height = 600, canvas_width = 600, canvas_color = '#ffffff') 
                              {
                                this.canvas = create_canvas(canvas_height, canvas_width, canvas_color);
                                this.backendhtmlString = \`${backendcode.html}\`;
                                console.log('Canvas created with size:', canvas_height, canvas_width);
                              }

                          async draw(generateObject, coord, scale = 1) {
                            const svgContent = await generateObject.draw(coord, this.canvasContainer, scale);
                            if (svgContent) {
                                console.log('SVG content added to canvasContainer');
                                this.updateHTMLString(svgContent, coord, scale);
                            }
                          }


                          updateHTMLString(svgContent, coord, scale) 
                          {
                            const svgWrapper = document.createElement('div');
                            svgWrapper.innerHTML = svgContent.trim();
                            const svgElement = svgWrapper.firstElementChild;
                    
                            // Calculate width and height of the SVG
                            let width = svgElement.getAttribute('width') || svgElement.viewBox.baseVal.width;
                            let height = svgElement.getAttribute('height') || svgElement.viewBox.baseVal.height;
                    
                            // Apply scaling
                            width *= scale;
                            height *= scale;

                            console.log('in updateHTMLString', width, height, coord)
                    
                            const svgHTML = \`<div style="position: absolute; left:\` + (coord.x - width / 2) +\`px; top: \` + (coord.y - width) / 2 +\`px;">
                                \`+svgContent.trim()+\`</div>\`;
                    
                            //this.htmlString += svgHTML;
                            console.log("updateHTMLString", svgHTML);
                          }
                          
                          // async generateEquivalentCode(generateObject, canvas, svgContent, leftpos, toppos) {
                          //   console.log('left', leftpos);
                          //   console.log('svg', svgContent);

                          //   const objectName = generateObject.basic_prompt.replace(' ', '_'); // Using the first letter of the prompt
                            
                          //   const canvasUpdate = 
                          //   \`margin: 0;
                          //     background-color: \`+canvas.backgroundColor+\`;
                          //     width: \`+canvas.width+\`px;
                          //     height: \`+canvas.width+\`px;
                          //     display: flex;
                          //     justify-content: center;
                          //     align-items: center;
                          //     position: relative;\`

                          //   const styleUpdate = 
                          //     \`#\`+objectName+\` {
                          //       position: absolute;
                          //       left: \`+leftpos+\`px;
                          //       top: \`+toppos+\`px;
                          //     }
                          //   \`;

                          //   const newSvg = svgContent.replace(\`<svg\`, \`<svg id ="\`+objectName+\`"\`)

                          //   console.log('this');
                          //   console.log(newSvg);
                          //   console.log('that');
                          //   console.log(styleUpdate);
                            
                          //   // Introduce delay to ensure previous updates have completed
                          //   const newestlocalBackendHtml = this.backendhtmlString
                          //   console.log('check backend');
                          //   console.log(newestlocalBackendHtml);

                          //   function extractBodyStyle(html) {
                          //       const startMarker = 'body {';
                          //       const endMarker = '}';
                                
                          //       const startIndex = html.indexOf(startMarker);
                          //       if (startIndex === -1) return null;
                                
                          //       const endIndex = html.indexOf(endMarker, startIndex);
                          //       if (endIndex === -1) return null;
                                
                          //       return html.substring(startIndex + startMarker.length, endIndex).trim();
                          //   }
                            
                          //   const bodyStyle = extractBodyStyle(newestlocalBackendHtml);
                          //   console.log(bodyStyle);
                          //   if (bodyStyle) {
                          //       console.log(bodyStyle);
                          //   }
                            
                          //   const updatedHtml = (newestlocalBackendHtml.replace(bodyStyle, canvasUpdate).replace('</style>', styleUpdate + '</style>').replace('</body>', newSvg + '</body>'));
                          //   //window.parent.postMessage({ type: 'UPDATE_HTML', html: updatedHtml }, '*');
                          //   console.log(objectName, 'updated html:', updatedHtml)
                          //   this.backendhtmlString = updatedHtml
                          //   window.parent.postMessage({ type: 'UPDATE_HTML', html: this.backendhtmlString }, '*');
                          // }
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
  }, [usercode]);

  return (
    <div className="result-viewer">
      <iframe key={JSON.stringify(usercode)} ref={iframeRef} title="Result Viewer" />
    </div>
  );
};

export default ResultViewer;
