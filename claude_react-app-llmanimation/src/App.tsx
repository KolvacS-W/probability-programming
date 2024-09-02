import React, { useState, useEffect } from 'react';
import DescriptionEditor from './components/DescriptionEditor';
import CustomCodeEditor from './components/CodeEditor';
import ResultViewer from './components/ResultViewer';
import './App.css';
import { KeywordTree, Version } from './types';
import { v4 as uuidv4 } from 'uuid';
import ListGroup from 'react-bootstrap/ListGroup';
import ReusableElementToolbar from './components/ReusableElementToolbar';

const App: React.FC = () => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('html');

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
      usercode: { js: `const myCanvas = new whole_canvas('azure');

const carrule = new Rule('a blue car')

// carrule.useobj.objname = 'car1'

// carrule.modifyobj = {objname: 'car2', objpiece: [], pieceprompts: []}

console.log(carrule)

const Carobj = await carrule.generateandDrawObj('car3', myCanvas, {x: 34, y: 67}, 1.2)

console.log('check obj', Carobj)
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
      reuseableSVGElementList: [{
        "codeName": "car3",
        "codeText": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"200\" viewBox=\"0 0 400 200\" name=\"a blue car\" style=\"position: absolute; left: 34%; top: 67%; transform: translate(-50%, -50%) scale(1.2);\">\n  <g id=\"car\">\n    <path d=\"M50,140 Q75,130 100,140 L300,140 Q325,130 350,140 L350,160 Q325,170 300,160 L100,160 Q75,170 50,160 Z\" fill=\"#0066cc\" stroke=\"#003366\" stroke-width=\"2\"></path>\n    <path d=\"M30,140 L50,140 L50,160 L30,160 Q20,150 30,140 Z\" fill=\"#0066cc\" stroke=\"#003366\" stroke-width=\"2\"></path>\n    <path d=\"M350,140 L370,140 Q380,150 370,160 L350,160 Z\" fill=\"#0066cc\" stroke=\"#003366\" stroke-width=\"2\"></path>\n    <path d=\"M100,80 Q150,60 250,60 Q300,60 320,80 L340,110 Q350,130 330,140 L70,140 Q50,130 60,110 Z\" fill=\"#0099ff\" stroke=\"#003366\" stroke-width=\"2\"></path>\n    <path d=\"M110,85 L290,85 L310,110 L90,110 Z\" fill=\"#b3e0ff\" stroke=\"#003366\" stroke-width=\"2\"></path>\n    <circle cx=\"100\" cy=\"150\" r=\"20\" fill=\"#333333\" stroke=\"#1a1a1a\" stroke-width=\"2\"></circle>\n    <circle cx=\"100\" cy=\"150\" r=\"12\" fill=\"#808080\" stroke=\"#666666\" stroke-width=\"2\"></circle>\n    <circle cx=\"300\" cy=\"150\" r=\"20\" fill=\"#333333\" stroke=\"#1a1a1a\" stroke-width=\"2\"></circle>\n    <circle cx=\"300\" cy=\"150\" r=\"12\" fill=\"#808080\" stroke=\"#666666\" stroke-width=\"2\"></circle>\n    <path d=\"M180,85 L220,85 L220,60 L180,60 Z\" fill=\"#b3e0ff\" stroke=\"#003366\" stroke-width=\"2\"></path>\n    <path d=\"M230,85 L270,85 L270,70 L230,70 Z\" fill=\"#b3e0ff\" stroke=\"#003366\" stroke-width=\"2\"></path>\n    <path d=\"M130,85 L170,85 L170,70 L130,70 Z\" fill=\"#b3e0ff\" stroke=\"#003366\" stroke-width=\"2\"></path>\n    <path d=\"M70,110 L90,110 L85,130 L65,130 Z\" fill=\"#ff9900\" stroke=\"#cc7a00\" stroke-width=\"2\"></path>\n    <path d=\"M310,110 L330,110 L335,130 L315,130 Z\" fill=\"#ff9900\" stroke=\"#cc7a00\" stroke-width=\"2\"></path>\n    <path d=\"M180,140 L220,140 L220,130 Q200,125 180,130 Z\" fill=\"#003366\" stroke=\"#001a33\" stroke-width=\"2\"></path>\n    <path d=\"M70,115 L80,115\" stroke=\"#ff9900\" stroke-width=\"2\" stroke-linecap=\"round\"></path>\n    <path d=\"M320,115 L330,115\" stroke=\"#ff9900\" stroke-width=\"2\" stroke-linecap=\"round\"></path>\n  </g>\n</svg>",
        "selected": false
    }, {
      "codeName": "car4",
      "codeText": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"200\" viewBox=\"0 0 400 200\" name=\"a blue car\" style=\"position: absolute; left: 34%; top: 67%; transform: translate(-50%, -50%) scale(1.2);\">\n  <g id=\"car\">\n    <path d=\"M50,140 Q75,130 100,140 L300,140 Q325,130 350,140 L350,160 Q325,170 300,160 L100,160 Q75,170 50,160 Z\" fill=\"#0066cc\" stroke=\"#003366\" stroke-width=\"2\"></path>\n    <path d=\"M30,140 L50,140 L50,160 L30,160 Q20,150 30,140 Z\" fill=\"#0066cc\" stroke=\"#003366\" stroke-width=\"2\"></path>\n    <path d=\"M350,140 L370,140 Q380,150 370,160 L350,160 Z\" fill=\"#0066cc\" stroke=\"#003366\" stroke-width=\"2\"></path>\n    <path d=\"M100,80 Q150,60 250,60 Q300,60 320,80 L340,110 Q350,130 330,140 L70,140 Q50,130 60,110 Z\" fill=\"#0099ff\" stroke=\"#003366\" stroke-width=\"2\"></path>\n    <path d=\"M110,85 L290,85 L310,110 L90,110 Z\" fill=\"#b3e0ff\" stroke=\"#003366\" stroke-width=\"2\"></path>\n    <circle cx=\"100\" cy=\"150\" r=\"20\" fill=\"#333333\" stroke=\"#1a1a1a\" stroke-width=\"2\"></circle>\n    <circle cx=\"100\" cy=\"150\" r=\"12\" fill=\"#808080\" stroke=\"#666666\" stroke-width=\"2\"></circle>\n    <circle cx=\"300\" cy=\"150\" r=\"20\" fill=\"#333333\" stroke=\"#1a1a1a\" stroke-width=\"2\"></circle>\n    <circle cx=\"300\" cy=\"150\" r=\"12\" fill=\"#808080\" stroke=\"#666666\" stroke-width=\"2\"></circle>\n    <path d=\"M180,85 L220,85 L220,60 L180,60 Z\" fill=\"#b3e0ff\" stroke=\"#003366\" stroke-width=\"2\"></path>\n    <path d=\"M230,85 L270,85 L270,70 L230,70 Z\" fill=\"#b3e0ff\" stroke=\"#003366\" stroke-width=\"2\"></path>\n    <path d=\"M130,85 L170,85 L170,70 L130,70 Z\" fill=\"#b3e0ff\" stroke=\"#003366\" stroke-width=\"2\"></path>\n    <path d=\"M70,110 L90,110 L85,130 L65,130 Z\" fill=\"#ff9900\" stroke=\"#cc7a00\" stroke-width=\"2\"></path>\n    <path d=\"M310,110 L330,110 L335,130 L315,130 Z\" fill=\"#ff9900\" stroke=\"#cc7a00\" stroke-width=\"2\"></path>\n    <path d=\"M180,140 L220,140 L220,130 Q200,125 180,130 Z\" fill=\"#003366\" stroke=\"#001a33\" stroke-width=\"2\"></path>\n    <path d=\"M70,115 L80,115\" stroke=\"#ff9900\" stroke-width=\"2\" stroke-linecap=\"round\"></path>\n    <path d=\"M320,115 L330,115\" stroke=\"#ff9900\" stroke-width=\"2\" stroke-linecap=\"round\"></path>\n  </g>\n</svg>",
      "selected": false
  }], // Added
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
      previousSelectedSVGPieceList: []
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
            <DescriptionEditor
              onApply={handleDescriptionApply}
              savedOldCode={versions.find(version => version.id === currentVersionId)!.savedOldCode}
              onWordSelected={handleWordSelected}
              currentVersionId={currentVersionId}
              versions={versions}
              setVersions={setVersions}
              extractKeywords={extractKeywords}
            />
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
            />
            <ResultViewer  
            activeTab={activeTab} 
            usercode={versions.find(version => version.id === currentVersionId)!.usercode} 
            backendcode={versions.find(version => version.id === currentVersionId)!.backendcode}
            updateBackendHtml={handleUpdateBackendHtml}
            currentVersionId={currentVersionId}
            versions={versions}
            setVersions={setVersions} />
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


