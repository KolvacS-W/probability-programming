import React, { useEffect, useRef, useState } from 'react';
import { Version, KeywordTree } from '../types';
import axios from 'axios';

interface ResultViewerProps {
  usercode: {
    js: string;
  };
  backendcode: {
    html: string;
  };
  activeTab: string;
  updateBackendHtml: (newHtml: string) => void;

  currentVersionId: string | null;
  setVersions: React.Dispatch<React.SetStateAction<Version[]>>;
  versions: Version[];

}

const ngrok_url = 'https://dca9-34-75-244-217.ngrok-free.app';
const ngrok_url_sonnet = ngrok_url + '/api/message';
//for future use in draw()

const ResultViewer: React.FC<ResultViewerProps> = ({ usercode, backendcode, activeTab, updateBackendHtml, currentVersionId, setVersions, versions, }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentreuseableElementList = versions.find(version => version.id === currentVersionId)?.reuseableElementList;
  //console.log('check svglist', currentreuseableElementList)
  const [clickCoordinates, setClickCoordinates] = useState<{ x: number; y: number } | null>(null);

  
  useEffect(() => {
    const handleIframeClick = (event: MessageEvent) => {
      if (event.data.type === 'CLICK_COORDINATES') {
        setClickCoordinates({ x: event.data.x, y: event.data.y });
        setVersions(prevVersions => {
          const updatedVersions = prevVersions.map(version =>
            version.id === currentVersionId
              ? { ...version, storedcoordinate: { x: event.data.x, y: event.data.y }}
              : version
          );
          return updatedVersions;
        });
        console.log('stored coordinates:', { x: event.data.x, y: event.data.y });
      }
    };

    window.addEventListener('message', handleIframeClick);

    return () => {
      window.removeEventListener('message', handleIframeClick);
    };
  }, []);
  
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data.type === 'UPDATE_HTML') {
        updateBackendHtml(event.data.html); // Update the backend HTML in the React app
        console.log('backendhtml updated to app', event.data.html);
      }

      if (event.data.type === 'UPDATE_REUSEABLE') {
        const newElement = {
          codeName: event.data.codename,
          codeText: event.data.codetext,
          selected: false
        };
        
        setVersions(prevVersions => {
          const updatedVersions = prevVersions.map(version => {
            if (version.id === currentVersionId) {
              const updatedReuseableElementList = version.reuseableElementList.map(element => 
                element.codeName === newElement.codeName ? newElement : element
              );
              
              if (!updatedReuseableElementList.some(element => element.codeName === newElement.codeName)) {
                updatedReuseableElementList.push(newElement);
              }
              
              return { ...version, reuseableElementList: updatedReuseableElementList };
            }
            return version;
          });
          
          return updatedVersions;
        });
        
        console.log('svg code updated or added to element list');
      }

      if (event.data.type == 'CODE2DESC'){
        handleCode2Desc(currentVersionId, event.data.code)
        console.log('code2desc called')
      }
    };

    const saveVersionToHistory = (currentVersionId: string) => {
      setVersions((prevVersions) => {
        const updatedVersions = prevVersions.map((version) => {
          if (version.id === currentVersionId) {
            const historyVersion = { ...version, id: `${currentVersionId}-history` };
            return { ...version, history: historyVersion };
          }
          return version;
        });
        return updatedVersions;
      });
    };

    const handleCode2Desc = async (versionId: string, code: string) => {
      saveVersionToHistory(versionId);
      if (!versionId) return;
  
      setVersions((prevVersions) => {
        const updatedVersions = prevVersions.map(version =>
          version.id === versionId
            ? { ...version, loading: true }
            : version
        );
        return updatedVersions;
      });
  
      const prompt = `Based on the following code with annotations, provide an updated description. Code:`+ code +
      `Create the description by:
      1): create a backbone description with the annotations
      2): finding important entities in the backbone description (for example, 'planet', 'shape', 'color', and 'move' are all entities) and inserting [] around them 
      3): inserting a detail wrapped in {} behind each entity according to the code (make sure to add all the details about the entity in the code, including all the variable names, numbers, specific svg path coordinates, and parameters. For example, add the number of planets and each planet's dom element type, class, style features, and name to entity 'planet').\\
      New description format:\\
      xxxxx[entity1]{detail for entity1}xxxx[entity2]{detail for entity2}... \\ 
      Important: The entities must be within the old description already instead of being newly created. Find as many entities in the old description as possible. Each entity and each detail are wrapped in a [] and {} respectively. Other than the two symbols ([], {}) and added details, the updated description should be exactly the same as the old description. Include nothing but the new description in the response.\\
      If there are svg paths or customized polygons in the code, the coordinates and points must be included in details.
      Example: 
      old description: Polygons moving and growing
      output updated description:
      [polygons]{two different polygon elements, polygon1 and polygon2 colored red and blue respectively, each defined by three points to form a triangle shape} [moving]{motion defined along path1-transparent fill and black stroke, and path2 -transparent fill and black stroke} and [growing]{size oscillates between 1 and 2 over a duration of 2000ms with easing}`;
  ;
      console.log('code2desc prompt', prompt)
  
      try {
        const response = await axios.post(ngrok_url_sonnet, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prompt: prompt })
        });
  
        const data = await response.data;
        const content = data?.content;
        console.log('content from code2text:', content);
  
        if (content) {
          const updatedDescription = content.replace('] {', ']{').replace(']\n{', ']{');
          setVersions((prevVersions) => {
            const updatedVersions = prevVersions.map(version =>
              version.id === versionId
                ? {
                    ...version,
                    description: updatedDescription,
                    savedOldDescription: updatedDescription,
                  }
                : version
            );
            return updatedVersions;
          });
        }
      } catch (error) {
        console.error("Error processing update code request:", error);
      } finally {
        setVersions((prevVersions) => {
          const updatedVersions = prevVersions.map(version =>
            version.id === versionId
              ? { ...version, loading: false }
              : version
          );
          return updatedVersions;
        });
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
                  document.addEventListener('click', function(event) {
                      const rect = document.body.getBoundingClientRect();
                      const x = ((event.clientX - rect.left) / rect.width) * 100;
                      const y = ((event.clientY - rect.top) / rect.height) * 100;
                      window.parent.postMessage({ type: 'CLICK_COORDINATES', x: x, y: y }, '*');
                  });
                  </script>
                  <script>
                    window.currentreuseableElementList = ${JSON.stringify(currentreuseableElementList)};
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
                          this.code = '';
                          console.log('object created:', name);
                        }

                        detail(detail) {
                          this.detail_prompt = detail;
                          console.log('detail added:', detail);
                        }

                        usesvg(code) {
                          this.code = code;
                          console.log('svg code added:', code);
                        }

                        async draw(coord, canvas, reuseablecodelist, scale = 1) {
                          console.log('object draw called', this.basic_prompt);
                          var APIprompt = '';

                          if(this.code){
                            console.log('has existing code')
                            console.log('reading codelist  in canvas object', this.reuseablecodelist)
                            const codename = this.code
                            //const codelist = window.currentreuseableElementList
                            const codelist = reuseablecodelist
                            console.log('use list newhhhh', codelist)
                            const existingcode = codelist.find((item) => item.codename === codename)?.svg;
                            console.log('draw with existing code:', existingcode)

                            APIprompt = 'write me an updated svg code basing on this existing code: '+existingcode+ ' and description: ' + this.basic_prompt + '(with these details: ' + this.detail_prompt + '). If the existing code conforms to the description, return the same code without change; Otherwise, return the code slightly updated according to the existing description. Do not include any background in generated svg. Make sure donot include anything other than the svg code in your response.';
                          }

                          else{
                            APIprompt = 'write me svg code to create a ' + this.basic_prompt + ', with these details: ' + this.detail_prompt + '. Do not include any background in generated svg. Make sure donot include anything other than the svg code in your response.';
                          }

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

                                this.reuseablecodelist = [];;

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

                          async draw(generateObject, coord, scale = 1, ifcode2desc = false) {
                            console.log('canvas draw called', generateObject, ifcode2desc);

                            // Add the draw operation to the queue
                            this.drawQueue = this.drawQueue.then(async () => {
                              const svgElement = await generateObject.draw(coord, this.canvasContainer, this.reuseablecodelist, scale);
                              if (svgElement) {
                                console.log('SVG content added to canvasContainer');
                                this.updateHTMLString(svgElement, generateObject.basic_prompt+' '+generateObject.detail_prompt, coord, scale, ifcode2desc); // Pass the codename and code
                                this.reuseablecodelist.push({ codename: generateObject.basic_prompt + ' ' + generateObject.detail_prompt, svg: svgElement.outerHTML }); // in case user wants to use existing html quickly, it takes too long time to go to reuseable list
                                console.log('codelist updated in canvas object', this.reuseablecodelist)
                                return generateObject.basic_prompt + ' ' + generateObject.detail_prompt; // Return the codename
                              }
                            }).catch(error => {
                              console.error('Error in canvas draw sequence:', error);
                            });

                            return this.drawQueue.then(() => generateObject.basic_prompt + ' ' + generateObject.detail_prompt); // Ensure the codename is returned
                          }

                          updateHTMLString(svgElement, codename, coord, scale, ifcode2desc) {
                            console.log('in updatedhtmlstring', ifcode2desc)
                            // Convert the SVG element to its outer HTML
                            svgElement.setAttribute('name', codename); // Add this line to set the name attribute
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

                            // Add the svgHTML to the reusable element list with codename
                            window.parent.postMessage({ type: 'UPDATE_REUSEABLE', codename: codename, codetext: svgHTML }, '*');

                            if(ifcode2desc){
                              // Add the svgHTML to the reusable element list with codename
                              console.log('need code2desc')
                              window.parent.postMessage({ type: 'CODE2DESC', code: this.backendhtmlString}, '*');
                            }

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
  }, [usercode]);

  return (
    <div ref={containerRef} className="result-viewer" >
      <iframe key={JSON.stringify(usercode)} ref={iframeRef} title="Result Viewer" style={{ width: '100%', height: '100%' }}/>
    </div>
  );
};

export default ResultViewer;
