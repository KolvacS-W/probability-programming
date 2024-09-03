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

const ngrok_url = 'https://5843-34-48-16-227.ngrok-free.app';
const ngrok_url_sonnet = ngrok_url + '/api/message';
//for future use in draw()

const ResultViewer: React.FC<ResultViewerProps> = ({ usercode, backendcode, activeTab, updateBackendHtml, currentVersionId, setVersions, versions, }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // console.log('iframeref', iframeRef)
  const containerRef = useRef<HTMLDivElement>(null);
  var currentreuseableSVGElementList = versions.find(version => version.id === currentVersionId)?.reuseableSVGElementList;
  //console.log('check svglist', currentreuseableSVGElementList)
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

    // //this will be emptied everytime code is run:
    // setVersions(prevVersions => {
    //   const updatedVersions = prevVersions.map(version => {
    //     if (version.id === currentVersionId) {
    //       return { ...version, previousSelectedSVGPieceList: [] };
    //     }
    //     return version;
    //   });

    //   console.log('highlightedSVGPieceList emptied for version:', currentVersionId);
    //   return updatedVersions;
    // });

    const handleIframeMessage = (event: MessageEvent) => {
      
      if (event.data.type === 'UPDATE_HTML') {
        updateBackendHtml(event.data.html); // Update the backend HTML in the React app
        console.log('backendhtml updated to app', event.data.html);
      }
  
      if (event.data.type === 'UPDATE_REUSEABLE') {
        const newElement = {
          codeName: event.data.codename,
          codeText: event.data.codetext,
          selected: false,
        };
  
        // Update the reusable element list and then check the updated list
        setVersions(prevVersions => {
          const updatedVersions = prevVersions.map(version => {
            if (version.id === currentVersionId) {
              const updatedreuseableSVGElementList = version.reuseableSVGElementList.map(element =>
                element.codeName === newElement.codeName ? newElement : element
              );
  
              if (!updatedreuseableSVGElementList.some(element => element.codeName === newElement.codeName)) {
                updatedreuseableSVGElementList.push(newElement);
              }
  
              return { ...version, reuseableSVGElementList: updatedreuseableSVGElementList };
            }
            return version;
          });
  
          // Now check if the `currentreuseableSVGElementList` has been updated correctly
          const currentreuseableSVGElementList = updatedVersions.find(version => version.id === currentVersionId)?.reuseableSVGElementList;
  
          console.log('check currentreuseableSVGElementList', currentreuseableSVGElementList, updatedVersions);
  
          if (currentreuseableSVGElementList && currentreuseableSVGElementList.some(element => element.codeName === event.data.codename)) {
            iframeRef.current.contentWindow.postMessage(
              {
                type: 'UPDATE_REUSEABLE_CONFIRMED',
                codename: event.data.codename,
                reuseableSVGElementList: currentreuseableSVGElementList,
              },
              '*'
            );
            console.log(
              'posted UPDATE_REUSEABLE_CONFIRMED to iframe',
              currentreuseableSVGElementList,
              updatedVersions.find(version => version.id === currentVersionId)?.reuseableSVGElementList
            );
          }
  
          return updatedVersions;
        });
      }

      if (event.data.type === 'EMPTY_SVGPIECE') {
        // Empty the highlightedSVGPieceList of the current version
        setVersions(prevVersions => {
          const updatedVersions = prevVersions.map(version => {
            if (version.id === currentVersionId) {
              return { ...version, highlightedSVGPieceList: [] };
            }
            return version;
          });
  
          console.log('highlightedSVGPieceList emptied for version:', currentVersionId);
          return updatedVersions;
        });
      }

      if (event.data.type === 'REMOVE_SVGPIECE') {
        console.log('removing svg:', event.data.codetext)
        // Remove a specific SVG piece from the highlightedSVGPieceList by matching codeText
        setVersions(prevVersions => {
          const updatedVersions = prevVersions.map(version => {
            if (version.id === currentVersionId) {
              const updatedhighlightedSVGPieceList = version.highlightedSVGPieceList?.filter(
                element => element.codeText !== event.data.codetext
              ) || [];
  
              return { ...version, highlightedSVGPieceList: updatedhighlightedSVGPieceList };
            }
            return version;
          });
          // Now check if the `currenthighlightedSVGPieceList` has been updated correctly
          const currenthighlightedSVGPieceList = updatedVersions.find(version => version.id === currentVersionId)?.highlightedSVGPieceList;
              
          console.log('check currenthighlightedSVGPieceList', currenthighlightedSVGPieceList, updatedVersions);

          return updatedVersions;
        });
        
      }

      if (event.data.type === 'GET_SVGPIECELIST') {
        console.log('GET_SVGPIECELIST returning', versions.find(version => version.id === currentVersionId)?.previousSelectedSVGPieceList)
        const currenthighlightedSVGPieceList = versions.find(version => version.id === currentVersionId)?.previousSelectedSVGPieceList;
        if (currenthighlightedSVGPieceList) {
          iframeRef.current.contentWindow.postMessage(
            {
              type: 'RETURN_SVGPIECELIST',
              currenthighlightedSVGPieceList: currenthighlightedSVGPieceList,
            },
            '*'
          );
          console.log('GET_SVGPIECELIST returned')
        }
      }
  
      if (event.data.type === 'UPDATE_SVGPIECE') {
        console.log('added svg:', event.data.codetext);
        const newElementBaseName = event.data.codename;
        let newElementName = newElementBaseName;
        const newElement = {
          codeName: newElementName,
          codeText: event.data.codetext,
          selected: false,
        };
      
        // Update the reusable SVG piece list and then check the updated list
        setVersions(prevVersions => {
          const updatedVersions = prevVersions.map(version => {
            if (version.id === currentVersionId) {
              const updatedhighlightedSVGPieceList = version.highlightedSVGPieceList?.slice() || [];
              const updatedpreviousSelectedSVGPieceList = version.previousSelectedSVGPieceList ? [...version.previousSelectedSVGPieceList] : []; 
      
              // Check if there are already elements with the same base name
              // the naming index is defined by previousSelectedSVGPieceList, which stores all the elements needed to be modified and not removed when user de-highlight
              const existingElements = updatedpreviousSelectedSVGPieceList.filter(element => element.codeName.startsWith(newElementBaseName));
      
              if (existingElements.length > 0) {
                // Find the biggest index after the underscore in the existing elements
                const maxIndex = existingElements
                  .map(element => {
                    const parts = element.codeName.split('_');
                    return parts.length > 1 ? parseInt(parts[parts.length - 1], 10) : 0;
                  })
                  .reduce((max, current) => Math.max(max, current), -1);
      
                // Set the new codename with the incremented index
                newElementName = `${newElementBaseName}_${maxIndex + 1}`;
                newElement.codeName = newElementName;
              } else {
                // No elements with the same base name, use basename_0
                newElementName = `${newElementBaseName}_0`;
                newElement.codeName = newElementName;
              }
      
              updatedhighlightedSVGPieceList.push(newElement);
              updatedpreviousSelectedSVGPieceList.push(newElement);
      
              return { 
                ...version, 
                highlightedSVGPieceList: updatedhighlightedSVGPieceList, 
                previousSelectedSVGPieceList: updatedpreviousSelectedSVGPieceList 
              };
            }
            return version;
          });
      
          // Now check if the `currenthighlightedSVGPieceList` has been updated correctly
          const currenthighlightedSVGPieceList = updatedVersions.find(version => version.id === currentVersionId)?.previousSelectedSVGPieceList;
      
          console.log('check highlighted SvgPieceList in update', updatedVersions.find(version => version.id === currentVersionId)?.highlightedSVGPieceList);
          console.log('check all previously selected SvgPieceList in update', currenthighlightedSVGPieceList);
      
          return updatedVersions;
        });
      }
      
      
      if (event.data.type === 'CODE2DESC') {
        handleCode2Desc(currentVersionId, event.data.code);
        console.log('code2desc called');
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
                    window.currentreuseableSVGElementList = ${JSON.stringify(currentreuseableSVGElementList)};
                    // Define create_canvas and make it globally accessible
                    window.create_canvas = function create_canvas(canvas_color) {
                        const canvasContainer = document.getElementById('canvasContainer');
                        canvasContainer.style.backgroundColor = canvas_color;
                        return canvasContainer;
                    }

                    // Check if the Generate class has already been defined
                    if (!window.Rule) {
                      class Rule {
                        constructor(prompt = '', useobj = {objname: ''}) {
                          this.ngrok_url_sonnet = '${ngrok_url_sonnet}';
                          this.basic_prompt = prompt;
                          this.useobj = {objname: ''}
                          this.modifyobj = {objname: '', piecenames: [], pieceprompts: []}
                          this.piecenames = [];
                          this.piecenamemodify = [];
                          this.drawQueue = Promise.resolve();
                          console.log('rule created:', prompt);
                        }

                        async draw(coord, canvas, reuseablecodelist, scale = 1) {
                          console.log('object draw called', this.basic_prompt);

                          if (!(this.useobj.objname)){
                            var APIprompt = '';

                            if(this.modifyobj.objname){
                              console.log('modify obj')
                              const codename = this.modifyobj.objname
                              const codelist = window.currentreuseableSVGElementList
                              //const codelist = reuseablecodelist
                              console.log('check codelist in ref', codelist)
                              const existingcode = codelist.find((item) => item.codeName === codename)?.codeText;
                              console.log('draw with ref code:', existingcode)

                              if ((this.modifyobj.piecenames.length)>0) {
                              //get svgpiecelist from react app
                              console.log('modify obj and modify pieces')
                              window.parent.postMessage({ type: 'GET_SVGPIECELIST'}, '*');
                              let currenthighlightedSVGPieceList = []
                              await new Promise((resolve) => {
                                  const messageHandler = (event) => {
                                      if (event.data.type === 'RETURN_SVGPIECELIST') {
                                          console.log('get returned svglist', event.data.currenthighlightedSVGPieceList)
                                          currenthighlightedSVGPieceList = event.data.currenthighlightedSVGPieceList
                                          window.removeEventListener('message', messageHandler);
                                          resolve(); // Resolve the promise to continue execution
                                      }
                                  };
                                  window.addEventListener('message', messageHandler);
                              });



                                  // Create a new list: piececode by getting codeText using this.piecemodify elements as codeName from window.currentreuseablesvgpieces
                                  let piececode = this.modifyobj.piecenames.map(codeName => {
                                      const piece = currenthighlightedSVGPieceList.find(item => item.codeName === codeName);
                                      return piece ? piece.codeText : null;
                                  }).filter(codeText => codeText !== null);

                                  // Initialize the APIprompt
                                  let modifyprompt = '';

                                  // For each element A in piececode and element B in piecemodify, create a prompt
                                  piececode.forEach((codePiece, index) => {
                                      const modification = this.modifyobj.pieceprompts[index];
                                      modifyprompt += \`Make modification:\` +  modification + \` to svg code piece:\` + codePiece+\`. \`;
                                  });
                                  APIprompt = 'Modify an existing svg code: '+existingcode+ ', to create a ' + this.basic_prompt +'. Make these modifications on specific svg elements: ' + modifyprompt +'. Do not include any background in generated svg. Make sure donot include anything other than the svg code in your response.';                                
                              }

                                else{
                                    console.log('useobj, fix code')
                                    APIprompt = 'write me an updated svg code basing on this existing code: '+existingcode+ ' and description: ' + this.basic_prompt + '. If the existing code conforms to the description, return the same code without change; Otherwise, return the code slightly updated according to the existing description. Do not include any background in generated svg. Make sure donot include anything other than the svg code in your response.';
                                }
                              }
                        
                            else{
                              console.log('no existing code')
                              APIprompt = 'write me svg code to create a svg image of ' + this.basic_prompt +'. Make the svg image as detailed as possible and as close to the description as possible. Do not include any background in generated svg. Make sure donot include anything other than the svg code in your response.';
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

                        else{
                            const codelist = window.currentreuseableSVGElementList
                            const codename = this.useobj.objname
                            const existingcode = codelist.find((item) => item.codeName === codename)?.codeText;
                            console.log('draw with fixed code:', existingcode)
                            const content = existingcode;

                            if (content) {
                              const svgElement = this.createSVGElement(content, coord, canvas.offsetWidth, canvas.offsetHeight, scale);
                              canvas.appendChild(svgElement);
                              console.log('svgElement is', svgElement);
                              return svgElement;
                            }                            
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

async generateandDrawObj(name, canvas, coord, scale = 1, ifcode2desc = false) {
  console.log('generateandDrawObj called', ifcode2desc);
  // Define obj at the function scope
  let obj;

  // Add the draw operation to the queue
  this.drawQueue = this.drawQueue.then(async () => {
    const svgElement = await this.draw(coord, canvas.canvasContainer, canvas.reuseablecodelist, scale);
    if (svgElement) {
      console.log('SVG content added to canvasContainer');
      this.updateHTMLString(canvas, svgElement, this.basic_prompt, coord, scale, ifcode2desc); // Pass the codename and code
      const svgHTML = svgElement.outerHTML;
      const codename = name;
    // Send the message to update the reusable element list
    window.parent.postMessage({ type: 'UPDATE_REUSEABLE', codename: codename, codetext: svgHTML }, '*');
    console.log('Sent UPDATE_REUSEABLE message with codename:', codename);

    // Wait for the confirmation after sending the message
    await new Promise((resolve) => {
        const messageHandler = (event) => {
            if (event.data.type === 'UPDATE_REUSEABLE_CONFIRMED' && event.data.codename === codename) {
                window.currentreuseableSVGElementList = event.data.reuseableSVGElementList;
                console.log('Received UPDATE_REUSEABLE_CONFIRMED for codename:', window.currentreuseableSVGElementList);
                window.removeEventListener('message', messageHandler);
                resolve(); // Resolve the promise to continue execution
            }
        };
        window.addEventListener('message', messageHandler);
    });
      
      obj = {objname: codename, rule: this}
      console.log('returning obj:', obj.objname, obj.rule)
      return obj; // Return the codename
    }
  }).catch(error => {
    console.error('Error in canvas draw sequence:', error);
  });
  
  return this.drawQueue.then(() => obj); // Ensure the codename is returned
}

updateHTMLString(canvas, svgElement, codename, coord, scale, ifcode2desc) {
  console.log('in updatedhtmlstring', ifcode2desc)
  // Convert the SVG element to its outer HTML
  svgElement.setAttribute('name', codename); // Add this line to set the name attribute
  const svgHTML = svgElement.outerHTML;
  //console.log('svgHtml:', svgElement, svgHTML);

  // Construct the div containing the SVG element with positioning
  const positionedSvgHTML = \`<div>\`
      +svgHTML+
  \`</div>\`;

  // Update backendhtmlString by appending the new positioned SVG's HTML
  canvas.backendhtmlString = canvas.backendhtmlString.replace('</body>', positionedSvgHTML + '</body>');

  // Post the updated HTML back to the parent component
  window.parent.postMessage({ type: 'UPDATE_HTML', html: canvas.backendhtmlString }, '*');

  //console.log("updateHTMLString with positioned SVG:", positionedSvgHTML);

  if(ifcode2desc){
    // Add the svgHTML to the reusable element list with codename
    console.log('need code2desc')
    window.parent.postMessage({ type: 'CODE2DESC', code: canvas.backendhtmlString}, '*');
  }

}

                        //end of class 
                      }

                      // Assign the class to the global window object
                      window.Rule = Rule;
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
                      }  
                      window.whole_canvas = whole_canvas;
                    }
                    (function() {
                      // Automatically wrap the user code in an async function
                      (async function() {
                        ${usercode.js}
                      })();
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
