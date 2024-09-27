import React, { useState, useRef, useEffect } from 'react';
import DescriptionEditor from './components/DescriptionEditor';
import CustomCodeEditor from './components/CodeEditor';
import ResultViewer from './components/ResultViewer';
import ClassEditor from './components/ClassEditor';

import './App.css';
import { KeywordTree, Version } from './types';
import { v4 as uuidv4 } from 'uuid';
import ListGroup from 'react-bootstrap/ListGroup';
import ReusableElementToolbar from './components/ReusableElementToolbar';

const App: React.FC = () => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('js');
  const [classcode, setClassCode] = useState<{ js: string }>({
    js: `window.Tree = class extends window.Rule {
    static doc = "a dense tree with random shape";
    static parameters = ['size of the leaves', 'number of the branches', 'leave color'];
    // No constructor needed
}
`,
  });
  const [runClassCodeTrigger, setRunClassCodeTrigger] = useState<number>(0);
  const [runUserCodeTrigger, setRunUSerCodeTrigger] = useState<number>(0);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const handleRunClassCode = () => {
    console.log('posting msg EXECUTE_CLASSCODE')
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'EXECUTE_CLASSCODE',
          classcode: classcode.js,
        },
        '*'
      );
    }
  };
  
  
  const handleRunUserCode = (newuserCode: { js: string },) => {
    if (currentVersionId === null) return;
    setVersions((prevVersions) => {
      const updatedVersions = prevVersions.map(version =>
        version.id === currentVersionId
          ? { ...version, usercode: newuserCode, highlightedSVGPieceList: []}
          : version
      );
      return updatedVersions;
    });
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'EXECUTE_USERCODE',
          usercode: newuserCode.js,
        },
        '*'
      );
    }
  };
  useEffect(() => {
    // Initialize the base version on load
    const baseVersion: Version = {
      id: 'init',
      description: "set 'code2desc = true' in whole_canvas.draw() parameter to generate descriptions",
      savedOldDescription: '', 
      backendcode: {html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SVG Example</title>
    <style>
        body {
            margin: 0;
            background-color: skyblue;
            width: 600px;
            height: 600px;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
        }
    </style>
</head>
<body>
</body>
</html>`},
      usercode: { js: `function divideCanvasIntoBlocks(canvasWidth = 100, canvasHeight = 100, numBlocks = 7) {
  // Create arrays to store the x and y coordinates of the dividing lines
  let xLines = [0, canvasWidth];
  let yLines = [0, canvasHeight];

  // Generate random dividing lines
  for (let i = 0; i < numBlocks - 2; i++) {
    if (i % 2 === 0) {
      xLines.push(Math.floor(Math.random() * canvasWidth));
    } else {
      yLines.push(Math.floor(Math.random() * canvasHeight));
    }
  }

  // Sort the lines
  xLines.sort((a, b) => a - b);
  yLines.sort((a, b) => a - b);

  // Generate blocks with four corner coordinates
  let blocks = [];
  for (let i = 0; i < xLines.length - 1; i++) {
    for (let j = 0; j < yLines.length - 1; j++) {
      blocks.push({
        topLeft: { x: xLines[i], y: yLines[j] },
        topRight: { x: xLines[i+1], y: yLines[j] },
        bottomLeft: { x: xLines[i], y: yLines[j+1] },
        bottomRight: { x: xLines[i+1], y: yLines[j+1] }
      });
    }
  }

  // Convert block coordinates to the requested format (0-100 range)
  let coordinates = blocks.map(block => ({
    topLeft: { 
      x: Math.floor(block.topLeft.x / canvasWidth * 100),
      y: Math.floor(block.topLeft.y / canvasHeight * 100)
    },
    topRight: { 
      x: Math.floor(block.topRight.x / canvasWidth * 100),
      y: Math.floor(block.topRight.y / canvasHeight * 100)
    },
    bottomLeft: { 
      x: Math.floor(block.bottomLeft.x / canvasWidth * 100),
      y: Math.floor(block.bottomLeft.y / canvasHeight * 100)
    },
    bottomRight: { 
      x: Math.floor(block.bottomRight.x / canvasWidth * 100),
      y: Math.floor(block.bottomRight.y / canvasHeight * 100)
    }
  }));

  return coordinates;
}

// Usage
let blockCoordinates = divideCanvasIntoBlocks();

// Array of colors to choose from
const treeColors = [
  "#228B22", // ForestGreen
  "#006400", // DarkGreen
  "#8B4513", // SaddleBrown
  "#556B2F", // DarkOliveGreen
  "#6B8E23", // OliveDrab
  "#2E8B57", // SeaGreen
  "#8FBC8F", // DarkSeaGreen
  "#A0522D", // Sienna
  "#8B7765", // RosyBrown
  "#D2691E", // Chocolate
];

const canvas = new whole_canvas('azure');
const tree = new window.Tree();

// Wrap the asynchronous operations in an async function
async function placeObjects() {
  // Generate an object with specific parameter values
  const treeobj = await tree.generateObj('treeobj', [50, 50, 'green']);
  
  for (let idx = 0; idx < blockCoordinates.length; idx++) {
    const block = blockCoordinates[idx];
    const specifictreeobj = await treeobj.template.createObj('specifictreeobj' + idx.toString(), [
      Math.random() * (100 - 20) + 20,
      Math.random() * (100 - 20) + 20,
    treeColors[Math.floor(Math.random() * treeColors.length)]
    ]);
    
    specifictreeobj.placeObj(canvas, null, 1, block.topLeft, block.topRight, block.bottomLeft, block.bottomRight);
  }

}

// Call the async function
placeObjects().catch(error => console.error('Error:', error));
` },
      savedOldCode: { html: '', css: '', js: '' },
      keywordTree: [
        { level: 1, keywords: [] },
        { level: 2, keywords: [] },
      ],
      wordselected: 'ocean',
      highlightEnabled: false,
      loading: false,
      piecesToHighlightLevel1: [],
      piecesToHighlightLevel2: [],
      showDetails: {},
      latestDescriptionText: '', 
      hiddenInfo: [],
      formatDescriptionHtml:'',
      specificParamList: [], // Added
      paramCheckEnabled: false, // Added
      reuseableSVGElementList: [], // Added
    };
  
    setVersions([baseVersion]);
    setCurrentVersionId(baseVersion.id);
  }, []);
  

  const stopwords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 'into', 'is', 'it', 
    'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the', 'their', 'then', 'there', 'these', 'they', 
    'this', 'to', 'was', 'will', 'with'
  ]);

  const extractKeywords = (description: string) => {
    const regex = /\[(.*?)\]\{(.*?)\}/g;
    const level1Keywords = new Set<string>();
    const allSubKeywords = new Set<string>();
  
    let match;
    while ((match = regex.exec(description)) !== null) {
      // Split the keyword parts into individual words
      const keywordParts = match[1].trim().split(/\s+/).map(word => unpluralize(uncapitalize(word)));
      // Add each word as a separate keyword
      keywordParts.forEach(keyword => level1Keywords.add(keyword));
  
      const details = match[2].trim();
      const subKeywords = details
        .split(/[\s,()]+/)
        .map(word => unpluralize(uncapitalize(word.trim())))
        .filter(word => word && !stopwords.has(word));
  
      subKeywords.forEach(subKeyword => allSubKeywords.add(subKeyword));
    }
  
    const newKeywordTree: KeywordTree[] = [
      { level: 1, keywords: [] },
      { level: 2, keywords: [] },
    ];
  
    level1Keywords.forEach(keyword => {
      newKeywordTree[0].keywords.push({
        keyword,
        subKeywords: [],
        children: [],
        codeBlock: '',
        parentKeyword: null
      });
    });
  
    const uniqueSubKeywords = Array.from(allSubKeywords).filter(
      subKeyword => !level1Keywords.has(subKeyword)
    );
  
    uniqueSubKeywords.forEach(subKeyword => {
      newKeywordTree[1].keywords.push({
        keyword: subKeyword,
        subKeywords: [],
        children: [],
        codeBlock: '',
        parentKeyword: null
      });
    });
  
    console.log('keyword tree updated', currentVersionId, newKeywordTree);
    return newKeywordTree;
  };
  
  // const extractKeywords = (description: string) => {
  //   const regex = /\[(.*?)\]\{(.*?)\}/g;
  //   const level1Keywords = new Set<string>();
  //   const allSubKeywords = new Set<string>();
  
  //   let match;
  //   while ((match = regex.exec(description)) !== null) {
  //     const keywordParts = match[1].trim().split(/\s+/).map(word => unpluralize(uncapitalize(word)));
  //     keywordParts.forEach(keyword => level1Keywords.add(keyword));
  
  //     const details = match[2].trim();
  //     const subKeywords = details
  //       .split(/[\s,()]+/)
  //       .map(word => unpluralize(uncapitalize(word.trim())))
  //       .filter(word => word && !stopwords.has(word));
  
  //     subKeywords.forEach(subKeyword => allSubKeywords.add(subKeyword));
  //   }
  
  //   const newKeywordTree: KeywordTree[] = [
  //     { level: 1, keywords: [] },
  //     { level: 2, keywords: [] },
  //   ];
  
  //   level1Keywords.forEach(keyword => {
  //     newKeywordTree[0].keywords.push({
  //       keyword,
  //       subKeywords: [],
  //       children: [],
  //       codeBlock: '',
  //       parentKeyword: null
  //     });
  //   });
  
  //   const uniqueSubKeywords = Array.from(allSubKeywords).filter(
  //     subKeyword => !level1Keywords.has(subKeyword)
  //   );
  
  //   uniqueSubKeywords.forEach(subKeyword => {
  //     newKeywordTree[1].keywords.push({
  //       keyword: subKeyword,
  //       subKeywords: [],
  //       children: [],
  //       codeBlock: '',
  //       parentKeyword: null
  //     });
  //   });
  
  //   console.log('keyword tree updated', currentVersionId, newKeywordTree);
  //   return newKeywordTree;
  // };
  
  // Dummy implementations of uncapitalize and unpluralize for demonstration purposes
  function uncapitalize(word: string): string {
    return word.charAt(0).toLowerCase() + word.slice(1);
  }
  
  function unpluralize(word: string): string {
    return word.endsWith('s') ? word.slice(0, -1) : word;
  }
  
  

  const handleDescriptionApply = (newDescription: string) => {
    if (currentVersionId === null) return;
    setVersions((prevVersions) => {
      const updatedVersions = prevVersions.map(version =>
        version.id === currentVersionId
          ? { ...version, description: newDescription, keywordTree: extractKeywords(newDescription) }
          : version
      );
      return updatedVersions;
    });
  };
  //run userjs
  const handlejsCodeInitialize = (newuserCode: { js: string }, initialbackendCode: { html: string }) => {
    // console.log('check code in handleCodeInitialize', newCode.html)
    if (currentVersionId === null) return;
    setVersions((prevVersions) => {
      const updatedVersions = prevVersions.map(version =>
        version.id === currentVersionId
          ? { ...version, usercode: newuserCode, highlightedSVGPieceList: []}
          : version
      );
      return updatedVersions;
    });
  };
  //run backendhtml
  const handlehtmlCodeInitialize = (newuserCode: { js: string }) => {
    // console.log('check code in handleCodeInitialize', newCode.html)
    if (currentVersionId === null) return;
    setVersions((prevVersions) => {
      const updatedVersions = prevVersions.map(version =>
        version.id === currentVersionId
          ? { ...version, usercode: newuserCode }
          : version
      );
      return updatedVersions;
    });
  };


  const handleWordSelected = (word: string) => {
    console.log('selected word', word)
    if (currentVersionId === null) return;
    setVersions((prevVersions) => {
      const updatedVersions = prevVersions.map(version =>
        version.id === currentVersionId
          ? { ...version, wordselected: word }
          : version
      );
      return updatedVersions;
    });
  };

  //version controls
  const saveCurrentVersion = () => {
    const currentVersion = versions.find(version => version.id === currentVersionId);
    if (!currentVersion) return;
  
    if (currentVersion.id.includes('init')) {
      const versionName = prompt("Enter version name:");
      if (!versionName) return;
  
      // Change version id first
      setVersions(prevVersions => {
        const updatedVersions = prevVersions.map(version =>
          version.id === currentVersionId
            ? { ...version, id: versionName }
            : version
        );
        return updatedVersions;
      });
  
      // Update currentVersionId
      setCurrentVersionId(versionName);
  
      // Update version contents
      setVersions(prevVersions => {
        const updatedVersions = prevVersions.map(version =>
          version.id === versionName
            ? {
                ...version,
                description: currentVersion.description,
                savedOldDescription: currentVersion.savedOldDescription,
                usercode: currentVersion.usercode,
                savedOldCode: currentVersion.savedOldCode,
                keywordTree: currentVersion.keywordTree,
                wordselected: currentVersion.wordselected,
                highlightEnabled: currentVersion.highlightEnabled,
                loading: currentVersion.loading,
                piecesToHighlightLevel1: currentVersion.piecesToHighlightLevel1,
                piecesToHighlightLevel2: currentVersion.piecesToHighlightLevel2,
              }
            : version
        );
        return updatedVersions;
      });
    } else {
      setVersions(prevVersions => {
        const updatedVersions = prevVersions.map(version =>
          version.id === currentVersionId
            ? {
                ...version,
                description: currentVersion.description,
                savedOldDescription: currentVersion.savedOldDescription,
                usercode: currentVersion.usercode,
                savedOldCode: currentVersion.savedOldCode,
                keywordTree: currentVersion.keywordTree,
                wordselected: currentVersion.wordselected,
                highlightEnabled: currentVersion.highlightEnabled,
                loading: currentVersion.loading,
                piecesToHighlightLevel1: currentVersion.piecesToHighlightLevel1,
                piecesToHighlightLevel2: currentVersion.piecesToHighlightLevel2,
              }
            : version
        );
        return updatedVersions;
      });
    }
  
    console.log('check all versions', versions);
  };
  

  const createNewVersion = () => {
    const newVersion: Version = {
      id: 'init'+uuidv4(),
      description: "Adding sth...",
      savedOldDescription: '',
      backendcode: {html: ''},
      usercode: { js: '' },
      savedOldCode: { html: '', css: '', js: '' },
      keywordTree: [
        { level: 1, keywords: [] },
        { level: 2, keywords: [] },
      ],
      wordselected: 'ocean',
      highlightEnabled: false,
      loading: false,
      piecesToHighlightLevel1: [],
      piecesToHighlightLevel2: [],
      showDetails: {},
      latestDescriptionText: '',
      hiddenInfo: [],
      formatDescriptionHtml:'',
      specificParamList: [], // Added
      paramCheckEnabled: false, // Added
      reuseableSVGElementList: [], // Added
      highlightedSVGPieceList: [],
      previousSelectedSVGPieceList: [],
      cachedobjectslog:{}
    };

    setVersions([...versions, newVersion]);
    setCurrentVersionId(newVersion.id);
  };

  const generateUniqueId = (baseId: string) => {
    let newId = baseId;
    let counter = 1;
    while (versions.some(version => version.id === newId)) {
      newId = `${baseId}${counter}`;
      counter += 1;
    }
    return newId;
  };
  
  const copyCurrentVersion = () => {
    const currentVersion = versions.find(version => version.id === currentVersionId);
    if (!currentVersion) return;

    const baseId = `${currentVersion.id}-copy`;
    const newId = generateUniqueId(baseId);

    const newVersion: Version = {
      ...currentVersion,
      id: newId,
    };

    setVersions([...versions, newVersion]);
    setCurrentVersionId(newVersion.id);
  };


  const switchToVersion = (id: string) => {
    console.log('check all versions', versions);
    const selectedVersion = versions.find(version => version.id === id);
    if (selectedVersion) {
      console.log('selected version', selectedVersion);
      setCurrentVersionId(id);
    }
  };

  const deleteVersion = (id: string) => {
    setVersions((prevVersions) => prevVersions.filter(version => version.id !== id));
    setCurrentVersionId(null);
    // createNewVersion();
  };

  const createTestVersion = () => {
    const currentVersion = versions.find(version => version.id === currentVersionId);
    if (!currentVersion) return;
  
    const newId = `${currentVersion.id}-test`;
    const prefix = 'In the description, words in [] are important entities, and following entities are detailed hints in {} to specify how to create these entities and animations.\n '
    const newVersion: Version = {
      id: newId,
      description: prefix +currentVersion.description,
      savedOldDescription: '', 
      backendcode: {html: ''},
      usercode: { js: '' },
      savedOldCode: { html: '', css: '', js: '' },
      keywordTree: [
        { level: 1, keywords: [] },
        { level: 2, keywords: [] },
      ],
      wordselected: 'ocean',
      highlightEnabled: false,
      loading: false,
      piecesToHighlightLevel1: [],
      piecesToHighlightLevel2: [],
      showDetails: {},
      latestDescriptionText: '', 
      hiddenInfo: [],
      formatDescriptionHtml:'',
      specificParamList: [], // Added
      paramCheckEnabled: false, // Added
      reuseableSVGElementList: currentVersion.reuseableSVGElementList, // Added
      cachedobjectslog: {}
    };
  
    setVersions([...versions, newVersion]);
    setCurrentVersionId(newVersion.id);
  };
  
  const handleDeleteReusableElement = (versionId: string, codeName: string) => {
    setVersions(prevVersions => {
      const updatedVersions = prevVersions.map(version =>
        version.id === versionId
          ? { ...version, reuseableSVGElementList: version.reuseableSVGElementList.filter(element => element.codeName !== codeName) }
          : version
      );
      return updatedVersions;
    });
  };

  const handleUpdateBackendHtml = (newHtml: string) => {
    if (currentVersionId === null) return;
    setVersions((prevVersions) => {
      const updatedVersions = prevVersions.map(version =>
        version.id === currentVersionId
          ? { ...version, backendcode: { ...version.backendcode, html: newHtml } }
          : version
      );
      return updatedVersions;
    });
  };
  


  return (
    <div className="App">
      <div className="editor-section">
        {currentVersionId !== null && versions.find(version => version.id === currentVersionId) && (
          <>
            {/* <DescriptionEditor
              onApply={handleDescriptionApply}
              savedOldCode={versions.find(version => version.id === currentVersionId)!.savedOldCode}
              onWordSelected={handleWordSelected}
              currentVersionId={currentVersionId}
              versions={versions}
              setVersions={setVersions}
              extractKeywords={extractKeywords}
            /> */}
            {/* Replace DescriptionEditor with ClassEditor */}
            <div className="class-editor-container">
              <ClassEditor 
              currentVersionId={currentVersionId}
              versions={versions}
              setVersions={setVersions}
              classcode={classcode} 
              setClassCode={setClassCode}
              onRunClassCode={handleRunClassCode} // Pass the handler
               />
            </div>

            <CustomCodeEditor
              usercode={versions.find(version => version.id === currentVersionId)!.usercode}
              backendcode={versions.find(version => version.id === currentVersionId)!.backendcode}
              onApplyjs={handlejsCodeInitialize}
              onApplyhtml={handlehtmlCodeInitialize}
              description={versions.find(version => version.id === currentVersionId)!.description}
              savedOldCode={versions.find(version => version.id === currentVersionId)!.savedOldCode}
              keywordTree={versions.find(version => version.id === currentVersionId)!.keywordTree}
              wordselected={versions.find(version => version.id === currentVersionId)!.wordselected}
              currentVersionId={currentVersionId}
              versions={versions}
              setVersions={setVersions}
              extractKeywords={extractKeywords}
              activeTab={activeTab} // Pass activeTab
              setActiveTab={setActiveTab} // Pass setActiveTab
              onRunUserCode={handleRunUserCode} // Pass the handler
              />
            <ResultViewer  
            activeTab={activeTab} 
            usercode={versions.find(version => version.id === currentVersionId)!.usercode}
            classcode={classcode} // Pass classcode to ResultViewer 
            backendcode={versions.find(version => version.id === currentVersionId)!.backendcode}
            updateBackendHtml={handleUpdateBackendHtml}
            currentVersionId={currentVersionId}
            versions={versions}
            setVersions={setVersions}
            iframeRef={iframeRef}
            />
            <ReusableElementToolbar
              currentVersionId={currentVersionId}
              versions={versions}
              setVersions={setVersions}
              hoveredElement={hoveredElement}
              setHoveredElement={setHoveredElement}
            />
          </>
        )}
      </div>
      <div className="version-controls">
        <button className="test-button" onClick={createTestVersion}>Test</button>
        <button className="purple-button" onClick={saveCurrentVersion}>Save</button>
        <button className="green-button" onClick={createNewVersion}>New</button>
        <button className="green-button" onClick={copyCurrentVersion}>Copy</button>
        {currentVersionId !== null && (
          <button className="delete-button" onClick={() => deleteVersion(currentVersionId)}>Delete</button>
        )}
        <div className="version-buttons">
          {versions.map((version) => (
            <button
              key={version.id}
              className={`version-button ${currentVersionId === version.id ? 'selected' : ''}`}
              onClick={() => switchToVersion(version.id)}
            >
              {version.id}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
  
export default App;


