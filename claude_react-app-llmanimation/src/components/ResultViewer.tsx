import React, { useEffect, useRef, useState } from 'react';
import { Version, KeywordTree } from '../types';
import axios from 'axios';

interface ResultViewerProps {
  ngrok_url_sonnet: string;
  usercode: {
    js: string;
  };
  backendcode: {
    html: string;
  };
  classcode: {
    js: string;
  };
  iframeRef: React.RefObject<HTMLIFrameElement>;
  activeTab: string;
  updateBackendHtml: (newHtml: string) => void;

  currentVersionId: string | null;
  setVersions: React.Dispatch<React.SetStateAction<Version[]>>;
  versions: Version[];
}

// const ngrok_url = 'https://82b7-34-46-65-154.ngrok-free.app';
// const ngrok_url_sonnet = ngrok_url + '/api/message';
// //for future use in draw()

const ResultViewer: React.FC<ResultViewerProps> = ({ ngrok_url_sonnet, usercode, backendcode, classcode, activeTab, updateBackendHtml, currentVersionId, setVersions, versions, iframeRef}) => {
  // const iframeRef = useRef<HTMLIFrameElement>(null);
  // console.log('iframeref', iframeRef)
  const containerRef = useRef<HTMLDivElement>(null);
  var currentreuseableSVGElementList = versions.find(version => version.id === currentVersionId)?.reuseableSVGElementList;
  //console.log('check svglist', currentreuseableSVGElementList)
  const [clickCoordinates, setClickCoordinates] = useState<{ x: number; y: number } | null>(null);
  const [classCodeLoaded, setClassCodeLoaded] = useState<boolean>(false);
  // const [newobjID, setNewobjID] = useState(1); // Initialize the newobjID state starting from 1
  const versionsRef = useRef(versions); // Create a ref for versions

  useEffect(() => {
    versionsRef.current = versions; // Update the ref whenever versions change
  }, [versions]);
  // Refs to hold previous trigger values
// Global object to store previous user-defined objects
// const cachedobjects = {};

// Utility to filter out uncloneable types (Promise, function, etc.)
// Replace Promises with the string 'promise'

const clearSessionStorage = () => {
  console.log('Clearing sessionStorage on refresh');
  sessionStorage.clear(); // Clear all session storage data
};

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


    

  },  []);
  const handleIframeLoad = () => {
    console.log('handleIframeLoad called')
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


if (event.data.type === 'GET_AnnotatedPieceList') {
  console.log('GET_AnnotatedPieceList returning??', versionsRef.current.find(version => version.id === currentVersionId))
  const currentAnnotatedPieceList = versionsRef.current.find(version => version.id === currentVersionId)?.AnnotatedPieceList;
  if (currentAnnotatedPieceList) {
    iframeRef.current.contentWindow.postMessage(
      {
        type: 'RETURN_AnnotatedPieceList',
        currentAnnotatedPieceList: currentAnnotatedPieceList,
      },
      '*'
    );
    console.log('GET_AnnotatedPieceList returned')
  }
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
                  window.newobjID = 1;

                    window.currentreuseableSVGElementList = ${JSON.stringify(currentreuseableSVGElementList)};
                    // Define create_canvas and make it globally accessible
                    function create_canvas(canvas_color) {
                        const canvasContainer = document.getElementById('canvasContainer');
                        // Clear all contents of canvasContainer
                        while (canvasContainer.firstChild) {
                            canvasContainer.removeChild(canvasContainer.firstChild);
                        }
                        canvasContainer.style.backgroundColor = canvas_color;
                        return canvasContainer;
                    }
                    function setBackground(color) {
                      window.canvas = new whole_canvas(color)
                    }
                    function renderObj(object, coord = { x: 50, y: 50 }, scale = 1, tl = null, tr = null, bl = null, br = null) {
                      object.placeObj(window.canvas, coord, scale, tl, tr, bl, br)
                    }
                    </script>
                    <script src="/oldlib.js"></script>
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
  }
  return (
    <div ref={containerRef} className="result-viewer" >
      <iframe ref={iframeRef} 
      title="Result Viewer" 
      style={{ width: '100%', height: '100%' }} 
      sandbox="allow-scripts allow-same-origin" // Add allow-same-origin
      onLoad={handleIframeLoad} // Attach the onLoad handler
      />
    </div>
  );
};

export default ResultViewer;