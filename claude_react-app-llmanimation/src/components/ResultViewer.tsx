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

const ngrok_url = 'https://772b-35-231-127-253.ngrok-free.app';
const ngrok_url_sonnet = ngrok_url + '/api/message';
//for future use in draw()

const ResultViewer: React.FC<ResultViewerProps> = ({ usercode, backendcode, activeTab, updateBackendHtml, currentVersionId, setVersions, versions, }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // console.log('iframeref', iframeRef)
  const containerRef = useRef<HTMLDivElement>(null);
  var currentreuseableSVGElementList = versions.find(version => version.id === currentVersionId)?.reuseableSVGElementList;
  //console.log('check svglist', currentreuseableSVGElementList)
  const [clickCoordinates, setClickCoordinates] = useState<{ x: number; y: number } | null>(null);

// Global object to store previous user-defined objects
// const cachedobjects = {};

// Utility to filter out uncloneable types (Promise, function, etc.)
// Replace Promises with the string 'promise'

const clearSessionStorage = () => {
  console.log('Clearing sessionStorage on refresh');
  sessionStorage.clear(); // Clear all session storage data
};



// function replaceUncloneableEntries(obj) {
//   const cloneableObj = {};

//   for (const key in obj) {
//     if (Object.prototype.hasOwnProperty.call(obj, key)) {
//       const value = obj[key];
//       console.log('value need to save', value)
//       if (typeof value === 'function') {
//         console.warn(`Skipping function value: ${key}`);
//       } else if (value instanceof Promise) {
//         cloneableObj[key] = 'promise'; // Replace Promises with the string 'promise'
//       } else {
//         cloneableObj[key] = value;
//       }
//     }
//   }

//   return cloneableObj;
// }

// Helper function to serialize objects with their class type
// Helper function to serialize objects with their class type
// function serializeForStorage(obj) {
//   if (obj === null || typeof obj !== 'object') return obj;

//   const cloneableObj = Array.isArray(obj) ? [] : { ...obj, __class__: obj.constructor.name };

//   for (const key in obj) {
//     if (Object.prototype.hasOwnProperty.call(obj, key)) {
//       const value = obj[key];
//       if (typeof value === 'function') {
//         console.warn(`Skipping function value: ${key}`);
//       } else if (value instanceof Promise) {
//         cloneableObj[key] = 'promise'; // Replace Promises with the string 'promise'
//       } else {
//         cloneableObj[key] = serializeForStorage(value); // Recursively serialize
//       }
//     }
//   }

//   return cloneableObj;
// }

// Helper function to deserialize objects, restoring them to their original class
// Deserialize objects by referring to their classinfo property
// function recoverClassFromClassInfo(data) {
//   if (data === null || typeof data !== 'object') return data;

//   // Handle arrays recursively
//   if (Array.isArray(data)) {
//     return data.map(item => recoverClassFromClassInfo(item));
//   }

//   if (data.classinfo) {
//     // Check the classinfo property and restore the corresponding class
//     switch (data.classinfo) {
//       case 'Rule':
//         return Object.assign(new Rule(), data);
//       case 'GeneratedObject':
//         return Object.assign(new GeneratedObject(), data);
//       case 'ObjectTemplate':
//         return Object.assign(new ObjectTemplate(), data);
//       case 'whole_canvas':
//         return Object.assign(new whole_canvas(), data);
//       default:
//         break;
//     }
//   }

//   // Recursively process the object properties
//   for (const key in data) {
//     if (data.hasOwnProperty(key) && typeof data[key] === 'object') {
//       data[key] = recoverClassFromClassInfo(data[key]);
//     }
//   }

//   return data;
// }

// Modify sendcachedobjectsToIframe to deserialize objects when loading from storage
// Load cachedobjects from sessionStorage and recover class instances
const sendcachedobjectsToIframe = () => {
  if (iframeRef.current?.contentWindow) {
    const storedObjects = sessionStorage.getItem('cachedobjects');
    if (storedObjects) {
      const recoveredObjects = (JSON.parse(storedObjects)); // Recover class instances
      console.log('Recovered cachedobjects from storage:', recoveredObjects);
      iframeRef.current.contentWindow.postMessage({
        type: 'SYNC_PREVIOUS_OBJECTS_REF',
        cachedobjects: recoveredObjects, // Send the recovered objects
      }, '*');
    } else {
      iframeRef.current.contentWindow.postMessage({
        type: 'SYNC_PREVIOUS_OBJECTS_REF',
        cachedobjects: {}, // Send an empty object if no stored objects
      }, '*');
    }
  }
};




// Modify savecachedobjects to serialize objects before saving
function savecachedobjects(content) {
  const serializedContent = (content); // Serialize the content
  console.log('Serialized cachedobjects for saving:', serializedContent);
  sessionStorage.setItem('cachedobjects', JSON.stringify(serializedContent)); // Save to sessionStorage
}




// Function to load cachedobjects from sessionStorage
// function loadcachedobjects() {
//   const storedObjects = sessionStorage.getItem('cachedobjects');
//   console.log('loadcachedobjects', storedObjects, storedObjects !== 'undefined')
//   if (storedObjects !== 'undefined') {
//     Object.assign(cachedobjects, JSON.parse(storedObjects));
//     console.log('Loaded cachedobjects:', cachedobjects);
//   } else {
//     console.warn('No stored cachedobjects found in sessionStorage.');
//   }

//   // Always post the CACHEDOBJECT_LOADED message, whether cachedobjects were found or not
//   iframeRef.current.contentWindow.postMessage({ type: 'CACHEDOBJECT_LOADED' }, '*');
//   console.log('sent CACHEDOBJECT_LOADED');
// }




  useEffect(() => {
    console.log('useeffect1 called')
    // Clear sessionStorage on app refresh
    window.addEventListener('beforeunload', clearSessionStorage);

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

        // NEW: Handle saving cachedobjects to sessionStorage
  if (event.data.type === 'SAVE_CACHEDOBJECTS') {
    // console.log('Saving window object', event.data.content.dog1.constructor.name);
    savecachedobjects(event.data.content);
  }

  // NEW: Handle loading cachedobjects from sessionStorage
  if (event.data.type === 'LOAD_CACHEDOBJECT') {
    console.log('Loading window object');
    // loadcachedobjects();
    sendcachedobjectsToIframe();
  }
  //to log cachedobjects in version, for usage in widgets
  if (event.data.type === 'LOG_CACHEDOBJECTS') {
    setVersions(prevVersions => {
      const updatedVersions = prevVersions.map(version => {
        if (version.id === currentVersionId) {
          return { ...version, cachedobjectslog: event.data.content  };
        }
        return version;
      });

      console.log('logging cachedobjects into version version:', currentVersionId);
      return updatedVersions;
    });
  }

  
      
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
                        constructor(arg1 = '', arg2 = {}) {
                                    // If the first argument is a string, treat it as the prompt
        if (typeof arg1 === 'string') {
            this.basic_prompt = arg1;
            this.useobj = arg2.useobj || {objname: ''}; // Handle useobj if passed as second argument
        } 
        // If the first argument is an object, handle named parameters
        else if (typeof arg1 === 'object') {
            this.basic_prompt = arg1.prompt || '';
            this.useobj = arg1.useobj || {objname: ''};
        }                          this.ngrok_url_sonnet = '${ngrok_url_sonnet}';
                          // this.basic_prompt = prompt;
                          // this.useobj = {objname: ''}
                          this.modifyobj = {objname: '', piecenames: [], pieceprompts: []}
                          this.piecenames = [];
                          this.piecenamemodify = [];
                          this.parameters = [];
                          // this.drawQueue = Promise.resolve();
                          console.log('rule created:', prompt);
                        }

async draw() {
  console.log('object draw called', this.basic_prompt);

  if (!(this.useobj.objname)){
    var APIprompt = '';

    if(this.modifyobj.objname){
      console.log('modify obj')
      const codename = this.modifyobj.objname
      const codelist = window.currentreuseableSVGElementList
      console.log('check codelist in ref', codelist)
      var existingcode = codelist.find((item) => item.codeName === codename)?.codeText;
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

          //have params
          if(this.parameters.length >0){
          existingcode = window.cachedobjects[codename].template.templatecode
            APIprompt = \`you are giving an svg template code generated by this rule: write me svg code to create a svg image of \` + this.basic_prompt +\`. Make the svg image as detailed as possible and as close to the description as possible.  
        Furthermore, process the generated svg code into a svg code template, with the given a list of parameter names, make the returned svg code a template with certain parameters as text placeholders made by {parameter name}. 
        For example, parameter list: roof height, window color; resulting svg template:
        <svg viewBox="0 0 200 200">
        <rect x="50" y="70" width="100" height="80" fill="brown" /> <!-- House body -->
        <polygon points="50,70 100,{roof height} 150,70" fill="red" /> <!-- Roof -->
        <rect x="65" y="90" width="20" height="20" fill="{window color}" /> <!-- Window 1 -->
        <rect x="115" y="90" width="20" height="20" fill="{window color}" /> <!-- Window 2 -->
        <rect x="90" y="120" width="20" height="30" fill="black" /> <!-- Door -->
        </svg>.
        
        Notice that only one parameter name and nothing else can be inside {}. Replace the whole parameter (e.g., fill = "#e0d0c0" to fill = "{parameter name}") instead of just part of it (e.g., fill = "#e0d0c0" to fill = "#{parameter name}"). Return svg code template for this parameter list:\` + this.parameters.join(', ')+\`. Do not include any background in generated svg. 
        The svg code template must be able to satify the requirements of the parameters by simply replacing the placeholders, instead of other manual modifications (e.g., 'window number' can be modified by simply replacing {window number} to some data, instead of needing to repeat window element manually)
        Make sure donot include anything other than the final svg code template in your response.
        This is the svg template code generated by the above rule: \`+ existingcode
      
        +\`Now, you are going to make these modifications to the given svg template: \`+ modifyprompt +\`
        As long as the svg follows the description, make as little change as possible other than the specific svg elements mentioned above. Make no changes to the placeholder part. Make sure donot include anything other than the svg template code in your response
        \`
          }
          //no params
          else{
            APIprompt = 'Modify an existing svg code: '+existingcode+ ', to create a ' + this.basic_prompt +'. Make these modifications on specific svg elements: ' + modifyprompt +'. Do not include any background in generated svg. As long as the svg follows the description, make as little change as possible other than the specific svg elements mentioned above. Make sure donot include anything other than the svg code in your response.';                                
          }
      }

        else{
            console.log('modifyobj-no piece')
            //have params
            if(this.parameters.length >0){
          existingcode = window.cachedobjects[codename].template.templatecode
            APIprompt = \`you are giving an svg template code generated by this rule: write me svg code to create a svg image of \` + this.basic_prompt +\`. Make the svg image as detailed as possible and as close to the description as possible.  
        Furthermore, process the generated svg code into a svg code template, with the given a list of parameter names, make the returned svg code a template with certain parameters as text placeholders made by {parameter name}. 
        For example, parameter list: roof height, window color; resulting svg template:
        <svg viewBox="0 0 200 200">
        <rect x="50" y="70" width="100" height="80" fill="brown" /> <!-- House body -->
        <polygon points="50,70 100,{roof height} 150,70" fill="red" /> <!-- Roof -->
        <rect x="65" y="90" width="20" height="20" fill="{window color}" /> <!-- Window 1 -->
        <rect x="115" y="90" width="20" height="20" fill="{window color}" /> <!-- Window 2 -->
        <rect x="90" y="120" width="20" height="30" fill="black" /> <!-- Door -->
        </svg>.
        
        Notice that only one parameter name and nothing else can be inside {}. Replace the whole parameter (e.g., fill = "#e0d0c0" to fill = "{parameter name}") instead of just part of it (e.g., fill = "#e0d0c0" to fill = "#{parameter name}"). Return svg code template for this parameter list:\` + this.parameters.join(', ')+\`. Do not include any background in generated svg. 
        The svg code template must be able to satify the requirements of the parameters by simply replacing the placeholders, instead of other manual modifications (e.g., 'window number' can be modified by simply replacing {window number} to some data, instead of needing to repeat window element manually)
        Make sure donot include anything other than the final svg code template in your response.
        This is the svg template code generated by the above rule: \`+ existingcode
      
        +\`Now, you are going to give me an updated svg template with the above given svg template basing on description: \`+ this.basic_prompt +
        \`As long as the svg follows the description, make as little change as possible. Make no changes to the placeholder part. Make sure donot include anything other than the svg template code in your response
        \`
          }
            //no params
            else{
              APIprompt = 'write me an updated svg code basing on this existing code: '+existingcode+ ' and description: ' + this.basic_prompt + '. If the existing code conforms to the description, return the same code without change; Otherwise, return the code slightly updated according to the existing description. Do not include any background in generated svg. Make sure donot include anything other than the svg code in your response.';

            }
       }
      }

    else{
      console.log('no existing code', this.parameters)
      if(this.parameters.length >0){
        APIprompt = \`write me svg code to create a svg image of \` + this.basic_prompt +\`. Make the svg image as detailed as possible and as close to the description as possible.  
        Furthermore, process the generated svg code into a svg code template, with the given a list of parameter names, make the returned svg code a template with certain parameters as text placeholders made by {parameter name}. 
        For example, parameter list: roof height, window color; resulting svg template:
        <svg viewBox="0 0 200 200">
        <rect x="50" y="70" width="100" height="80" fill="brown" /> <!-- House body -->
        <polygon points="50,70 100,{roof height} 150,70" fill="red" /> <!-- Roof -->
        <rect x="65" y="90" width="20" height="20" fill="{window color}" /> <!-- Window 1 -->
        <rect x="115" y="90" width="20" height="20" fill="{window color}" /> <!-- Window 2 -->
        <rect x="90" y="120" width="20" height="30" fill="black" /> <!-- Door -->
        </svg>.
        
        Notice that only one parameter name and nothing else can be inside {}. Replace the whole parameter (e.g., fill = "#e0d0c0" to fill = "{parameter name}") instead of just part of it (e.g., fill = "#e0d0c0" to fill = "#{parameter name}"). Return svg code template for this parameter list:\` + this.parameters.join(', ')+\`. Do not include any background in generated svg. 
        The svg code template must be able to satify the requirements of the parameters by simply replacing the placeholders, instead of other manual modifications (e.g., 'window number' can be modified by simply replacing {window number} to some data, instead of needing to repeat window element manually)
        Make sure donot include anything other than the final svg code template in your response.\`;
      }
      else{
        APIprompt = 'write me svg code to create a svg image of ' + this.basic_prompt +'. Make the svg image as detailed as possible and as close to the description as possible. Do not include any background in generated svg. Make sure donot include anything other than the svg code in your response.';
      }
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
        // const svgElement = this.createSVGElement(content, coord, canvas.offsetWidth, canvas.offsetHeight, scale);
        // canvas.appendChild(svgElement);
        // console.log('svgElement is', svgElement);
        // return svgElement;
        return content
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
      // const svgElement = this.createSVGElement(content, coord, canvas.offsetWidth, canvas.offsetHeight, scale);
      // canvas.appendChild(svgElement);
      // console.log('svgElement is', svgElement);
      // return svgElement;
      return content
    }                            
  }                          
}

async generateObj(name, parameterContents = []) {
let obj;

// Add the draw operation to the queue
// this.drawQueue = this.drawQueue.then(async () => {
  var svgElement;
  var svgHTML;
  var svgHTMLtemplate;
  // const coord = null;
  if(parameterContents.length >0){
    // need to parameterize
    const parameters = this.parameters;
  
    // Replace the placeholders in the SVG string with actual parameter contents
    svgHTML = await this.draw();
    // const svgString = svgElement.outerHTML;

    svgHTMLtemplate = svgHTML

    parameters.forEach((param, index) => {
        const placeholder = '{' + param + '}';
        svgHTML = svgHTML.replace(new RegExp(placeholder, 'g'), parameterContents[index]);
    });

    console.log('have param', svgHTML)

  }
  else{
    //no parameter needed
    svgHTML = await this.draw();
    console.log('no param', svgHTML)
  }
  
  if (svgHTML) {
    //const svgHTML = svgElement.outerHTML;
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
    
    obj = new GeneratedObject(codename, svgHTML, svgHTMLtemplate, this)
    console.log('returning obj:', obj)
    return obj; // Return the codename
  }
// }).catch(error => {
//   console.error('Error in canvas draw sequence:', error);
// });

// return this.drawQueue.then(() => obj); // Ensure the codename is returned

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

                    //another class
                    if (!window.GeneratedObject) {
                      class GeneratedObject {
                            constructor(objname, svgcode, templatecode, rule) {
                              this.objname = objname
                              this.svgcode = svgcode
                              this.template = new ObjectTemplate(templatecode, rule)
                              this.rule = rule

                              // Automatically save the generated object into cachedobjects using codename
                              window.cachedobjects[objname] = this;
                            }
// priority: tl..br + scale first, if conflict, drop scale; coord last                            
placeObj(canvas, coord = { x: 50, y: 50 }, scale = 1, tl = null, tr = null, bl = null, br = null) {
    const content = this.svgcode;
    const svgElement = this.createSVGElement(
        content,
        coord,
        canvas.canvasContainer.offsetWidth,
        canvas.canvasContainer.offsetHeight,
        scale,
        tl,
        tr,
        bl,
        br
    );
    console.log(
        'svgelement placing',
        coord,
        canvas.canvasContainer.offsetWidth,
        canvas.canvasContainer.offsetHeight,
        scale,
        svgElement
    );
    canvas.canvasContainer.appendChild(svgElement);
}

createSVGElement(
    svgContent,
    coord = { x: 50, y: 50 },
    canvasWidth,
    canvasHeight,
    scale = 1,
    tl = null,
    tr = null,
    bl = null,
    br = null
) {
    const svgWrapper = document.createElement('div');
    svgWrapper.innerHTML = svgContent.trim();
    const svgElement = svgWrapper.firstElementChild;

    // Get the original dimensions of the SVG
    const viewBox = svgElement.viewBox.baseVal;
    const originalWidth = viewBox.width;
    const originalHeight = viewBox.height;

    // Functions to convert percentage to pixels
    const percentToPixelX = (percent) => (canvasWidth * percent) / 100;
    const percentToPixelY = (percent) => (canvasHeight * percent) / 100;

    // Collect specified corners
    const srcPts = [];
    const dstPts = [];

    // Map corners to source and destination points
    if (tl) {
        srcPts.push([0, 0]); // top-left corner of SVG
        dstPts.push([percentToPixelX(tl.x), percentToPixelY(tl.y)]);
    }
    if (tr) {
        srcPts.push([originalWidth, 0]); // top-right corner of SVG
        dstPts.push([percentToPixelX(tr.x), percentToPixelY(tr.y)]);
    }
    if (bl) {
        srcPts.push([0, originalHeight]); // bottom-left corner of SVG
        dstPts.push([percentToPixelX(bl.x), percentToPixelY(bl.y)]);
    }
    if (br) {
        srcPts.push([originalWidth, originalHeight]); // bottom-right corner of SVG
        dstPts.push([percentToPixelX(br.x), percentToPixelY(br.y)]);
    }

    if (srcPts.length > 0) {
        // Attempt to satisfy scale along with the specified corners
        let matrix;
        let scaleApplied = true;

        if (srcPts.length === 1) {
            // One corner specified
            // Apply scale and position the SVG at the specified corner
            const [dstX, dstY] = dstPts[0];
            const scaledWidth = originalWidth * scale;
            const scaledHeight = originalHeight * scale;

            // Adjust position based on the specified corner
            let translateX = dstX;
            let translateY = dstY;

            if (tl) {
                // No adjustment needed
            } else if (tr) {
                translateX -= scaledWidth;
            } else if (bl) {
                translateY -= scaledHeight;
            } else if (br) {
                translateX -= scaledWidth;
                translateY -= scaledHeight;
            }

            svgElement.style.position = 'absolute';
            svgElement.style.left = \`\${translateX}px\`;
            svgElement.style.top = \`\${translateY}px\`;
            svgElement.style.width = \`\${scaledWidth}px\`;
            svgElement.style.height = \`\${scaledHeight}px\`;
            svgElement.style.transform = ''; // No additional transform needed
        } else if (srcPts.length >= 2) {
            // Two or more corners specified
            // Calculate the transformation matrix including scale

            // First, compute the scaling factors implied by the specified corners
            // and compare them with the provided scale

            // Compute distances in source and destination
            const srcDistances = [];
            const dstDistances = [];

            for (let i = 0; i < srcPts.length - 1; i++) {
                for (let j = i + 1; j < srcPts.length; j++) {
                    const srcDx = srcPts[j][0] - srcPts[i][0];
                    const srcDy = srcPts[j][1] - srcPts[i][1];
                    const srcDistance = Math.hypot(srcDx, srcDy);
                    srcDistances.push(srcDistance);

                    const dstDx = dstPts[j][0] - dstPts[i][0];
                    const dstDy = dstPts[j][1] - dstPts[i][1];
                    const dstDistance = Math.hypot(dstDx, dstDy);
                    dstDistances.push(dstDistance);
                }
            }

            // Compute average scaling factor from specified corners
            let impliedScale = 0;
            let scaleCount = 0;
            for (let i = 0; i < srcDistances.length; i++) {
                if (srcDistances[i] !== 0) {
                    impliedScale += dstDistances[i] / srcDistances[i];
                    scaleCount++;
                }
            }
            if (scaleCount > 0) {
                impliedScale /= scaleCount;
            } else {
                impliedScale = scale;
            }

            // Compare implied scale with provided scale
            if (Math.abs(impliedScale - scale) > 0.01) {
                // Scale is in conflict, discard provided scale
                scaleApplied = false;
                scale = impliedScale;
            }

            // Recalculate destination points considering the scale
            const scaledSrcPts = srcPts.map(([x, y]) => [x * scale, y * scale]);

            if (srcPts.length === 2) {
                // Compute similarity transformation
                matrix = this.calculateSimilarityTransform(scaledSrcPts, dstPts);
            } else if (srcPts.length === 3) {
                // Compute affine transformation
                matrix = this.calculateAffineTransform(scaledSrcPts, dstPts);
            } else if (srcPts.length === 4) {
                // Compute projective transformation
                matrix = this.calculateProjectiveTransform(scaledSrcPts, dstPts);
            }

            svgElement.style.position = 'absolute';
            svgElement.style.left = '0px';
            svgElement.style.top = '0px';
            svgElement.style.transformOrigin = '0 0';
            svgElement.style.transform = \`matrix3d(\${matrix.join(',')})\`;
            svgElement.style.width = \`\${originalWidth * scale}px\`;
            svgElement.style.height = \`\${originalHeight * scale}px\`;
        }
    } else {
        // No corners specified, use coord and scale
        const scaledWidth = originalWidth * scale;
        const scaledHeight = originalHeight * scale;

        let leftPixel, topPixel, transform;

        if (coord) {
            leftPixel = percentToPixelX(coord.x);
            topPixel = percentToPixelY(coord.y);
            transform = 'translate(-50%, -50%)';
        } else {
            leftPixel = canvasWidth / 2;
            topPixel = canvasHeight / 2;
            transform = 'translate(-50%, -50%)';
        }

        svgElement.style.position = 'absolute';
        svgElement.style.left = \`\${leftPixel}px\`;
        svgElement.style.top = \`\${topPixel}px\`;
        svgElement.style.width = \`\${scaledWidth}px\`;
        svgElement.style.height = \`\${scaledHeight}px\`;
        svgElement.style.transform = transform;
    }

    return svgElement;
}

// Helper functions remain the same but with slight modifications

calculateSimilarityTransform(srcPts, dstPts, scale) {
  // srcPts and dstPts are arrays of 2D points: [[x1, y1], [x2, y2]]

  const [x0, y0] = srcPts[0];
  const [x1, y1] = srcPts[1];
  const [X0, Y0] = dstPts[0];
  const [X1, Y1] = dstPts[1];

  // Source vector
  const dx1 = x1 - x0;
  const dy1 = y1 - y0;
  const srcLength = Math.hypot(dx1, dy1);

  // Destination vector
  const dx2 = X1 - X0;
  const dy2 = Y1 - Y0;
  const dstLength = Math.hypot(dx2, dy2);

  if (srcLength === 0 || dstLength === 0) {
    console.error('Cannot compute similarity transform with zero-length vectors.');
    return null;
  }

  // Compute scaling factor
  const impliedScale = dstLength / srcLength;

  // Compare implied scale with provided scale
  const usedScale = Math.abs(impliedScale - scale) < 0.01 ? scale : impliedScale;

  // Recalculate source points considering the used scale
  const scaledX0 = x0 * usedScale;
  const scaledY0 = y0 * usedScale;
  const scaledX1 = x1 * usedScale;
  const scaledY1 = y1 * usedScale;

  // Compute rotation angle
  const angle1 = Math.atan2(dy1, dx1);
  const angle2 = Math.atan2(dy2, dx2);
  const angle = angle2 - angle1;

  // Compute rotation matrix components
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  // Compute translation
  const tx = X0 - (scaledX0 * cosA - scaledY0 * sinA);
  const ty = Y0 - (scaledX0 * sinA + scaledY0 * cosA);

  // Construct the transformation matrix
  const matrix = [
    cosA * usedScale, sinA * usedScale, 0, 0,
    -sinA * usedScale, cosA * usedScale, 0, 0,
    0, 0, 1, 0,
    tx, ty, 0, 1
  ];

  return matrix;
}


                      }  
                      window.GeneratedObject = GeneratedObject;
                    }
                    //another class
                    if (!window.ObjectTemplate) {
                      class ObjectTemplate {
                            constructor(templatecode, rule) {
                              this.templatecode = templatecode
                              this.rule = rule
                            }
                            async createObj(name, parameterContents = []){
                                var obj;
                                // need to parameterize
                                const parameters = this.rule.parameters;
                              
                                // Replace the placeholders in the SVG string with actual parameter contents
                                var svgHTML = this.templatecode
                                // const svgString = svgElement.outerHTML;

                                parameters.forEach((param, index) => {
                                    const placeholder = '{' + param + '}';
                                    svgHTML = svgHTML.replace(new RegExp(placeholder, 'g'), parameterContents[index]);
                                });

                                //save the new obj to app
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
                                //create obj instance
                                //console.log('creating obj in template.createobj', this.rule)
                                obj = new GeneratedObject(name, svgHTML, this.templatecode, this.rule)
                                //console.log('returning obj:', obj)
                                return obj; // Return the codename
                            }
                      }  
                      window.ObjectTemplate = ObjectTemplate;
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
                    window.parent.postMessage({ type: 'LOAD_CACHEDOBJECT' }, '*');




function recoverClassFromClassInfo(data) {
  if (data === null || typeof data !== 'object') return data;

  // Handle arrays that were mistakenly serialized as objects with numbered keys
  if (isSerializedArray(data)) {
    return Object.values(data);
  }

  // Handle arrays recursively
  if (Array.isArray(data)) {
    return data.map(item => recoverClassFromClassInfo(item));
  }

  if (data.classinfo) {
    // Log to see the recovery of classinfo
    console.log('Recovering', data.classinfo);

    // Check the classinfo property and restore the corresponding class
    let recoveredInstance;
    switch (data.classinfo) {
      case 'Rule': {
        recoveredInstance = new Rule();
        Object.assign(recoveredInstance, data);
        break;
      }
      case 'GeneratedObject': {
        const { objname = '', svgcode = '', templatecode = '', rule = {} } = data;
        const template = recoverClassFromClassInfo(data.template); // Recover the template properly
        const ruleInstance = recoverClassFromClassInfo(rule); // Recover the rule as well
        recoveredInstance = new GeneratedObject(objname, svgcode, template.templatecode, ruleInstance);
        Object.assign(recoveredInstance, data); // Assign any additional properties
        break;
      }
      case 'ObjectTemplate': {
        console.log('ObjectTemplate, data:', data);
        const { templatecode = '', rule = {} } = data;
        const ruleInstance = recoverClassFromClassInfo(rule); // Recover the rule object
        recoveredInstance = new ObjectTemplate(templatecode, ruleInstance);
        Object.assign(recoveredInstance, data); // Assign additional properties if any
        break;
      }
      case 'whole_canvas': {
        const canvas = new whole_canvas(data.canvas_color || '#FFFFFF');
        Object.assign(canvas, data);
        recoveredInstance = canvas;
        break;
      }
      default:
        recoveredInstance = data; // If no matching class, return the data as-is
        break;
    }

    // Remove the classinfo field after the object is recovered
    delete recoveredInstance.classinfo;

    // Recursively recover subobjects
    for (const key in recoveredInstance) {
      if (recoveredInstance.hasOwnProperty(key) && typeof recoveredInstance[key] === 'object') {
        recoveredInstance[key] = recoverClassFromClassInfo(recoveredInstance[key]);
      }
    }

    return recoveredInstance;
  }

  // If no classinfo is found, continue recursively recovering properties
  for (const key in data) {
    if (data.hasOwnProperty(key) && typeof data[key] === 'object') {
      data[key] = recoverClassFromClassInfo(data[key]);
    }
  }

  return data;
}

// Helper function to check if an object was serialized as an array
function isSerializedArray(obj) {
  if (typeof obj !== 'object' || obj === null) return false;

  // Check if all keys are sequential numbers starting from 0
  const keys = Object.keys(obj);
  return keys.every((key, index) => Number(key) === index);
}




                    // No timeout, keep waiting for CACHEDOBJECT_LOADED indefinitely before executing user.js
(async function () {
  console.log('Waiting for CACHEDOBJECT_LOADED event...');
  
  window.cachedobjects = {}; // Declare as a reference to be assigned

  // Wait for the cachedobjectsRef to be provided by the parent (React app)
  await new Promise((resolve) => {
    const messageHandler = (event) => {
      if (event.data.type === 'SYNC_PREVIOUS_OBJECTS_REF') {
        console.log('Received cachedobjectsRef from parent:', event.data.cachedobjects);
        if(event.data.cachedobjects){
                window.cachedobjects = recoverClassFromClassInfo(event.data.cachedobjects); // Directly assign the deserialized reference
        }
        resolve();
      }
    };

    // Keep listening for the CACHEDOBJECT_LOADED event
    window.addEventListener('message', messageHandler);
  });

  // Function to replace promises with the string 'promise'
// Function to replace promises with the string 'promise', while preserving class names
// Function to replace promises with 'promise', while preserving class names
// function replacePromisesInObject(obj) {
//   if (obj === null || typeof obj !== 'object') return obj;

//   const clonedObject = Array.isArray(obj) ? [] : { ...obj, __class__: obj.constructor.name };
//   console.log('sending cachedobjects to window 3', clonedObject.dog1.constructor.name)
//   for (const key in obj) {
//     if (obj.hasOwnProperty(key)) {
//       if (obj[key] instanceof Promise) {
//         clonedObject[key] = 'promise';  // Replace Promises with the string 'promise'
//       } else if (typeof obj[key] === 'object' && obj[key] !== null) {
//         // Recursively replace promises in nested objects
//         clonedObject[key] = replacePromisesInObject(obj[key]);
//       } else {
//         clonedObject[key] = obj[key];
//       }
//     }
//   }
//   console.log('sending cachedobjects to window 4', clonedObject.dog1.constructor.name)  

//   return clonedObject;
// }



  // // Post cachedobjects to parent for saving to cachedobjectslog
  // window.parent.postMessage({ type: 'LOG_CACHEDOBJECTS', content: window.cachedobjects }, '*');


//   // Execute user.js only after CACHEDOBJECT_LOADED is received
  console.log('Executing user.js');
  ${usercode.js} // Inject user-provided JS

// console.log('sending cachedobjects to window', window.cachedobjects.dog1.constructor.name)

// Replace promises with the string 'promise' before saving
//const cleanedCachedObjects = replacePromisesInObject(window.cachedobjects);

//console.log('sending cachedobjects to window 2', cleanedCachedObjects.dog1.constructor.name)

// Add a classinfo property to each object for serialization
function addClassInfo(obj) {
  if (obj === null || typeof obj !== 'object') return obj;

  // Clone the object and add the classinfo property
  const objectWithClassInfo = { ...obj, classinfo: obj.constructor.name };

  // Recursively process object properties
  for (const key in objectWithClassInfo) {
    if (objectWithClassInfo.hasOwnProperty(key) && typeof objectWithClassInfo[key] === 'object') {
      objectWithClassInfo[key] = addClassInfo(objectWithClassInfo[key]);
    }
  }

  return objectWithClassInfo;
}


  // Serialize cachedobjects with class info before sending to the parent
const cachedObjectsWithClassInfo = addClassInfo(window.cachedobjects);

  console.log('check cachedObjectsWithClassInfo', cachedObjectsWithClassInfo)

  // Send serialized cached objects back to the parent window
  window.parent.postMessage({ type: 'SAVE_CACHEDOBJECTS', content: cachedObjectsWithClassInfo }, '*');
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