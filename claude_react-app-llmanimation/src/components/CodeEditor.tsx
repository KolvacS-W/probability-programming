import React, { useState, useEffect, useRef } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import ReactLoading from 'react-loading';
import { Version, KeywordTree } from '../types';
import axios from 'axios';

interface CodeEditorProps {
  backendcode: { html: string }; //backend hidden
  usercode: { js: string } //user use
  onApply: (usercode: { js: string }) => void;
  description: string;
  savedOldCode: { html: string; css: string; js: string };
  keywordTree: KeywordTree[];
  wordselected: string;
  currentVersionId: string | null;
  setVersions: React.Dispatch<React.SetStateAction<Version[]>>;
  versions: Version[];
  extractKeywords: (description: string) => KeywordTree[];
}

const API_KEY = '';
const ngrok_url = 'https://0e5b-35-221-58-30.ngrok-free.app';
const ngrok_url_sonnet = ngrok_url+'/api/message';
const ngrok_url_haiku = ngrok_url+'/api/message-haiku';

const CustomCodeEditor: React.FC<CodeEditorProps> = ({
  usercode,
  backendcode,
  onApply,
  description,
  savedOldCode,
  keywordTree,
  wordselected,
  currentVersionId,
  setVersions,
  versions,
  extractKeywords,
}) => {
  const [backendhtml, setbackendHtml] = useState(backendcode.html);
  const [userjs, setuserJs] = useState(usercode.js);
  const [activeTab, setActiveTab] = useState('html');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [hintKeywords, setHintKeywords] = useState('');
  const [generatedOptions, setGeneratedOptions] = useState<string[]>([]);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);

  const version = currentVersionId !== null ? versions.find(version => version.id === currentVersionId) : null;
  const loading = version ? version.loading : false;
  const highlightEnabled = version ? version.highlightEnabled : true;
  const piecesToHighlightLevel1 = version ? version.piecesToHighlightLevel1 : [];
  const piecesToHighlightLevel2 = version ? version.piecesToHighlightLevel2 : [];

  useEffect(() => {
    setbackendHtml(backendcode.html);
    setuserJs(usercode.js);
  }, [usercode]);

  // useEffect(() => {
  //   if (highlightEnabled) {
  //     updateHighlightPieces(currentVersionId);
  //   }
  // }, [keywordTree, wordselected, highlightEnabled, currentVersionId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setGeneratedOptions([]);
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const saveVersionToHistory = (currentVersionId: string) => {
    setVersions(prevVersions => {
      const updatedVersions = prevVersions.map(version => {
        if (version.id === currentVersionId) {
          const historyVersion = { ...version, id: `${currentVersionId}-history` };
          return { ...version, history: historyVersion };
        }
        return version;
      });
      return updatedVersions;
    });
  };

  // const handleParseRun = (versionId: string) => {
  //   onApply({ html, css, js });
  //   processKeywordTree(versionId);
  // };

  const handleRun = (versionId: string) => {
    onApply({ js: userjs });
  };

  // const updateHighlightPieces = (versionId: string | null) => {
  //   if (!versionId) return;

  //   const level1Pieces: string[] = [];
  //   const level2Pieces: string[] = [];

  //   const keywordTree = versions.find(version => version.id === versionId)?.keywordTree || [];

  //   keywordTree.forEach((tree: KeywordTree) => {
  //     tree.keywords.forEach((keywordNode: KeywordNode) => {
  //       if (tree.level === 1 && keywordNode.keyword === wordselected) {
  //         level1Pieces.push(keywordNode.codeBlock);
  //       } else if (tree.level === 2 && keywordNode.keyword === wordselected) {
  //         level2Pieces.push(keywordNode.codeBlock);
  //       }
  //     });
  //   });

  //   setVersions(prevVersions => {
  //     const updatedVersions = prevVersions.map(version =>
  //       version.id === versionId
  //         ? { ...version, piecesToHighlightLevel1: level1Pieces, piecesToHighlightLevel2: level2Pieces }
  //         : version
  //     );
  //     return updatedVersions;
  //   });
  // };

  // const processKeywordTree = async (versionId: string | null) => {
  //   if (!versionId) return;

  //   const gptResults = await ParseCodeGPTCall(versionId);
  //   const codePieces = gptResults.split('$$$');
  //   const sublists = codePieces.map(piece => piece.split('@@@'));

  //   const level1Pieces: string[] = [];
  //   const level2Pieces: string[] = [];

  //   codePieces.forEach(piece => {
  //     if (piece.trim() && !piece.match(/^[\n@$]+$/)) {
  //       level1Pieces.push(piece);
  //     }
  //   });

  //   sublists.forEach(sublist => {
  //     sublist.forEach(subpiece => {
  //       if (subpiece.trim() && !subpiece.match(/^[\n@$]+$/)) {
  //         level2Pieces.push(subpiece);
  //       }
  //     });
  //   });

  //   const updatedKeywordTree = versions.find(version => version.id === versionId)?.keywordTree || [];

  //   updatedKeywordTree.forEach((tree: KeywordTree) => {
  //     tree.keywords.forEach((keywordNode: KeywordNode) => {
  //       keywordNode.codeBlock = '';

  //       if (tree.level === 1) {
  //         codePieces.forEach(piece => {
  //           if (piece.toLowerCase().includes(keywordNode.keyword.toLowerCase())) {
  //             keywordNode.codeBlock += piece;
  //           }
  //         });
  //       }

  //       if (tree.level === 2) {
  //         sublists.forEach(sublist => {
  //           sublist.forEach(subpiece => {
  //             if (subpiece.toLowerCase().includes(keywordNode.keyword.toLowerCase())) {
  //               keywordNode.codeBlock += subpiece;
  //             }
  //           });
  //         });
  //       }
  //     });
  //   });

  //   setVersions((prevVersions) => {
  //     const updatedVersions = prevVersions.map(version =>
  //       version.id === versionId
  //         ? {
  //           ...version,
  //           keywordTree: updatedKeywordTree
  //         }
  //         : version
  //     );
  //     return updatedVersions;
  //   });

  //   updateHighlightPieces(versionId);
  // };

  // const ParseCodeGPTCall = async (versionId: string): Promise<string> => {
  //   saveVersionToHistory(versionId);
  //   setVersions((prevVersions) => {
  //     const updatedVersions = prevVersions.map(version =>
  //       version.id === versionId
  //         ? { ...version, loading: true }
  //         : version
  //     );
  //     return updatedVersions;
  //   });

  //   const prompt = `Segment the following animation code into different blocks in two levels according to its functionalities.\\
  //   Use $$$ to segment level 1 blocks, and @@@ to further segment level 2 blocks within each level 1 block.\\
  //   Return full parsed code blocks in this format:
  //   $$$
  //   ...
  //   @@@
  //   ...
  //   @@@
  //   ...
  //   @@@
  //   ...
  //   $$$
  //   ...
  //   $$$
  //   Example input code:\\          
  //     <!-- Bird-like shapes representing birds -->
  //     <polygon id="bird1" points="25,150 35,150 30,145" fill="brown"/>
  //     <polygon id="bird2" points="55,150 65,150 60,145" fill="brown"/>
  //   </svg>
  //   <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
  //   <script>
  //     // Animate the first bird
  //     anime({
  //       targets: '#bird1',
  //       translateX: anime.path('#birdPath1')('x'),
  //       translateY: anime.path('#birdPath1')('y'),
  //       easing: 'easeInOutSine',
  //       duration: 3000,
  //       loop: true,
  //       direction: 'alternate'
  //     });
      
  //     // Animate the second bird
  //     anime({
  //       targets: '#bird2',
  //       translateX: anime.path('#birdPath2')('x'),
  //       translateY: anime.path('#birdPath2')('y'),
  //       easing: 'easeInOutSine',
  //       duration: 3500,
  //       loop: true,
  //       direction: 'alternate'
  //     });
  //   </script>

  //   Example segmented result:
  //   $$$
  //   @@@
  //   <!-- Bird-like shapes representing birds -->
  //     <polygon id="bird1" points="25,150 35,150 30,145" fill="brown"/>
  //   @@@
  //     <polygon id="bird2" points="55,150 65,150 60,145" fill="brown"/>
  //   @@@
  //   $$$
  //   </svg>
  //   <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
  //   $$$
  //   <script>
  //   @@@
  //     // Animate the first bird
  //     anime({
  //       targets: '#bird1',
  //       translateX: anime.path('#birdPath1')('x'),
  //       translateY: anime.path('#birdPath1')('y'),
  //       easing: 'easeInOutSine',
  //       duration: 3000,
  //       loop: true,
  //       direction: 'alternate'
  //     });
  //   @@@
  //     // Animate the second bird
  //     anime({
  //       targets: '#bird2',
  //       translateX: anime.path('#birdPath2')('x'),
  //       translateY: anime.path('#birdPath2')('y'),
  //       easing: 'easeInOutSine',
  //       duration: 3500,
  //       loop: true,
  //       direction: 'alternate'
  //     });
  //   @@@
  //   </script>
  //   $$$ 
  //   There must be at least 4 level1 blocks and 8 level2 blocks in the segmented code response;
  //   Segmented code should include all the code in the input.
  //   Include only the segmented code in response.
  //   Code to segment: ${html}
  //   `;

  //   try {
  //     const response = await axios.post(ngrok_url_sonnet, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify({ prompt: prompt })
  //     });

  //     const data = await response.data;
  //     const content = data?.content;
  //     console.log('content from Parsecode:', content);
  //     return content;
  //   } catch (error) {
  //     console.error("Error processing GPT request:", error);
  //     return '';
  //   } finally {
  //     setVersions((prevVersions) => {
  //       const updatedVersions = prevVersions.map(version =>
  //         version.id === versionId
  //           ? { ...version, loading: false }
  //           : version
  //       );
  //       return updatedVersions;
  //     });
  //   }
  // };

  // const handleUpdateCode = async (versionId: string) => {
  //   saveVersionToHistory(versionId);
  //   if (!versionId) return;

  //   setVersions((prevVersions) => {
  //     const updatedVersions = prevVersions.map(version =>
  //       version.id === versionId
  //         ? { ...version, code: { html, css, js } }
  //         : version
  //     );
  //     return updatedVersions;
  //   });

  //   setVersions((prevVersions) => {
  //     const updatedVersions = prevVersions.map(version =>
  //       version.id === versionId
  //         ? { ...version, loading: true }
  //         : version
  //     );
  //     return updatedVersions;
  //   });

  //   const prompt = `Based on the following existing old description describing the old code and the updated code, provide an updated description reflecting changes to the code. \\
  //   Old description: ${description}. \\
  //   Old code: HTML: \`\`\`html${savedOldCode.html}\`\`\` CSS: \`\`\`css${savedOldCode.css}\`\`\` JS: \`\`\`js${savedOldCode.js}\`\`\` \\
  //   Updated code: HTML: \`\`\`html${html}\`\`\` CSS: \`\`\`css${css}\`\`\` JS: \`\`\`js${js}\`\`\` \\
  //   Description format:\\
  //   xxxxx[entity1]{detail for entity1}xxxx[entity2]{detail for entity2}... \\ 
  //   In [] are important entities for the animation, and in {} behind each entity are all the details about the corresponding entity in the code, including all the variable names, numbers, and parameters. 
  //   Important: One [] only contains one entity and one {} only contains one detail. Each entity and each detail are wrapped in a [] and {} respectively. Include nothing but the new description in the response.\\
  //   Example description:
  //   [fishes]{#fish1 and #fish2, orange-colored, marine creatures depicted using polygonal SVG elements} shaped as [complex polygons]{polygonal shapes simulating the bodily form of fish with points configured in specific coordinates} are [swimming]{both #fish1 and #fish2 are animated to dynamically move along their designated paths:#path1 and #path2, predefined SVG paths depicted as smooth wavy lines} across an [ocean]{visualized by a large rectangular area filled with a vertical blue gradient, representing water}\\
  //   Just as with the old description, make sure it is made of coherent sentences with words other than entities and details.\\
  //   Include only the updated description in the response.`;

  //   try {
  //     const response = await axios.post(ngrok_url_sonnet, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify({ prompt: prompt })
  //     });

  //     const data = await response.data;
  //     const content = data?.content;
  //     console.log('content from updatecode:', content);

  //     if (content) {
  //       const updatedDescription = content.replace('] {', ']{').replace(']\n{', ']{');
  //       setVersions((prevVersions) => {
  //         const updatedVersions = prevVersions.map(version =>
  //           version.id === versionId
  //             ? {
  //               ...version,
  //               description: updatedDescription,
  //               savedOldDescription: updatedDescription,
  //               keywordTree: extractKeywords(updatedDescription)
  //             }
  //             : version
  //         );
  //         return updatedVersions;
  //       });
  //       processKeywordTree(versionId);
  //     }
  //   } catch (error) {
  //     console.error("Error processing update code request:", error);
  //   } finally {
  //     setVersions((prevVersions) => {
  //       const updatedVersions = prevVersions.map(version =>
  //         version.id === versionId
  //           ? { ...version, loading: false }
  //           : version
  //       );
  //       return updatedVersions;
  //     });
  //   }
  // };

  // const getFullText = (node: any) => {
  //   let text = '';
  //   const recurse = (child: any) => {
  //     if (child.type === 'text') {
  //       text += child.value;
  //     } else if (child.children) {
  //       child.children.forEach(recurse);
  //     }
  //   };
  //   node.children.forEach(recurse);
  //   return text.trim();
  // };

  // const shouldHighlightLine = (nodeText: string, index: number, codeLines: string[]) => {
  //   const regex = /[^{}()@#\s$]/;
  //   const isMeaningfulText = (text: string) => regex.test(text);

  //   if (!isMeaningfulText(nodeText)) {
  //     return false;
  //   }

  //   if (nodeText.includes(wordselected)) {
  //     return true;
  //   }

  //   for (let i = Math.max(0, index - 5); i < Math.min(codeLines.length, index + 5); i++) {
  //     if (codeLines[i].includes(wordselected)) {
  //       return true;
  //     }
  //   }

  //   return false;
  // };

  // const highlightCodeLines = (node: any, level1: string[], level2: string[], codeLines: string[], index: number) => {
  //   const nodeText = getFullText(node).trim();

  //   if (shouldHighlightLine(nodeText, index, codeLines)) {
  //     level1.forEach(piece => {
  //       if (piece.includes(nodeText)) {
  //         if (!node.properties.className) {
  //           node.properties.className = [];
  //         }
  //         node.properties.className.push('highlight-level1');
  //       }
  //     });

  //     level2.forEach(piece => {
  //       if (piece.includes(nodeText)) {
  //         if (!node.properties.className) {
  //           node.properties.className = [];
  //         }
  //         node.properties.className.push('highlight-level2');
  //       }
  //     });
  //   }
  // };

  // const renderActiveTab = () => {
  //   switch (activeTab) {
  //     case 'user':
  //       return renderEditor('js', html, setHtml);
  //     case 'backend':
  //       return renderEditor('backendhtml', css, setCss);

  //     default:
  //       return null;
  //   }
  // };


  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === '$') {
      const cursorPosition = editorRef.current?.selectionStart || 0;
      const textBeforeCursor = userjs.slice(0, cursorPosition);
      const hintText = textBeforeCursor.split('$').pop();
      if (hintText) {
        setHintKeywords(hintText);
        const position = getCaretCoordinates(editorRef.current, cursorPosition - hintText.length - 1);
        console.log('check pos:', position, cursorPosition)
        setAutocompletePosition({ top: position.top, left: position.left });
        setShowAutocomplete(true);
      }
    }
  };

  const handleDoubleClick = (event: React.MouseEvent) => {
    const selection = window.getSelection();
    const word = selection?.toString().trim();
    if (word) {
      setHintKeywords(word);
      const cursorPosition = editorRef.current?.selectionStart || 0;
      const position = getCaretCoordinates(editorRef.current, cursorPosition - word.length);
      console.log('check pos:', position, cursorPosition)
      setAutocompletePosition({ top: position.top+50, left: position.left });
      setShowAutocomplete(true);
    }
  };

  const handleRightClick = (event: React.MouseEvent) => {
    event.preventDefault();
    const selection = window.getSelection();
    const word = selection?.toString().trim();
    if (word) {
      console.log('right clicked word', word)
      setHintKeywords(word);
      const rect = editorRef.current?.getBoundingClientRect();
      if (rect) {
        setAutocompletePosition({ top: event.clientY - rect.top, left: event.clientX - rect.left });
        setShowAutocomplete(true);
      }
    }
  };

  const handleUpGenerate = async (hint: string) => {
    if(hint.includes(' ')){
      console.log('phrase')
      var prompt = `Given a text, give me 5 text pieces that are a more abstract and general level of given text piece.
      The more abstract level of a text can be achieved by removing details, descriptions and modifiers of the text and making it more generalizable.
      For example, "two parrots with feathers" is 1 level more abstract than "two beautiful parrots with colorful feathers", "two parrots" is 1 level more abstract than "two parrots with feathers"
      Make sure all the 5 text pieces in the response are on the same level, and include nothing but the 5 text pieces separated by '\n' in the response. Given text: `+hint
  
    }
    else{
      console.log('word')
      var prompt = `given a word, give me 5 words that are a more abstract and general level of given word. 
    The more abstract level of a word can be achieved by finding hypernyms of that word.
    For example, “motor vehicle” is one level more abstract than “car”, “self-propelled vehicle” is one level more abstract than “motor vehicle”, “wheeled vehicle” is one level more abstract than “self-propelled vehicle”; “color” is one level more abstract than “blue”.
    Make sure all 5 words in the response are on the same level; and include nothing but the 5 words separated by '\n' in the response. Given word: `+hint
    }

        try {
        console.log('prompt for upgenerate', prompt)
        const response = await axios.post(ngrok_url_sonnet, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prompt: prompt })
        });
    
      const data = await response.data;
      const content = data?.content;
      console.log('content from handleUpGenerate:', content);
      if (content) {
        const textResponse = content;
        console.log('Response from handleUpGenerate:', textResponse);
        const generatedText = textResponse;
        const options = generatedText.split('\n').filter(Boolean);
        setGeneratedOptions(options);
      }
    }
    catch (error) {
      console.error("Error processing request:", error);
    } finally {
    }
  };

  const handleRightGenerate = async (hint: string) => {
    // if(hint.includes(' ')){
    //   console.log('phrase')
    //   var prompt = `Given a text, give me 5 text pieces that are a more abstract and general level of given text piece.
    //   The more abstract level of a text can be achieved by removing details, descriptions and modifiers of the text and making it more generalizable.
    //   For example, "two parrots with feathers" is 1 level more abstract than "two beautiful parrots with colorful feathers", "two parrots" is 1 level more abstract than "two parrots with feathers"
    //   Make sure all the 5 text pieces in the response are on the same level, and include nothing but the 5 text pieces separated by '\n' in the response. Given text: `+hint
  
    // }
    // else{
    //   console.log('word')
    //   var prompt = `given a word, give me 5 words that are a more abstract and general level of given word. 
    // The more abstract level of a word can be achieved by finding hypernyms of that word.
    // For example, “motor vehicle” is one level more abstract than “car”, “self-propelled vehicle” is one level more abstract than “motor vehicle”, “wheeled vehicle” is one level more abstract than “self-propelled vehicle”; “color” is one level more abstract than “blue”.
    // Make sure all 5 words in the response are on the same level; and include nothing but the 5 words separated by '\n' in the response. Given word: `+hint
    // }
    var prompt = `Given a text, give me 5 text pieces that are a variation given text piece.
      The variation text should generally be the same as the original text, with various different details, descriptions, categories, and modifiers of the text to make it somewhat different.
      For example "A white passenger plane with two wings and a tail flying across a clear blue sky with fluffy white clouds." and "A small, red biplane with a propeller in the front gliding through the sky dotted with wispy, gray clouds." are both variations of "A large, commercial airliner with multiple engines and a rounded body cruising through the expansive blue sky filled with puffy, cumulus clouds." 
      Make sure all the 5 text pieces in the response are on the same level, and include nothing but the 5 text pieces separated by '\n' in the response. Given text: `+hint


      try {
      console.log('prompt for upgenerate', prompt)
      const response = await axios.post(ngrok_url_sonnet, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: prompt })
      });
    
      const data = await response.data;
      const content = data?.content;
      console.log('content from handleUpGenerate:', content);
      if (content) {
        const textResponse = content;
        console.log('Response from handleUpGenerate:', textResponse);
        const generatedText = textResponse;
        const options = generatedText.split('\n').filter(Boolean);
        setGeneratedOptions(options);
      }
    }
    catch (error) {
      console.error("Error processing request:", error);
    } finally {
    }
  };

  const handleDownGenerate = async (hint: string) => {
    if(hint.includes(' ')){
      console.log('phrase')
      var prompt = `Given a text, give me 5 text pieces that are 1 level more specific than given text piece.
      The more specific level of a text can be achieved by adding details, descriptions, categories, and modifiers of the text and making it more specific.
      For example, "two beautiful parrots with colorful feathers" is 1 level more specific than "two parrots with feathers", "two parrots with features" is 1 level more specific than "two parrots"
      Make sure all the 5 text pieces in the response are on the same level, and include nothing but the 5 text pieces separated by '\n' in the response. Given text: `+hint
  
    }
    else{
      console.log('word')
      var prompt = `given a word, give me 5 words that are 1 level more specific than given word. 
    The more specific level of a word can be achieved by finding hyponyms of that word.
    For example, “car” is one level more specific than “motor vehicle”, “motor vehicle” is one level more specific than self-propelled  vehicle”, “self-propelled vehicle” is one level more specific than “wheeled vehicle”; "blue"" is one level more specific than "color".
    Make sure all 5 words in the response are on the same level; and include nothing but the 5 words separated by '\n' in the response. Given word: `+hint
    }

        try {
        console.log('prompt for upgenerate', prompt)
        const response = await axios.post(ngrok_url_sonnet, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prompt: prompt })
        });
    
      const data = await response.data;
      const content = data?.content;
      console.log('content from handleDownGenerate:', content);
      if (content) {
        const textResponse = content;
        console.log('Response from handleDownGenerate:', textResponse);
        const generatedText = textResponse;
        const options = generatedText.split('\n').filter(Boolean);
        setGeneratedOptions(options);
      }
    }
    catch (error) {
      console.error("Error processing request:", error);
    } finally {
    }
  };

  const handleAutocompleteOptionClick = (option: string, hintText: string) => {
    const currentValue = userjs;
    const cursorPosition = editorRef.current?.selectionStart || 0;
    const textBeforeCursor = currentValue.slice(0, cursorPosition).replace(/\$[\w]*$|[\w]*$/, ''); // Remove the hintText and $ or double clicked word
    const textAfterCursor = currentValue.slice(cursorPosition+ hintText.length);
    const newText = textBeforeCursor + option + textAfterCursor;
    setuserJs(newText);
    setShowAutocomplete(false);
    setGeneratedOptions([]);
  };

  const AutocompleteWidget = () => (
    <div
      ref={widgetRef}
      className="autocomplete-widget"
      style={{
        position: 'absolute',
        top: autocompletePosition.top,
        left: autocompletePosition.left,
        zIndex: 1000,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        padding: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
      }}
    >
      {generatedOptions.length === 0 ? (
        <div className="button-container">
          <button onClick={() => handleUpGenerate(hintKeywords)}>⬆️</button>
          <button onClick={() => handleRightGenerate(hintKeywords)}>➡️</button>
          <button onClick={() => handleDownGenerate(hintKeywords)}>⬇️</button>
        </div>
      ) : (
        <ul className="autocomplete-options">
          {generatedOptions.map((option, index) => (
            <li
              key={index}
              className="autocomplete-option"
              onClick={() => handleAutocompleteOptionClick(option, hintKeywords)}
              style={{ padding: '5px', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const getCaretCoordinates = (element: HTMLTextAreaElement | null, position: number) => {
    if (!element) return { top: 0, left: 0 };
    const div = document.createElement('div');
    const style = getComputedStyle(element);
    [...style].forEach(prop => {
      div.style.setProperty(prop, style.getPropertyValue(prop));
    });
    div.style.position = 'absolute';
    div.style.whiteSpace = 'pre-wrap';
    div.style.visibility = 'hidden';
    div.style.top = '0';
    div.style.left = '0';
    document.body.appendChild(div);

    const text = element.value.substring(0, position);
    div.textContent = text;

    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);

    const coordinates = {
      top: span.offsetTop + element.offsetTop - element.scrollTop,
      left: span.offsetLeft + element.offsetLeft - element.scrollLeft
    };

    document.body.removeChild(div);
    return coordinates;
  };

  return (
    <div className="code-editor-container" style={{ position: 'relative' }}>
      {loading && <div className="loading-container"><ReactLoading type="spin" color="#007bff" height={50} width={50} /></div>}
      <div className="code-editor" style={{ height: '600px', width: '400px', overflow: 'auto' }} onKeyDown={handleKeyDown} onDoubleClick={handleDoubleClick} onContextMenu={handleRightClick}>
        {showAutocomplete && <AutocompleteWidget />}
        <CodeEditor
          value={userjs}
          language="js"
          padding={15}
          style={{
            fontSize: 15,
            backgroundColor: '#f5f5f5',
            fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
          }}
          ref={editorRef}
          onChange={(evn) => setuserJs(evn.target.value)}
        />
      </div>
      <div className="button-group">
        <button className="blue-button" onClick={() => handleRun(currentVersionId || '')}>Run</button>
        {/* <button className="blue-button" onClick={() => handleParseRun(currentVersionId || '')}>Parse and Run</button>
        <button className="purple-button" onClick={() => handleUpdateCode(currentVersionId || '')}>Update Code</button> */}
        <button
          className="green-button"
          onClick={() => setVersions(prevVersions => {
            const updatedVersions = prevVersions.map(version =>
              version.id === currentVersionId
                ? { ...version, highlightEnabled: !highlightEnabled }
                : version
            );
            return updatedVersions;
          })}
        >
          {highlightEnabled ? 'Disable Highlight' : 'Enable Highlight'}
        </button>
      </div>
    </div>
  );
};

export default CustomCodeEditor;
