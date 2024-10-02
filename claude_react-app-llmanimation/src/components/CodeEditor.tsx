import React, { useState, useEffect, useRef } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import ReactLoading from 'react-loading';
import { Version, KeywordTree } from '../types';
import axios from 'axios';
import ResultViewer from './ResultViewer'; // Import the ResultViewer component

interface CodeEditorProps {
  backendcode: { html: string }; // backend hidden
  usercode: { js: string }; // user use
  onApplyjs: (usercode: { js: string }, backendCode: { html: string }) => void;
  onApplyhtml: (usercode: { js: string }) => void;
  description: string;
  savedOldCode: { html: string; css: string; js: string };
  keywordTree: KeywordTree[];
  wordselected: string;
  currentVersionId: string | null;
  setVersions: React.Dispatch<React.SetStateAction<Version[]>>;
  versions: Version[];
  extractKeywords: (description: string) => KeywordTree[];
  activeTab: string;
  setActiveTab: (tab: string) => void; // Passed from parent (App component)
  onRunUserCode: (usercode: { js: string }) => void; // Add this prop
  ngrok_url_sonnet: string
}

// const API_KEY = '';
// const ngrok_url = 'https://82b7-34-46-65-154.ngrok-free.app';
// const ngrok_url_sonnet = ngrok_url + '/api/message';
// const ngrok_url_haiku = ngrok_url + '/api/message-haiku';

const CustomCodeEditor: React.FC<CodeEditorProps> = ({
  ngrok_url_sonnet,
  usercode,
  backendcode,
  onApplyjs,
  onApplyhtml,
  description,
  savedOldCode,
  keywordTree,
  wordselected,
  currentVersionId,
  setVersions,
  versions,
  extractKeywords,
  activeTab,
  setActiveTab, // Received from parent
  onRunUserCode
}) => {
  const [backendhtml, setbackendHtml] = useState(backendcode.html);
  const [userjs, setuserJs] = useState(usercode.js);
  // const [codeactiveTab, setActiveTab] = useState(activeTab);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showGenerateOption, setShowGenerateOption] = useState(false);
  const [showCoordcomplete, setShowCoordcomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [autocompletePositionbackup, setAutocompletePositionbackup] = useState({ top: 0, left: 0 });
  const [CoordcompletePosition, setCoordcompletePosition] = useState({ top: 0, left: 0 });
  const [hintKeywords, setHintKeywords] = useState('');
  const [generatedOptions, setGeneratedOptions] = useState<string[]>([]);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const [boldOptions, setBoldOptions] = useState<string[]>([]);
  const version = currentVersionId !== null ? versions.find((version) => version.id === currentVersionId) : null;
  const loading = version ? version.loading : false;
  const [optionLevels, setOptionLevels] = useState<{ options: string[]; position: { top: number; left: number } }[]>([]);
  const [buttonchoice, setButtonchoice] = useState('');
  //for modifyobjwidget
  const [svgCodeText, setSvgCodeText] = useState('');
  const [showModifyObjWidget, setShowModifyObjWidget] = useState(true);
  const [currentSelectedSVG, setCurrentSelectedSVG] = useState(''); // State to store the current codeName
  const [showmodifyobjbutton, setShowModifyObjButton] = useState(false);
  //for checksvgpiecewidget
  const [showCheckSVGPieceWidget, setShowCheckSVGPieceWidget] = useState(false)
  const [svgCodeText_checkpiece, setSvgCodeText_checkpiece] = useState('');
  //for checkwholesvgwidget
  const [showCheckWholeSVGWidget, setShowCheckWholeSVGWidget] = useState(false)
  const [svgCodeText_checkwholesvg, setSvgCodeText_checkwholesvg] = useState('');
  //for cachedobjectswidget
  const [showCachedObjWidget, setShowCachedObjWidget] = useState(false)

  const handleUpGenerateprompt_word = `Given a word, give me 5 words that are a more abstract and general level of the given word. 
        The more abstract level of a word can be achieved by finding hypernyms of that word.
        For example, “motor vehicle” is one level more abstract than “car”, “self-propelled vehicle” is one level more abstract than “motor vehicle”, “wheeled vehicle” is one level more abstract than “self-propelled vehicle”; “color” is one level more abstract than “blue”.
        Make sure all 5 words in the response are on the same level; and include nothing but the 5 words separated by '\n' in the response. Make sure the generated contents are also in the semantic space of ${hintKeywords}. If there's no more suitable text to be generated, return "no further generation". Given word: `;
;
  const handleUpGenerateprompt_sentence = `Given a text, give me 5 text pieces that are a more abstract and general level of the given text piece.
        The more abstract level of a text can be achieved by removing details, descriptions, and modifiers of the text and making it more generalizable.
        For example, "two parrots with feathers" is 1 level more abstract than "two beautiful parrots with colorful feathers", "two parrots" is 1 level more abstract than "two parrots with feathers"
        Make sure all the 5 text pieces in the response are on the same level, and include nothing but the 5 text pieces separated by '\n' in the response. Make sure the generated contents are also in the semantic space of ${hintKeywords}. If there's no more suitable text to be generated, return "no further generation". Given text: `;
;
  const handleDownGenerateprompt_word = `Given a word, give me 5 words that are 1 level more specific than the given word. 
        The more specific level of a word can be achieved by finding hyponyms of that word.
        For example, “car” is one level more specific than “motor vehicle”, “motor vehicle” is one level more specific than self-propelled vehicle”, “self-propelled vehicle” is one level more specific than “wheeled vehicle”; "blue" is one level more specific than "color".
        Make sure all 5 words in the response are on the same level; and include nothing but the 5 words separated by '\n' in the response. Make sure the generated contents are also in the semantic space of ${hintKeywords}. If there's no more suitable text to be generated, return "no further generation". Given word: `;
  
  const handleDownGenerateprompt_sentence = `Given a text, give me 5 text pieces that are 1 level more specific than the given text piece.
        The more specific level of a text can be achieved by adding details, descriptions, categories, and modifiers of the text and making it more specific.
        For example, "two beautiful parrots with colorful feathers" is 1 level more specific than "two parrots with feathers", "two parrots with features" is 1 level more specific than "two parrots"
        Make sure all the 5 text pieces in the response are on the same level, and include nothing but the 5 text pieces separated by '\n' in the response. Make sure the generated contents are also in the semantic space of ${hintKeywords}. If there's no more suitable text to be generated, return "no further generation". Given text: `;
  
  const handleRightGenerateprompt_word = `Given a word, give me 5 words that each are a variation of the given word.
        The variation text should have same amount of details and same format as the original word.
        For example,
        "blue", "purple", or "red" are variations of "yellow".
        "cow" and "person" are not variations of each other because they are of different categories.
        Include nothing but the 5 text pieces separated by '\n' in the response. Make sure the generated contents are also in the semantic space of ${hintKeywords}. If there's no more suitable text to be generated, return "no further generation". Given text: `;

  const handleRightGenerateprompt_sentence = `Given a text, give me 5 text pieces that each are a variation of the given text piece.
        The variation text should have same amount of details and same format as the original text, with various different details, descriptions, categories, and modifiers of the text to make it somewhat different.
        For example "A white passenger plane with two wings and a tail." is an variation of "A small, red biplane with a propeller in the front."
        "blue", "purple", or "red" are variations of "yellow".
        "cow" and "a horse with brown color running" are not variations of each other because they have different amount of details.
        Make sure the generated text pieces have same amount of details and same format as the original text. Include nothing but the 5 text pieces separated by '\n' in the response. Make sure the generated contents are also in the semantic space of ${hintKeywords}. If there's no more suitable text to be generated, return "no further generation". Given text: `;


  useEffect(() => {
    setbackendHtml(backendcode.html);
    setuserJs(usercode.js);
  }, [usercode, backendcode]);

  // useEffect(() => {
  //   console.log('showModifyObjWidget changed:', showModifyObjWidget);
  // }, [showModifyObjWidget]);
  

  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     var clickedOutside = true;
  //     console.log('handleclick outside', showModifyObjWidget)
    
  //     // Check if the click is inside any of the autocomplete widgets
  //     optionLevels.forEach((_, levelIndex) => {
  //       const widgetElement = document.getElementById(`autocomplete-widget-${levelIndex}`);
  //       if (widgetElement && widgetElement.contains(event.target as Node)) {
  //         clickedOutside = false;
  //       }
  //     });
    
  //     // Check if the click is inside the generate option widget
  //     if (widgetRef.current && widgetRef.current.contains(event.target as Node)) {
  //       clickedOutside = false;
  //     }
    
  //     // Check if the click is inside any of the autocomplete widgets
  //     const autocompleteWidgets = document.querySelectorAll('.autocomplete-widget');
  //     autocompleteWidgets.forEach((widget) => {
  //       if (widget.contains(event.target as Node)) {
  //         clickedOutside = false;
  //       }
  //     });
    
  //     // Check if the click is inside the coordinate widget (if it's shown)
  //     if (showCoordcomplete) {
  //       const coordWidgetElement = widgetRef.current;
  //       if (coordWidgetElement && coordWidgetElement.contains(event.target as Node)) {
  //         clickedOutside = false;
  //       }
  //     }
    
  //     // Check if the click is inside the modify object widget (if it's shown)
  //     if (showModifyObjWidget) {
  //       console.log('check showModifyObjWidget')
  //       const modifyObjWidgetElement = document.querySelector('.modify-obj-widget');
  //       if (modifyObjWidgetElement && modifyObjWidgetElement.contains(event.target as Node)) {
  //         clickedOutside = false;
  //       }
  //     }
    
  //     if (showCheckSVGPieceWidget) {
  //       console.log('check showCheckSVGPieceWidget')
  //       const CheckSVGPieceWidgetElement = document.querySelector('.check-svg-piece-widget');
  //       if (CheckSVGPieceWidgetElement && CheckSVGPieceWidgetElement.contains(event.target as Node)) {
  //         clickedOutside = false;
  //       }
  //     }
    
  //     if (showCheckWholeSVGWidget) {
  //       console.log('check showCheckWholeSVGWidget')
  //       const showCheckWholeSVGWidgetElement = document.querySelector('.check-svg-piece-widget');
  //       if (showCheckWholeSVGWidgetElement && showCheckWholeSVGWidgetElement.contains(event.target as Node)) {
  //         clickedOutside = false;
  //       }
  //     }
    
  //     // Check if the click is outside the cached object widget (and only close if the click is outside)
  //     if (showCachedObjWidget) {
  //       console.log('check showcachedobjwidget')
  //       const showCachedObjWidgetElement = document.querySelector('.cached-obj-widget');
  //       if (showCachedObjWidgetElement && showCachedObjWidgetElement.contains(event.target as Node)) {
  //         clickedOutside = false;
  //       } else {
  //         setShowCachedObjWidget(false);
  //       }
  //     }
    
  //     // If the click was outside all widgets, close the others
  //     if (clickedOutside) {
  //       console.log('Clicked outside');
  //       setOptionLevels([]);
  //       setShowAutocomplete(false);
  //       setShowGenerateOption(false);
  //       setShowCoordcomplete(false);
  //       // setShowModifyObjWidget(false);
  //       setVersions(prevVersions => {
  //         const updatedVersions = prevVersions.map(version => {
  //           const updatedHighlightedSVGPieceList = [];
  
  //           if (version.id === currentVersionId) {
  //             // Check if there's already an entry with the same codeText and update it, or append a new one
  //             return { ...version, highlightedSVGPieceList: updatedHighlightedSVGPieceList, };
  //           }
  //           return version;
  //         });
  //         return updatedVersions;
  //       });
  //       setSvgCodeText('');
  //       setShowCheckSVGPieceWidget(false);
  //       setShowCheckWholeSVGWidget(false);
  //       setShowModifyObjButton(false);
  //       setButtonchoice('');
  //     }
  //   };
    
    

  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside);
  //   };
  // }, [showModifyObjWidget, showCheckSVGPieceWidget, optionLevels, showAutocomplete, showGenerateOption, showCoordcomplete]);

  // const saveVersionToHistory = (currentVersionId: string) => {
  //   setVersions((prevVersions) => {
  //     const updatedVersions = prevVersions.map((version) => {
  //       if (version.id === currentVersionId) {
  //         const historyVersion = { ...version, id: `${currentVersionId}-history` };
  //         return { ...version, history: historyVersion };
  //       }
  //       return version;
  //     });
  //     return updatedVersions;
  //   });
  // };


  //make sure backendcode starts from original when new usercode is run
  const handleRun = (versionId: string) => {
    console.log('handlerun called')
    if(activeTab == 'js'){
      onApplyjs({ js: userjs }, {html: ``});
    console.log('run js, backendHtml back to initiate', backendhtml)
    }
    else{
      console.log('run html')
      onApplyhtml({ js: userjs })
    }

  };

  //auto completion
  const handleKeyDown = (event: React.KeyboardEvent) => {
    const selection = window.getSelection();
    const word = selection?.toString().trim();

    if (event.key === '$') {
      const cursorPosition = editorRef.current?.selectionStart || 0;
      const textBeforeCursor = userjs.slice(0, cursorPosition);
      const hintText = textBeforeCursor.split('$').pop();
      if (hintText) {
        setHintKeywords(hintText);
        const position = getCaretCoordinates(editorRef.current, cursorPosition - hintText.length - 1);
        setAutocompletePosition({ top: position.top, left: position.left });
        setShowAutocomplete(true);
      }
    }
    // if (event.key === '@') {
    //   const cursorPosition = editorRef.current?.selectionStart || 0;
    //   const textBeforeCursor = userjs.slice(0, cursorPosition);
    //   const hintText = textBeforeCursor.split('coord').pop();
    //   if (hintText) {
    //     setHintKeywords(hintText);
    //     const position = getCaretCoordinates(editorRef.current, cursorPosition - hintText.length - 1);
    //     setCoordcompletePosition({ top: position.top, left: position.left });
    //     setShowCoordcomplete(true);
    //   }
    // }
  };

  // const handleDoubleClick = (event: React.MouseEvent) => {
  //   const selection = window.getSelection();
  //   const word = selection?.toString().trim();

  //   const currentVersion = versions.find(version => version.id === currentVersionId);
  //   if (!currentVersion) {
  //     console.log('No current version found');
  //     return;
  //   }

  //   //for showing the svg piece with widgets
  //   const piece = currentVersion.previousSelectedSVGPieceList?.find(item => item.codeName === word);
  //   //console.log('selected piece:', word, piece, currentVersion.previousSelectedSVGPieceList)

  //   if (piece) {
  //     const parentSVG = currentVersion.reuseableSVGElementList.find(svg => svg.codeName === piece.parentSVG);
  //     //console.log('parent svg:', parentSVG)
  //     if (parentSVG) {
  //       const cursorPosition = editorRef.current?.selectionStart || 0;
  //       const position = getCaretCoordinates(editorRef.current, cursorPosition - word.length);
  //       setAutocompletePosition({ top: position.top + 50, left: position.left });
  //       setSvgCodeText_checkpiece(parentSVG.codeText);
  //       setCurrentSelectedSVG(piece.codeName);
  //       setShowCheckSVGPieceWidget(true); // Show the CheckSVGPieceWidget
  //       return;
  //     }
  //   }
  //   //for showing svgname with widgets
  //   const svg = currentVersion.reuseableSVGElementList?.find(item => item.codeName === word)?.codeText;
  //   //console.log('selected piece:', word, piece, currentVersion.previousSelectedSVGPieceList)

  //   if (svg) {
  //       const cursorPosition = editorRef.current?.selectionStart || 0;
  //       const position = getCaretCoordinates(editorRef.current, cursorPosition - word.length);
  //       setAutocompletePosition({ top: position.top + 50, left: position.left });
  //       setSvgCodeText_checkwholesvg(svg);
  //       setShowCheckWholeSVGWidget(true); // Show the CheckSVGPieceWidget
  //       return;
  //   }
    
  //     if (word === 'context') {
  //       console.log('double-clicked on context');
  //       setShowModifyObjButton(true)
  //       const currentVersion = versions.find(version => version.id === currentVersionId);
  //       if (!currentVersion) {
  //         console.log('No current version found');
  //         return;
  //       }
    
  //       const currentreuseableSVGElementList = currentVersion.reuseableSVGElementList;
  //       console.log('reuseableSVGElementList', currentVersion, currentreuseableSVGElementList);
    
  //       if (currentreuseableSVGElementList) {
  //         const cursorPosition = editorRef.current?.selectionStart || 0;
  //         const position = getCaretCoordinates(editorRef.current, cursorPosition - word.length);
  //         setAutocompletePosition({ top: position.top + 50, left: position.left });
  //         setShowModifyObjWidget(true); // Show the widget
  //         //setSelectedCodeText(''); // Reset the selected code text
  //       } else {
  //         console.log('reuseableSVGElementList is undefined or empty');
  //       }
  //     }


  //     if (word === 'cachedobjects') {
  //       console.log('double-clicked on cachedobjects');

  //       const cursorPosition = editorRef.current?.selectionStart || 0;
  //       const position = getCaretCoordinates(editorRef.current, cursorPosition - word.length);
  //       setAutocompletePosition({ top: position.top + 50, left: position.left });
  //       setShowCachedObjWidget(true); // Show the widget
  //     }

  //     if (word === 'useobj') {
  //       console.log('double-clicked on useobjhh');
  //       const currentVersion = versions.find(version => version.id === currentVersionId);
  //       if (!currentVersion) {
  //         console.log('No current version found');
  //         return;
  //       }
    
  //       const currentreuseableSVGElementList = currentVersion.reuseableSVGElementList;
  //       console.log('reuseableSVGElementList', currentVersion, currentreuseableSVGElementList);
    
  //       if (currentreuseableSVGElementList) {
  //         const cursorPosition = editorRef.current?.selectionStart || 0;
  //         const position = getCaretCoordinates(editorRef.current, cursorPosition - word.length);
  //         setAutocompletePosition({ top: position.top + 50, left: position.left });
  //         setShowModifyObjWidget(true); // Show the widget
  //         //setSelectedCodeText(''); // Reset the selected code text
  //         console.log('clicked on modifyobj', showModifyObjWidget)
  //       } else {
  //         console.log('reuseableSVGElementList is undefined or empty');
  //       }
  //     }


  //   if (word == 'coord'){
  //     setHintKeywords(word);
  //     const cursorPosition = editorRef.current?.selectionStart || 0;
  //     const position = getCaretCoordinates(editorRef.current, cursorPosition - word.length);
  //     setCoordcompletePosition({ top: position.top + 50, left: position.left });
  //     setShowCoordcomplete(true);
  //   }
  //   else if(word != 'context'&&word != 'useobj'&&word != 'cachedobjects'){
  //     setHintKeywords(word);
  //     const cursorPosition = editorRef.current?.selectionStart || 0;
  //     const position = getCaretCoordinates(editorRef.current, cursorPosition - word.length);
  //     setAutocompletePosition({ top: position.top + 50, left: position.left });
  //     // const initialOptions = [word]; // You can replace this with an array of initial options if available
  //     // setOptionLevels([{ options: initialOptions, position }]);
  //     setShowGenerateOption(true);
  //   }
  // };

  // const handleRightClick = (event: React.MouseEvent) => {
  //   event.preventDefault();
  //   const selection = window.getSelection();
  //   const word = selection?.toString().trim();
  //     if (word) {
  //     const cursorPosition = editorRef.current?.selectionStart || 0;
  //     const position = getCaretCoordinates(editorRef.current, cursorPosition - word.length);
  //     setHintKeywords(word);
  //     const rect = editorRef.current?.getBoundingClientRect();
  //     if (rect) {
  //       setAutocompletePosition({ top: position.top + 50, left: position.left });
  //       // const initialOptions = [word]; // You can replace this with an array of initial options if available
  //       // setOptionLevels([{ options: initialOptions, position }]);
  //       setShowGenerateOption(true);
  //     }
  //   }
  // };

  const handleUpGenerate = async (hint: string, levelIndex = 0) => {
    setButtonchoice('up') // for ...
    let prompt = '';
    if (hint.includes(' ')) {
      prompt = handleUpGenerateprompt_sentence+hint
    } else {
      prompt = handleUpGenerateprompt_word + hint
    }

    try {
      const response = await axios.post(ngrok_url_sonnet, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.data;
      const content = data?.content;
      if (content) {
        const options = content.split('\n').filter(Boolean);
        const position = { top: autocompletePosition.top, left: autocompletePosition.left };
        //setOptionLevels([{ options, position }]); // Initialize with the first level
        setOptionLevels((prevLevels) => {
          const updatedLevels = [...prevLevels];
          updatedLevels.splice(levelIndex + 1, prevLevels.length - levelIndex - 1, { options: options, position: position });
          return updatedLevels;
        });
        console.log('option levels:', optionLevels)
        setGeneratedOptions(options); //just to pass variables to proceedfunction
        setShowAutocomplete(true)
        }
    } catch (error) {
      console.error('Error processing request:', error);
    }
  };

  const handleRightGenerate = async (hint: string, levelIndex = 0) => {
    setButtonchoice('right') // for ...
    var prompt = '';

    if (hint.includes(' ')) {
      prompt = handleRightGenerateprompt_sentence+hint
    } else {
      prompt = handleRightGenerateprompt_word + hint
    }
    console.log('generate prompt', prompt)
    try {
      const response = await axios.post(ngrok_url_sonnet, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.data;
      const content = data?.content;
      if (content) {
        const options = content.split('\n').filter(Boolean);
        const position = { top: autocompletePosition.top, left: autocompletePosition.left };
        //setOptionLevels([{ options, position }]); // Initialize with the first level
        setOptionLevels((prevLevels) => {
          const updatedLevels = [...prevLevels];
          updatedLevels.splice(levelIndex + 1, prevLevels.length - levelIndex - 1, { options: options, position: position });
          return updatedLevels;
        });
        console.log('option levels:', optionLevels)
        setGeneratedOptions(options); //just to pass variables to proceedfunction
        setShowAutocomplete(true)
        }
    } catch (error) {
      console.error('Error processing request:', error);
    }
  };

  const handleDownGenerate = async (hint: string, levelIndex = 0) => {
    setButtonchoice('down') // for ...
    let prompt = '';
    if (hint.includes(' ')) {
      prompt = handleDownGenerateprompt_sentence+hint
    } else {
      prompt = handleDownGenerateprompt_word + hint
    }

    try {
      const response = await axios.post(ngrok_url_sonnet, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.data;
      const content = data?.content;
      if (content) {
        const options = content.split('\n').filter(Boolean);
        const position = { top: autocompletePosition.top, left: autocompletePosition.left };
        //setOptionLevels([{ options, position }]); // Initialize with the first level
        setOptionLevels((prevLevels) => {
          const updatedLevels = [...prevLevels];
          updatedLevels.splice(levelIndex + 1, prevLevels.length - levelIndex - 1, { options: options, position: position });
          return updatedLevels;
        });
        console.log('option levels:', optionLevels)
        setGeneratedOptions(options); //just to pass variables to proceedfunction
        setShowAutocomplete(true)
        }
    } catch (error) {
      console.error('Error processing request:', error);
    }
  };

  const handleExistingCode = async (hint: string, levelIndex = 0) => {
    const currentreuseableSVGElementList = versions.find(version => version.id === currentVersionId)?.reuseableSVGElementList;
    
    if (currentreuseableSVGElementList) {
      const codenamelist = currentreuseableSVGElementList.map(item => item.codeName)
      const options = codenamelist;
      console.log('codelist', options)
      setShowAutocomplete(true)
      setButtonchoice('')
      if(options.length >0){
        const position = { top: autocompletePosition.top, left: autocompletePosition.left };
        //setOptionLevels([{ options, position }]); // Initialize with the first level
        setOptionLevels((prevLevels) => {
          const updatedLevels = [...prevLevels];
          updatedLevels.splice(levelIndex + 1, prevLevels.length - levelIndex - 1, { options: options, position: position });
          return updatedLevels;
        });
        console.log('optionlevels set', optionLevels)
      }

    }
  };

  const handleAutocompleteOptionClick = (option: string, hintText: string) => {
    const currentValue = userjs;
    const cursorPosition = editorRef.current?.selectionStart || 0;
    const textBeforeCursor = currentValue.slice(0, cursorPosition).replace(new RegExp(`${hintText}$`), '');
    const textAfterCursor = currentValue.slice(cursorPosition + hintText.length);
    const newText = textBeforeCursor + option + textAfterCursor;
    console.log('handleAutocompleteOptionClick, new text', newText)
    setuserJs(newText);
    setShowAutocomplete(false);
    setShowGenerateOption(false);
    setOptionLevels([]);
    setButtonchoice('');
  };

  const handleCoordcompleteOptionClick = (option: string, hintText: string) => {
    const currentValue = userjs;
    const cursorPosition = editorRef.current?.selectionStart || 0;
    const textBeforeCursor = currentValue.slice(0, cursorPosition).replace(new RegExp(`${hintText}$`), '');
    const textAfterCursor = currentValue.slice(cursorPosition + hintText.length);
    const newText = textBeforeCursor + option + textAfterCursor;
    setuserJs(newText);
    setShowAutocomplete(false);
    setGeneratedOptions([]);
  };


  const proceedGeneration = async (option: string, levelIndex: number) => {
    let prompt = '';

    if (buttonchoice == 'down'){
      console.log('proceedgeneration, option', option, buttonchoice)
      if (option.includes(' ')) {
        prompt = handleDownGenerateprompt_sentence+option    
      } else {
        prompt = handleDownGenerateprompt_word+option    
      }
    }

    if (buttonchoice == 'up'){
      console.log('proceedgeneration, option', option, buttonchoice)
      if (option.includes(' ')) {
        prompt = handleUpGenerateprompt_sentence+option    
      } else {
        prompt = handleUpGenerateprompt_word+option    
      }
    }    

    if (buttonchoice == 'right'){
      console.log('proceedgeneration, option', option, buttonchoice)
      if (option.includes(' ')) {
        prompt = handleRightGenerateprompt_sentence+option    
      } else {
        prompt = handleRightGenerateprompt_word+option    
      }
    }
    
    try {
      const response = await axios.post(ngrok_url_sonnet, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.data;
      const content = data?.content;
      console.log('proceedgeneration, option', option, prompt, content)
      if (content) {
        const newOptions = content.split('\n').filter(Boolean);
        const newPosition = {
          top: optionLevels.length > 0 ? optionLevels[levelIndex].position.top : 0,
          left: optionLevels.length > 0 ? optionLevels[levelIndex].position.left + 200 : 0,
        };
        
        setOptionLevels((prevLevels) => {
          const updatedLevels = [...prevLevels];
          updatedLevels.splice(levelIndex + 1, prevLevels.length - levelIndex - 1, { options: newOptions, position: newPosition });
          return updatedLevels;
        });
        console.log('proceed: optionlevels', optionLevels)
      }
    } catch (error) {
      console.error('Error processing request:', error);
    }
  };
  
  const GenerateOptionWidget = ({ hintKeywords }: { hintKeywords: string }) => (
    <div
      id="code-generate-option-widget"
      ref={widgetRef}
      className="generate-option-widget"
      style={{
        position: 'absolute',
        top: autocompletePosition.top,
        left: autocompletePosition.left,
        zIndex: 1000,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        padding: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="button-container">
        <button onClick={() => handleUpGenerate(hintKeywords)}>🔼</button>
        <button onClick={() => handleRightGenerate(hintKeywords)}>🔄</button>
        <button onClick={() => handleDownGenerate(hintKeywords)}>🔽</button>
        <button onClick={() => handleExistingCode(hintKeywords)}>℀</button>
      </div>
    </div>
  );
  
  const AutocompleteWidget = ({ options, levelIndex }: { options: string[], levelIndex: number }) => {
    const [checkedOptions, setCheckedOptions] = useState<string[]>([]);
  
    const handleCheckboxChange = (option: string) => {
      setCheckedOptions((prev) => {
        if (prev.includes(option)) {
          return prev.filter((item) => item !== option);
        } else {
          return [...prev, option];
        }
      });
    };
  
    const handleEqualButtonClick = () => {
      const combinedText = checkedOptions.join('\', \'');
      const currentValue = userjs;
      const cursorPosition = editorRef.current?.selectionStart || 0;
      const textBeforeCursor = currentValue.slice(0, cursorPosition);
      const textAfterCursor = currentValue.slice(cursorPosition);
      const newText = textBeforeCursor + combinedText + textAfterCursor;
      setuserJs(newText);
      setShowAutocomplete(false);
      setShowGenerateOption(false);
      setOptionLevels([]);
    };
  
    const handleProceedClick = (option: string) => {
      if (!boldOptions.includes(option)) {
        setBoldOptions([...boldOptions, option]); // Add option to boldOptions array
      }
      console.log('bold options', boldOptions);
      proceedGeneration(option, levelIndex);
    };
  
    return (
      <div
        id={`autocomplete-widget-${levelIndex}`}
        className="autocomplete-widget"
        style={{
          position: 'absolute',
          top: optionLevels[levelIndex]?.position.top || autocompletePosition.top,
          left: optionLevels[levelIndex]?.position.left || autocompletePosition.left,
          zIndex: 1000,
          backgroundColor: 'white',
          border: '1px solid #ccc',
          padding: '10px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          width: '200px', // Fixed width to provide more space for longer texts
          fontSize: '14px', // Smaller font size
        }}
      >
        <ul className="autocomplete-options" style={{ margin: 0, padding: 0, listStyleType: 'none' }}>
          {options.map((option, index) => (
            <li
              key={index}
              className="autocomplete-option"
              style={{
                padding: '5px',
                cursor: 'pointer',
                whiteSpace: 'pre-wrap', // Allow text to wrap onto the next line
                overflow: 'hidden', // Hide overflow text
                textOverflow: 'ellipsis', // Show ellipsis for overflowing text
                fontWeight: boldOptions.includes(option) ? 'bold' : 'normal', // Apply bold if in boldOptions
                wordWrap: 'break-word', // Ensure words break to the next line if they are too long
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <input
                type="checkbox"
                checked={checkedOptions.includes(option)}
                onChange={() => handleCheckboxChange(option)}
                style={{ marginRight: '5px' }}
              />
              <span
                onClick={() => handleAutocompleteOptionClick(option, hintKeywords)}
                style={{ flexGrow: 1 }}
              >
                {option}
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent the click event from propagating to the list item
                  handleProceedClick(option); // Bold the option and proceed with generation
                }} 
                style={{
                  marginLeft: '10px',
                  padding: '2px 5px',
                  fontSize: '10px',
                }}
              >
                ...
              </button>
            </li>
          ))}
        </ul>
        <button
          onClick={handleEqualButtonClick}
          style={{
            marginTop: '10px',
            width: '100%',
            padding: '5px 0',
            backgroundColor: 'transparent', // No background color
            color: 'inherit', // Inherit the default text color
            border: 'none',
            cursor: 'pointer',
            textAlign: 'center', // Center the text
          }}
        >
          create array
        </button>
      </div>
    );
  };

  const handleModifyobjOptionClick = (option: string, hintText: string) => {
    const word = 'modifyobj'
      //const codeNames = currenthighlightedSVGPieceList.map(item => item.codeName).join('\', \'');
      const cursorPosition = editorRef.current?.selectionStart || 0;
      const textBeforeCursor = userjs.slice(0, cursorPosition+word.length);
      const textAfterCursor = userjs.slice(cursorPosition+word.length);
      const newText = textBeforeCursor + '= {objname: \'' + option + '\', piecenames: [], pieceprompts: []}'+ textAfterCursor;
      setuserJs(newText);
      setShowModifyObjWidget(false)

  };

  const handleUseobjOptionClick = (option: string, hintText: string) => {
    const word = 'useobj'
      //const codeNames = currenthighlightedSVGPieceList.map(item => item.codeName).join('\', \'');
      const cursorPosition = editorRef.current?.selectionStart || 0;
      const textBeforeCursor = userjs.slice(0, cursorPosition+word.length);
      const textAfterCursor = userjs.slice(cursorPosition+word.length);
      const newText = textBeforeCursor + ': {objname: \'' + option + '\'}'+ textAfterCursor;
      setuserJs(newText);
      setShowModifyObjWidget(false)

  };
  
  const ModifyObjWidget = () => {
    const currentVersion = versions.find((version) => version.id === currentVersionId);
    const currentreuseableSVGElementList = currentVersion?.reuseableSVGElementList || [];
    const [objNameInput, setObjNameInput] = useState(currentSelectedSVG); // State for the object name input
    const [currentPieceName, setCurrentPieceName] = useState(''); // Track the currently clicked piece name
    const [savedSvgCodeText, setSavedSvgCodeText] = useState('')
    const [piecePrompts, setPiecePrompts] = useState({}); // Store prompts for each piece
    const [groupNameInput, setGroupNameInput] = useState('');
    const iframeRef = useRef<HTMLIFrameElement>(null);
    useEffect(() => {
        // console.log('ModifyObjWidget useeffect called', svgCodeText)
        const iframe = iframeRef.current;
        const sanitizeSVG = (svgString) => {
          // Sanitize the SVG string if necessary here
          return svgString.trim(); // Simple trim; add more sanitization if needed
        };
        
        if (iframe) {
          const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    
          iframeDocument.open(); // Open the document for writing
          iframeDocument.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <!-- head content -->
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
                svg {
                  width: 100%;
                  height: 100%;
                }
              </style>
            </head>
            <body>
              <div id="canvasContainer">
                ${sanitizeSVG(svgCodeText)}
              </div>
            </body>
            </html>
          `);
          iframeDocument.close(); // Close the document to complete writing
    
          // Wait for the iframe's content to load before manipulating the SVG elements
          iframe.onload = () => {
            const svgElement = iframeDocument.querySelector('svg');
            if (svgElement) {
              attachHighlightListeners(svgElement);
            }
          };
        }
      }, [svgCodeText]);

      const handlePieceClick = (pieceCodeName: string) => {
      
      //for showing the svg piece with widgets
    const piece = currentVersion.previousSelectedSVGPieceList?.find(item => item.codeName === pieceCodeName);
    //console.log('selected piece:', word, piece, currentVersion.previousSelectedSVGPieceList)

    if (piece) {
      const parentSVG = currentVersion.reuseableSVGElementList.find(svg => svg.codeName === piece.parentSVG);
      //console.log('parent svg:', parentSVG)
      if (parentSVG) {
        const cursorPosition = editorRef.current?.selectionStart || 0;
        const position = getCaretCoordinates(editorRef.current, cursorPosition);
        setAutocompletePositionbackup({ top: 600, left: 0 });
        console.log('check position', position)
        setSvgCodeText_checkpiece(parentSVG.codeText);
        // setCurrentSelectedSVG(piece.codeName);
        setShowCheckSVGPieceWidget(true); // Show the CheckSVGPieceWidget
        return;
      }
    }
      };


    const attachHighlightListeners = (svgElement: SVGElement) => {
        svgElement.querySelectorAll('*').forEach(svgChildElement => {
            svgChildElement.addEventListener('click', toggleHighlight);
        });
    };

    const update_svgpiece = (codename: string, codetext:string) =>{

      console.log('added svg:', codetext);
        const newElementBaseName = codename;
        let newElementName = newElementBaseName;
        const newElement = {
          codeName: newElementName,
          codeText: codetext,
          selected: false,
          parentSVG: currentSelectedSVG
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

    const remove_svgpiece = (codetext:string) => {
        console.log('removing svg:', codetext)
        // Remove a specific SVG piece from the highlightedSVGPieceList by matching codeText
        setVersions(prevVersions => {
          const updatedVersions = prevVersions.map(version => {
            if (version.id === currentVersionId) {
              const updatedhighlightedSVGPieceList = version.highlightedSVGPieceList?.filter(
                element => element.codeText !== codetext
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

    function findSVGAncestor(element) {
      while (element && element.tagName.toLowerCase() !== 'svg') {
          element = element.parentElement;
      }
      return element;
  }
    const toggleHighlight = (event: MouseEvent) => {
        event.stopPropagation();
        const target = event.currentTarget as SVGElement;
        console.log('target:', target, target.outerHTML)
        const isHighlighted = target.getAttribute('data-highlighted') === 'true';

        if (isHighlighted) {
            const originalStroke = target.getAttribute('data-original-stroke') || 'none';
            const originalStrokeWidth = target.getAttribute('data-original-stroke-width') || '1';
            target.setAttribute('stroke', originalStroke);
            target.setAttribute('stroke-width', originalStrokeWidth);
            target.removeAttribute('data-highlighted');
            target.removeAttribute('data-original-stroke-width');
            target.removeAttribute('data-original-stroke');
            if (originalStroke === 'none' && parseFloat(originalStrokeWidth) === 0) {
                target.removeAttribute('stroke');
                target.removeAttribute('stroke-width');
            }
            const svgString = target.outerHTML;
            remove_svgpiece(svgString)
            setSvgCodeText(findSVGAncestor(target).outerHTML)
            console.log('done update', svgString, findSVGAncestor(target))
            //window.parent.postMessage({ type: 'REMOVE_SVGPIECE', codetext: svgString }, '*');
            
        } else {
            const clonedTarget = target.cloneNode(true);
            const originalStroke = target.getAttribute('stroke') || 'none';
            const originalStrokeWidth = target.getAttribute('stroke-width') || '0';
            target.setAttribute('data-original-stroke', originalStroke);
            target.setAttribute('data-original-stroke-width', originalStrokeWidth);
            target.setAttribute('stroke', 'yellow');
            target.setAttribute('stroke-width', parseFloat(originalStrokeWidth) + 10);
            target.setAttribute('data-highlighted', 'true');
            const svgString = clonedTarget.outerHTML;
            //console.log('before update', svgCodeText)
            update_svgpiece(svgString.split(' ')[0].split('<')[1], svgString)
            setSvgCodeText(findSVGAncestor(target).outerHTML) 
            console.log('done update', svgString, findSVGAncestor(target))
        }
    };

    // Function to remove highlights from all elements in the highlightedElements array
    const removeAllHighlights = () => {
      const iframe = iframeRef.current;
      if (iframe) {
          const iframeDocument = iframe.contentDocument;
          const svgElements = iframeDocument?.querySelectorAll('svg *');
  
          svgElements?.forEach((target) => {
              const isHighlighted = target.getAttribute('data-highlighted') === 'true';
  
              if (isHighlighted) {
  
                  const originalStroke = target.getAttribute('data-original-stroke') || 'none';
                  const originalStrokeWidth = target.getAttribute('data-original-stroke-width') || '1';
  
                  target.setAttribute('stroke', originalStroke);
                  target.setAttribute('stroke-width', originalStrokeWidth);
  
                  target.removeAttribute('data-highlighted');
                  target.removeAttribute('data-original-stroke-width');
                  target.removeAttribute('data-original-stroke');
  
                  if (originalStroke === 'none' && parseFloat(originalStrokeWidth) === 0) {
                      target.removeAttribute('stroke');
                      target.removeAttribute('stroke-width');
                  }
                  const svgString = target.outerHTML;
                  remove_svgpiece(svgString); // Remove the piece from the list
              }
          });
  
          // Update the SVG code in the editor
          const svgRootElement = iframeDocument?.querySelector('svg');
          if (svgRootElement) {
              setSvgCodeText(svgRootElement.outerHTML);
          }
      }
  };
  

    const handleRenderSVGClick = (codeName: string, codeText: string) => {
        setSvgCodeText(codeText);
        setCurrentSelectedSVG(codeName)
    };

    const handleApplyClick = () => {
        console.log("Apply button clicked for:", currentSelectedSVG);
        //deal with highlight
        //empty_svgpiece();]
        setSvgCodeText(savedSvgCodeText)
        removeAllHighlights();
        setSvgCodeText('');

        //deal with auto completion
        const word = 'modifyobj'
        const currentVersion = versions.find(version => version.id === currentVersionId);
        if (!currentVersion) {
          console.log('No current version found');
          return;
        }
    
        const currenthighlightedSVGPieceList = currentVersion.highlightedSVGPieceList;
        console.log('svgpieces', currentVersion, currenthighlightedSVGPieceList);
    
        if (currenthighlightedSVGPieceList) {
          const codeNames = currenthighlightedSVGPieceList.map(item => item.codeName).join('\', \'');
          const cursorPosition = editorRef.current?.selectionStart || 0;
          const textBeforeCursor = userjs.slice(0, cursorPosition+word.length);
          const textAfterCursor = userjs.slice(cursorPosition+word.length);
          var newText
          if(currenthighlightedSVGPieceList.map(item => item.codeName).length>0){
            newText = textBeforeCursor + '= {objname: \'' + currentSelectedSVG + '\', piecenames: [\''+ codeNames + '\' ], pieceprompts: []}'+ textAfterCursor;
          }
          else{
            newText = textBeforeCursor + '= {objname: \'' + currentSelectedSVG + '\', piecenames: [], pieceprompts: []}'+ textAfterCursor;
          }
          setuserJs(newText);
          setShowModifyObjWidget(false)
          setSvgCodeText('')
          setShowModifyObjButton(false)
        } else {
          console.log('highlightedSVGPieceList is undefined or empty');
        }
    };

    const handleRenameObject = () => {
      if (!objNameInput) return;
      setCurrentSelectedSVG(objNameInput);
      setVersions((prevVersions) => {
        const updatedVersions = prevVersions.map((version) => {
          if (version.id === currentVersionId) {
            const updatedReusableSVGList = version.reuseableSVGElementList.map((element) => {
              if (element.codeName === currentSelectedSVG) {
                return { ...element, codeName: objNameInput }; // Update the object name
              }
              return element;
            });
    
            // Also update the cachedobjectslog if it exists in sessionStorage
            const cachedObjectsLog = JSON.parse(sessionStorage.getItem('cachedobjects'));
            if (cachedObjectsLog) {
              const updatedCachedObjectsLog = JSON.parse(JSON.stringify(cachedObjectsLog));
              if (updatedCachedObjectsLog[currentSelectedSVG]) {
                updatedCachedObjectsLog[objNameInput] = {
                  ...updatedCachedObjectsLog[currentSelectedSVG],
                  objname: objNameInput, // Update the objname property
                };
                delete updatedCachedObjectsLog[currentSelectedSVG];
                sessionStorage.setItem('cachedobjects', JSON.stringify(updatedCachedObjectsLog));
              }
            }
    
            return { ...version, reuseableSVGElementList: updatedReusableSVGList };
          }
          return version;
        });
    
        return updatedVersions;
      });
    };

    //for showing pieces
    function toggleSvgElementClosure(svgString: string) {
      // First, check if it's a self-closing tag
      if (svgString.endsWith('/>')) {
        // If it's self-closing, change it to an open-and-close tag
        return svgString.replace('/>', `></${svgString.match(/^<(\w+)/)[1]}>`);
      } else {
        // If it's not self-closing, make it self-closing
        return svgString.replace(/><\/\w+>$/, '/>');
      }
    }
  
    function highlightAndReplaceSVG(svgText: string, pieceText: string): string {
      // Step 1: Find the matching piece in svgText
      const placeholder = '[placeholder]';
  
      //incase the difference of self-closing or not, check both
      const pieceText2 = toggleSvgElementClosure(pieceText);
  
      // Step 3: Determine which version (pieceText or pieceText_alternative) contains the self-closing `/>`
      var pieceText3 = pieceText2.includes('/>') ? pieceText2 : pieceText;
  
      // Step 4: Check if it contains ` />` (a space before the self-closing tag)
      if (pieceText3.includes('/>')) {
          // Replace ` />` with `/>` (remove the space)
          pieceText3 = pieceText3.replace('/>', ' />');
      }
  
      const matchedPiece1 = svgText.includes(pieceText) ? pieceText : '';
      const matchedPiece2 = svgText.includes(pieceText2) ? pieceText2 : '';
      const matchedPiece3 = svgText.includes(pieceText3) ? pieceText3 : '';
  
      const matchedPiece = matchedPiece1 || matchedPiece2 || matchedPiece3;
  
      console.log('3 piece choices', pieceText, pieceText2, pieceText3)
  
      if (!matchedPiece) {
          console.log('No matching piece found in the SVG.', 'svgtext\n', svgText, 'piecetext\n', pieceText);
          return svgText;
      }
  
      // Step 2: Replace the match string with [placeholder]
      const updatedSVGText = svgText.replace(matchedPiece, placeholder);
  
      // Step 3: Turn pieceText into a DOM element (pieceElement)
      const parser = new DOMParser();
      const pieceDoc = parser.parseFromString(pieceText, 'image/svg+xml');
      const pieceElement = pieceDoc.querySelector('*');  // Adjust selector if pieceText could be something other than a path
  
      if (pieceElement) {
          // Step 4: Highlight the piece
          const originalStroke = pieceElement.getAttribute('stroke') || 'none';
          const originalStrokeWidth = pieceElement.getAttribute('stroke-width') || '0';
          pieceElement.setAttribute('data-original-stroke', originalStroke);
          pieceElement.setAttribute('data-original-stroke-width', originalStrokeWidth);
          pieceElement.setAttribute('stroke', 'yellow');
          pieceElement.setAttribute('stroke-width', (parseFloat(originalStrokeWidth) + 10).toString());
          pieceElement.setAttribute('data-highlighted', 'true');
  
          // Step 5: Get the updated piece text
          const updatedPieceText = pieceElement.outerHTML;
  
          // Step 6: Replace the placeholder with updatedPieceText
          const finalSVGText = updatedSVGText.replace(placeholder, updatedPieceText);
  
          return finalSVGText;
      }
  
      console.log('Failed to parse the piece element.');
      return svgText;
  }
    const highlightPiece = (svgCode: string, pieceCodeName: string) => {
        // Find the matching SVG element by comparing codeText with the pieceName
        const currentVersion = versions.find(version => version.id === currentVersionId);
        const pieceText = currentVersion?.previousSelectedSVGPieceList.find(item => item.codeName === pieceCodeName)?.codeText;
        const updatedSvgCode = highlightAndReplaceSVG(svgCode, pieceText)
        return updatedSvgCode
    };


    const handleModifyPieces = () => {
      
      setVersions(prevVersions => {
        const updatedVersions = prevVersions.map(version => {
          const updatedHighlightedSVGPieceList = [];

          if (version.id === currentVersionId) {
            const modifiedPieces = currentVersion.highlightedSVGPieceList.map(piece => ({
              codeName: piece.codeName,
              prompt: piecePrompts[piece.codeName] || '', // Get the corresponding prompt
            }));
    
            const modifiedEntry = {
              codeName: currentSelectedSVG,
              pieces: modifiedPieces.map(item => item.codeName),
              pieceprompts: modifiedPieces.map(item => item.prompt),
            };
    
            // Check if there's already an entry with the same codeText and update it, or append a new one
            const existingModifyPieceList = version.modifyPieceList || [];
            const updatedModifyPieceList = existingModifyPieceList.filter(
              entry => entry.codeName !== modifiedEntry.codeName
            );
    
            // Add the modified entry (which overwrites any existing entry with the same codeText)
            updatedModifyPieceList.push(modifiedEntry);
            console.log('check moedifypiece prompts', modifiedEntry)
            const cachedObjects = JSON.parse((sessionStorage.getItem('cachedobjects')))
            updateobject_modifypieces(modifiedEntry, cachedObjects[currentSelectedSVG])
            return { ...version, modifyPieceList: updatedModifyPieceList, highlightedSVGPieceList: updatedHighlightedSVGPieceList, };
          }
          return version;
        });
        return updatedVersions;
      });
      
    };
    
    async function updateobject_modifypieces(modifiedEntry , currentobject){
      // Create a new list: piececode by getting codeText using this.piecemodify elements as codeName from window.currentreuseablesvgpieces
          let piececode = modifiedEntry.pieces.map(codeName => {
            const currentVersion = versions.find(version => version.id === currentVersionId);
            const piece = currentVersion.highlightedSVGPieceList.find(item => item.codeName === codeName);
            return piece ? piece.codeText : null;
        }).filter(codeText => codeText !== null);

        // Initialize the APIprompt
        let modifyprompt = '';

        // For each element A in piececode and element B in piecemodify, create a prompt
        piececode.forEach((codePiece, index) => {
            const modification = modifiedEntry.pieceprompts[index];
            modifyprompt += `Make modification:` +  modification + ` to svg code piece:` + codePiece+`. `;
        });

          // Clone the object from currentVersion or cachedObjectsLog based on currentSelectedSVG
  const currentVersion = versions.find(version => version.id === currentVersionId);
  const cachedObjectsLog = JSON.parse(sessionStorage.getItem('cachedobjects')) || {};
  
  // Find the object in reuseableSVGElementList
  let OriginalObject_reuseableSVGElementList = currentVersion.reuseableSVGElementList.find(item => item.codeName === currentSelectedSVG);

  if (!OriginalObject_reuseableSVGElementList) {
    console.error('Original object not found for codeName:', currentSelectedSVG);
    return;
  }

  // Clone the original object and create a variation
  const clonedObject_reuseableSVGElementList = { ...OriginalObject_reuseableSVGElementList };
  const OriginalCodeName_reuseableSVGElementList = OriginalObject_reuseableSVGElementList.codeName;
  clonedObject_reuseableSVGElementList.codeName = `${OriginalCodeName_reuseableSVGElementList}_variation`; // Append variation to original codeName
    // console.log('new check', currentVersion, currentVersion?.cachedobjectslog)
    // Find the object in cachedObjectsLog
    let OriginalObject_cachedObjectsLog = cachedObjectsLog[currentSelectedSVG];

    if (!OriginalObject_cachedObjectsLog) {
      console.error('Original object not found for codeName:', currentSelectedSVG);
      return;
    }
  
        console.log('check before calling api',  currentobject.templatecode, Object.values(currentobject.parameters).slice(0, -1))
        var APIprompt = ''
        var existingcode = currentobject.templatecode
        console.log('check array', Object.values(currentobject.parametercontents).slice(0, -1))
        //have params
        if(Object.values(currentobject.parameters).slice(0, -1).length >0){
          APIprompt = `you will be given an svg template code generated by this rule: write me svg code to create a svg image of ` + currentobject.basic_prompt +`. Make the svg image as detailed as possible and as close to the description as possible.  
      Furthermore, process the generated svg code into a svg code template, with the given a list of parameter names, make the returned svg code a template with certain parameters as text placeholders made by {parameter name}. 
      For example, parameter list: roof height, window color; resulting svg template:
      <svg viewBox="0 0 200 200">
      <rect x="50" y="70" width="100" height="80" fill="brown" /> <!-- House body -->
      <polygon points="50,70 100,{roof height} 150,70" fill="red" /> <!-- Roof -->
      <rect x="65" y="90" width="20" height="20" fill="{window color}" /> <!-- Window 1 -->
      <rect x="115" y="90" width="20" height="20" fill="{window color}" /> <!-- Window 2 -->
      <rect x="90" y="120" width="20" height="30" fill="black" /> <!-- Door -->
      </svg>.
      
      Notice that only one parameter name and nothing else can be inside {}. Replace the whole parameter (e.g., fill = "#e0d0c0" to fill = "{parameter name}") instead of just part of it (e.g., fill = "#e0d0c0" to fill = "#{parameter name}"). Return svg code template for this parameter list:` + Object.values(currentobject.parameters).slice(0, -1).join(', ')+`. Do not include any background in generated svg. 
      The svg code template must be able to satify the requirements of the parameters by simply replacing the placeholders, instead of other manual modifications (e.g., 'window number' can be modified by simply replacing {window number} to some data, instead of needing to repeat window element manually)
      Make sure donot include anything other than the final svg code template in your response.
      This is the svg template code generated by the above rule: `+ existingcode
    
      +`Now, you are going to make these modifications to the given svg template: `+ modifyprompt +`
       and give me an updated svg template. Make sure donot include anything other than the svg template code in your response
      `
        }
        //no params
        else{
          APIprompt = 'Modify an existing svg code: '+existingcode+ ', to create a ' + currentobject.basic_prompt +'. Make these modifications on specific svg elements: ' + modifyprompt +'. Do not include any background in generated svg. As long as the svg follows the description, make as little change as possible other than the specific svg elements mentioned above. Make sure donot include anything other than the svg code in your response.';                                
        }
        console.log(APIprompt)
        try {
          const response = await axios.post(ngrok_url_sonnet, {
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
            //have params
            if(Object.values(currentobject.parameters).slice(0, -1).length >0){
              var updatedcontent = content.slice();
              Object.values(currentobject.parameters).slice(0, -1).forEach((param, index) => {
                  const placeholder = '{' + param + '}';
                  updatedcontent = updatedcontent.replace(new RegExp(placeholder, 'g'), Object.values(currentobject.parametercontents).slice(0, -1)[index]);
              });

              // Update the cloned object with the new SVG code
                clonedObject_reuseableSVGElementList.codeText = updatedcontent;

                // Replace or add the cloned object back to the reuseableSVGElementList
                var updatedVersion = {
                  ...currentVersion,
                  reuseableSVGElementList: [
                    ...currentVersion.reuseableSVGElementList.filter(item => item.codeName !== clonedObject_reuseableSVGElementList.codeName),
                    clonedObject_reuseableSVGElementList
                  ]
                };
                const newKey = `${currentSelectedSVG}_variation`;

                const updatedCachedObjectsLog = {
                  ...cachedObjectsLog,
                  [newKey]: { ...OriginalObject_cachedObjectsLog, objname: newKey, svgcode: updatedcontent, templatecode: content } // Add or replace the 'newvariation' entry
                };                
                
                // Update cachedobjectslog and reuseableSVGElementList again if necessary
                updatedVersion = {
                  ...updatedVersion, // Start with the previously updated version
                  cachedobjectslog: updatedCachedObjectsLog,
                  highlightedSVGPieceList: []
                };

                // Store the updated cached objects back into sessionStorage
                sessionStorage.setItem('cachedobjects', JSON.stringify(updatedCachedObjectsLog));

                setVersions(prevVersions => {
                  const updatedVersions = prevVersions.map(version => {
                    // Ensure `id` is always defined with a default value
                    const versionId = version.id ?? 'default-id'; // Provide a default value if `id` is undefined
                    
                    // If the versionId matches the currentVersionId, update the version
                    if (versionId === currentVersionId) {
                      return { ...updatedVersion, id: versionId }; // Use the updated version and ensure the id is set
                    }
                
                    // Otherwise, return the version unchanged but ensure the id is defined
                    return { ...version, id: versionId };
                  });
                
                  // Return the updated versions array
                  return updatedVersions;
                });
              }
            //no params
            else{
              var updatedcontent = content.slice();
              // Update the cloned object with the new SVG code
                clonedObject_reuseableSVGElementList.codeText = updatedcontent;

                // Replace or add the cloned object back to the reuseableSVGElementList
                var updatedVersion = {
                  ...currentVersion,
                  reuseableSVGElementList: [
                    ...currentVersion.reuseableSVGElementList.filter(item => item.codeName !== clonedObject_reuseableSVGElementList.codeName),
                    clonedObject_reuseableSVGElementList
                  ]
                };
                const newKey = `${currentSelectedSVG}_variation`;

                const updatedCachedObjectsLog = {
                  ...cachedObjectsLog,
                  [newKey]: { ...OriginalObject_cachedObjectsLog, objname: newKey, svgcode: updatedcontent, templatecode: content } // Add or replace the 'newvariation' entry
                };                
                
                // Update cachedobjectslog and reuseableSVGElementList again if necessary
                updatedVersion = {
                  ...updatedVersion, // Start with the previously updated version
                  cachedobjectslog: updatedCachedObjectsLog,
                  highlightedSVGPieceList: []
                };

                // Store the updated cached objects back into sessionStorage
                sessionStorage.setItem('cachedobjects', JSON.stringify(updatedCachedObjectsLog));

                setVersions(prevVersions => {
                  const updatedVersions = prevVersions.map(version => {
                    // Ensure `id` is always defined with a default value
                    const versionId = version.id ?? 'default-id'; // Provide a default value if `id` is undefined
                    
                    // If the versionId matches the currentVersionId, update the version
                    if (versionId === currentVersionId) {
                      return { ...updatedVersion, id: versionId }; // Use the updated version and ensure the id is set
                    }
                
                    // Otherwise, return the version unchanged but ensure the id is defined
                    return { ...version, id: versionId };
                  });
                
                  // Return the updated versions array
                  return updatedVersions;
                });
               

            }
          }
        } catch (error) {
          console.error('Error drawing the shape:', error);
        } 
    }

  const handlePromptChange = (pieceCodeName, prompt) => {
    setPiecePrompts(prevPrompts => ({
      ...prevPrompts,
      [pieceCodeName]: prompt,
    }));
  };
  // Function to render the small SVG in an iframe for each autocomplete option
  const renderSVGPreview = (svgCode: string) => {
    const svgDocument = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
          }
          svg {
            width: 100%;
            height: 100%;
          }
        </style>
      </head>
      <body>
        ${svgCode}
      </body>
      </html>
    `;
    return svgDocument;
  };

  const handleDeleteObject = (versionId: string, codeName: string) => {
    setVersions(prevVersions => {
      const updatedVersions = prevVersions.map(version =>
        version.id === versionId
          ? { ...version, reuseableSVGElementList: version.reuseableSVGElementList.filter(element => element.codeName !== codeName) }
          : version
      );
      return updatedVersions;
    });
  };
  const handleAnnotateGroup = (groupNameInput: string) => {
      
    setVersions(prevVersions => {
      const updatedVersions = prevVersions.map(version => {
        const updatedHighlightedSVGPieceList = [];

        if (version.id === currentVersionId) {
          // var currentVersion = versions.find(version => version.id === currentVersionId);
          // console.log('check version', currentVersion)
          const AnnotatedPieces = currentVersion.highlightedSVGPieceList.map(piece => ({
            codeName: piece.codeText,
          }));
  
          const AnnotatedEntry = {
            codeName: currentSelectedSVG,
            pieces: AnnotatedPieces.map(item => item.codeName),
            groupname: groupNameInput
          };

          // Check if there's already an entry with the same codeName and groupname, and update or append a new one
          const existingAnnotatedPieceList = version.AnnotatedPieceList || [];
          const updatedAnnotatedPieceList = existingAnnotatedPieceList.filter(
            entry => !(entry.codeName === AnnotatedEntry.codeName && entry.groupname === AnnotatedEntry.groupname)
          );

          // Add the new AnnotatedEntry to the filtered list (overwriting any existing matching entry)
          updatedAnnotatedPieceList.push(AnnotatedEntry);        
          console.log('updating updatedAnnotatedPieceList', updatedAnnotatedPieceList)
          // updateobject_modifypieces(modifiedEntry, cachedObjects[currentSelectedSVG])
          return { ...version, highlightedSVGPieceList: updatedHighlightedSVGPieceList, AnnotatedPieceList: updatedAnnotatedPieceList};
        }
        return version;
      });
      return updatedVersions;
    });
    console.log('check version', versions.find(version => version.id === currentVersionId))
  };
    
  return (
    <div
      className="modify-obj-widget"
      style={{
        position: 'absolute',
        top: 450,
        left: 820,
        zIndex: 1000,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        padding: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'row',
        fontSize: '14px',
        width: '100%',
        maxWidth: '500px',
      }}
    >
      {/* Left side for autocomplete options and large iframe preview */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginRight: '10px',
          width: '50%',
        }}
      >
        {/* Autocomplete options */}
        <div
          className="code-name-list"
          style={{
            maxHeight: '200px',
            overflowY: 'auto',
            flexGrow: 1,
          }}
        >
          <ul className="autocomplete-options" style={{ margin: 0, padding: 0, listStyleType: 'none' }}>
            {currentreuseableSVGElementList.map((item, index) => (
              <li
                key={index}
                className="autocomplete-option"
                style={{
                  padding: '5px',
                  cursor: 'pointer',
                  whiteSpace: 'pre-wrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  wordWrap: 'break-word',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <button className="delete-icon"
                  style={{
                    marginLeft: '10px',
                    padding: '2px 5px',
                    fontSize: '10px',
                    color: 'black',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                    onClick={() => handleDeleteObject(currentVersionId, item.codeName)}>-
                </button>

                <span
                  onClick={() => {
                    if (showModifyObjButton) {
                      handleModifyobjOptionClick(item.codeName, '');
                    } else {
                      handleUseobjOptionClick(item.codeName, '');
                    }
                  }}
                  style={{ flexGrow: 1 }}
                >
                  {item.codeName}
                </span>

                {/* Render the small SVG preview */}
                <iframe
                  srcDoc={renderSVGPreview(item.codeText)}
                  style={{
                    width: '40px',
                    height: '40px',
                    border: '1px solid #ccc',
                    marginLeft: '10px',
                  }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenderSVGClick(item.codeName, item.codeText);
                  }}
                  style={{
                    marginLeft: '10px',
                    padding: '2px 5px',
                    fontSize: '10px',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  ...
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Large SVG preview iframe at the bottom */}
        {svgCodeText && (
          <div style={{ marginTop: '10px' }}>
            <div
              style={{
                width: '100%',
                height: '200px',
                border: '1px solid #ccc',
              }}
            >
              {svgCodeText && (
                <iframe
                  ref={iframeRef}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right side for SVG preview and inputs */}
      <div className="svg-preview-container" style={{ flexGrow: 2, marginLeft: '10px' }}>
        {/* Input for object name and buttons */}
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <input
            type="text"
            value={objNameInput}
            onChange={(e) => setObjNameInput(e.target.value)}
            placeholder="Object Name"
            style={{
              marginBottom: '10px',
              padding: '5px',
              width: '100%',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          <button
            onClick={handleRenameObject}
            style={{
              padding: '5px 10px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ccc',
              borderRadius: '5px',
              cursor: 'pointer',
              marginBottom: '10px',
              width: '100%',
            }}
          >
            Rename Object
          </button>

          {/* Displaying buttons for highlighted SVG pieces */}
          <div style={{ marginTop: '10px', width: '100%' }}>
            {currentVersion?.highlightedSVGPieceList?.map((piece) => (
              <div key={piece.codeName} style={{ display: 'flex', marginBottom: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => handlePieceClick(piece.codeName)}
                  style={{
                    backgroundColor: currentPieceName === piece.codeName ? '#ccc' : '#f0f0f0',
                    border: '1px solid #ccc',
                    padding: '5px',
                    marginRight: '10px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                  }}
                >
                  {piece.codeName}
                </button>
                <input
                  type="text"
                  value={piecePrompts[piece.codeName] || ''}
                  onChange={(e) => handlePromptChange(piece.codeName, e.target.value)}
                  placeholder="modify selected pieces"
                  style={{
                    marginBottom: '10px',
                    padding: '5px',
                    width: '100%',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Unified Modify and Apply buttons */}
          <button
            onClick={handleModifyPieces}
            style={{
              padding: '5px 10px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ccc',
              borderRadius: '5px',
              cursor: 'pointer',
              marginBottom: '10px',
              width: '100%',
            }}
          >
            Modify Pieces
          </button>
          <input
            type="text"
            // value={objNameInput}
            onChange={(e) => setGroupNameInput(e.target.value)}
            placeholder="annotate selected pieces"
            style={{
              marginBottom: '10px',
              padding: '5px',
              width: '100%',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          <button
            onClick={() => handleAnnotateGroup(groupNameInput)}
            style={{
              padding: '5px 10px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ccc',
              borderRadius: '5px',
              cursor: 'pointer',
              marginBottom: '10px',
              width: '100%',
            }}
          >
            Annotate group
          </button>
        </div>
      </div>
    </div>
  );
};


  
const CheckSVGPieceWidget = ({ svgCode, pieceCodeName }: { svgCode: string, pieceCodeName: string }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const sanitizeSVG = (svgString: string) => {
    // Sanitize the SVG string if necessary here
    return svgString.trim(); // Just a simple trim for now, more sanitization can be added if needed
  };
  useEffect(() => {
      const iframe = iframeRef.current;
      if (iframe) {
          const iframeDocument = iframe.contentDocument;
          const updatedSvgCode = highlightPiece(svgCode, pieceCodeName);

          if (iframeDocument) {
              iframeDocument.write(`
              <!DOCTYPE html>
              <html lang="en">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>SVG Render</title>
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
                      svg {
                        width: 100%;
                        height: 100%;
                      }
                  </style>
              </head>
              <body>
              <div id="canvasContainer">
                  ${sanitizeSVG(updatedSvgCode)}
              </div>
        </body>
              </html>
              `);
              iframeDocument.close(); // Ensure the document is closed after writing
              // const canvasContainer = iframeDocument.getElementById('canvasContainer');
              // if (canvasContainer) {
              //     appendSVGToContainer(canvasContainer, svgCode);
              // }
          }
      }
  }, [svgCode]);

  // const appendSVGToContainer = (container: HTMLElement, svgCode: string) => {
  //     console.log('in appendSVGToContainer', svgCode, pieceCodeName)
  //     const updatedSvgCode = highlightPiece(svgCode, pieceCodeName);
  //     const svgElement = new DOMParser().parseFromString(updatedSvgCode, 'image/svg+xml').querySelector('svg');
  //     console.log('updated element', updatedSvgCode, svgElement)
  //     container.appendChild(svgElement);
  // };

  function toggleSvgElementClosure(svgString: string) {
    // First, check if it's a self-closing tag
    if (svgString.endsWith('/>')) {
      // If it's self-closing, change it to an open-and-close tag
      return svgString.replace('/>', `></${svgString.match(/^<(\w+)/)[1]}>`);
    } else {
      // If it's not self-closing, make it self-closing
      return svgString.replace(/><\/\w+>$/, '/>');
    }
  }

  function highlightAndReplaceSVG(svgText: string, pieceText: string): string {
    // Step 1: Find the matching piece in svgText
    const placeholder = '[placeholder]';

    //incase the difference of self-closing or not, check both
    const pieceText2 = toggleSvgElementClosure(pieceText);

    // Step 3: Determine which version (pieceText or pieceText_alternative) contains the self-closing `/>`
    var pieceText3 = pieceText2.includes('/>') ? pieceText2 : pieceText;

    // Step 4: Check if it contains ` />` (a space before the self-closing tag)
    if (pieceText3.includes('/>')) {
        // Replace ` />` with `/>` (remove the space)
        pieceText3 = pieceText3.replace('/>', ' />');
    }

    const matchedPiece1 = svgText.includes(pieceText) ? pieceText : '';
    const matchedPiece2 = svgText.includes(pieceText2) ? pieceText2 : '';
    const matchedPiece3 = svgText.includes(pieceText3) ? pieceText3 : '';

    const matchedPiece = matchedPiece1 || matchedPiece2 || matchedPiece3;

    console.log('3 piece choices', pieceText, pieceText2, pieceText3)

    if (!matchedPiece) {
        console.log('No matching piece found in the SVG.', 'svgtext\n', svgText, 'piecetext\n', pieceText);
        return svgText;
    }

    // Step 2: Replace the match string with [placeholder]
    const updatedSVGText = svgText.replace(matchedPiece, placeholder);

    // Step 3: Turn pieceText into a DOM element (pieceElement)
    const parser = new DOMParser();
    const pieceDoc = parser.parseFromString(pieceText, 'image/svg+xml');
    const pieceElement = pieceDoc.querySelector('*');  // Adjust selector if pieceText could be something other than a path

    if (pieceElement) {
        // Step 4: Highlight the piece
        const originalStroke = pieceElement.getAttribute('stroke') || 'none';
        const originalStrokeWidth = pieceElement.getAttribute('stroke-width') || '0';
        pieceElement.setAttribute('data-original-stroke', originalStroke);
        pieceElement.setAttribute('data-original-stroke-width', originalStrokeWidth);
        pieceElement.setAttribute('stroke', 'yellow');
        pieceElement.setAttribute('stroke-width', (parseFloat(originalStrokeWidth) + 10).toString());
        pieceElement.setAttribute('data-highlighted', 'true');

        // Step 5: Get the updated piece text
        const updatedPieceText = pieceElement.outerHTML;

        // Step 6: Replace the placeholder with updatedPieceText
        const finalSVGText = updatedSVGText.replace(placeholder, updatedPieceText);

        return finalSVGText;
    }

    console.log('Failed to parse the piece element.');
    return svgText;
}
  const highlightPiece = (svgCode: string, pieceCodeName: string) => {
      // Find the matching SVG element by comparing codeText with the pieceName
      const currentVersion = versions.find(version => version.id === currentVersionId);
      const pieceText = currentVersion?.previousSelectedSVGPieceList.find(item => item.codeName === pieceCodeName)?.codeText;
      const updatedSvgCode = highlightAndReplaceSVG(svgCode, pieceText)
      return updatedSvgCode
  };

  return (
      <div
          className="check-svg-piece-widget"
          style={{
              position: 'absolute',
              top: autocompletePositionbackup.top,
              left: autocompletePositionbackup.left,
              zIndex: 1000,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              padding: '10px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              fontSize: '14px',
          }}
      >
          <div className="inputsandbuttons-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                  style={{
                      width: '200px',
                      height: '200px',
                      border: '1px solid #ccc',
                      marginBottom: '10px',
                  }}
              >
                  {svgCode && (
                      <iframe
                          ref={iframeRef}
                          style={{ width: '100%', height: '100%', border: 'none' }}
                      />
                  )}
              </div>
          </div>
      </div>
  );
};

const CheckWholeSVGWidget = ({ svgCode, pieceCodeName }) => {
  const iframeRef = useRef(null);

  const sanitizeSVG = (svgString) => {
    // Sanitize the SVG string if necessary here
    return svgString.trim(); // Simple trim; add more sanitization if needed
  };

  useEffect(() => {
    const iframe = iframeRef.current;

    if (iframe) {
      const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDocument) {
        iframeDocument.open(); // Open the document for writing
        iframeDocument.write(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>SVG Render</title>
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
                  svg {
                    width: 100%;
                    height: 100%;
                  }
              </style>
          </head>
          <body>
              <div id="canvasContainer">
                  ${sanitizeSVG(svgCode)}
              </div>
          </body>
          </html>
        `);
        iframeDocument.close(); // Ensure the document is closed after writing
      }
    }
  }, [svgCode]);

  return (
    <div
      className="check-whole-svg-widget"
      style={{
        position: 'absolute',
        top: autocompletePosition.top,
        left: autocompletePosition.left,
        zIndex: 1000,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        padding: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        fontSize: '14px',
      }}
    >
      <div
        className="svg-preview-container"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <div
          style={{
            width: '200px',
            height: '200px',
            border: '1px solid #ccc',
            marginBottom: '10px',
          }}
        >
          {svgCode && (
            <iframe
              ref={iframeRef}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

  
const CachedObjWidget = ({ currentVersionId, versions }: { currentVersionId: string | null, versions: Version[] }) => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]); // To track which objects are expanded

  // Find the current version and access its cachedobjectslog
  //const currentVersion = versions.find((version) => version.id === currentVersionId);
  //const cachedObjectsLog = currentVersion?.cachedobjectslog || {}; // Assuming cachedobjectslog is an object
  const cachedObjectsLog = JSON.parse((sessionStorage.getItem('cachedobjects')))
  console.log('check cachedobjectsLog', cachedObjectsLog)
  // Function to toggle the expansion of an object or sub-object
  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  // Function triggered by right-click with the key and parent keys as parameters
  const handleClickinCachedObj = (keyPath: string[]) => {
    //event.preventDefault(); // Prevent the default context menu from opening
    console.log('Right-clicked on key:', keyPath.join('.'));
    const combinedText = keyPath.join('.');
    const currentValue = userjs;
    const cursorPosition = editorRef.current?.selectionStart || 0;
    const textBeforeCursor = currentValue.slice(0, cursorPosition+'cachedobjects'.length);
    const textAfterCursor = currentValue.slice(cursorPosition+'cachedobjects'.length);
    const newText = textBeforeCursor + '.'+ combinedText + textAfterCursor;
    setuserJs(newText);
    setShowCachedObjWidget(false);
    // You can replace this console.log with the actual function you want to trigger
    // For example:
    // myFunction(keyPath);
  };

  // Recursive function to render the object structure with a tree-like hierarchy
  const renderObject = (obj: any, parentKey = '', level = 0, parentKeys: string[] = []): JSX.Element => {
    return (
      <ul style={{ listStyleType: 'none', paddingLeft: `${20 * level}px`, position: 'relative' }}>
        {Object.keys(obj).map((key) => {
          const value = obj[key];
          const fullKey = parentKey ? `${parentKey}.${key}` : key; // Create a unique key for nested objects
          const currentKeyPath = [...parentKeys, key]; // Accumulate keys up to the current level
          
          return (
            <li key={fullKey} style={{ position: 'relative' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '5px',
                  marginBottom: '5px',
                  cursor: typeof value === 'object' && value !== null ? 'pointer' : 'default',
                  backgroundColor: typeof value === 'object' && value !== null ? '#e0e0e0' : 'transparent',
                  position: 'relative',
                  borderLeft: level > 0 ? '2px solid black' : 'none', // Adds the vertical line for sub-objects
                }}
                onClick={() => handleClickinCachedObj(currentKeyPath)} // Trigger by normal left click
                onContextMenu={(event) => {
                  event.preventDefault(); // Prevent the default right-click menu
                  if (typeof value === 'object' && value !== null) {
                    toggleExpand(fullKey); // Trigger toggleExpand on right-click
                  }
                }}
              >
                {typeof value === 'object' && value !== null ? (
                  <>
                    <strong
                      style={{
                        marginRight: '10px',
                        flexGrow: 1,
                        display: 'inline-block',
                      }}
                    >
                      {key}:
                    </strong> 
                    {expandedKeys.includes(fullKey) ? '' : '{...}'}
                  </>
                ) : (
                  <>
                    <strong style={{ marginRight: '5px' }}>{key}</strong>
                    : <span>{`${value}`}</span>
                  </>
                )}
  
                {/* Only show tree connection line for expanded objects */}
                {expandedKeys.includes(fullKey) && typeof value === 'object' && value !== null && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '-20px',
                      width: '20px',
                      height: '2px',
                      // backgroundColor: 'black',
                    }}
                  ></div>
                )}
              </div>
  
              {/* Recursive rendering of sub-objects */}
              {expandedKeys.includes(fullKey) && typeof value === 'object' && value !== null && (
                <>
                  {renderObject(value, fullKey, level + 1, currentKeyPath)} {/* Pass the accumulated keys */}
                </>
              )}
            </li>
          );
        })}
      </ul>
    );
  };
  
  

  return (
    <div
      className="cached-obj-widget"
      style={{
        position: 'absolute',
        top: autocompletePosition.top,
        left: autocompletePosition.left,
        zIndex: 1000,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        padding: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        fontSize: '14px',
        maxHeight: '300px',
        overflowY: 'auto',
        width: '600px',
      }}
    >
      <div style={{ overflowY: 'auto', width: '100%' }}>
        {cachedObjectsLog ? (
          renderObject(cachedObjectsLog)
        ) : (
          <p>No cached objects found.</p>
        )}
      </div>
    </div>
  );
};



  const CoordcompleteWidget = () => (
    <div
      ref={widgetRef}
      className="coordcomplete-widget"
      style={{
        position: 'absolute',
        top: CoordcompletePosition.top,
        left: CoordcompletePosition.left,
        zIndex: 1000,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        padding: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      <ul className="coordcomplete-options" style={{ listStyleType: 'none', paddingLeft: 0 }}>
        {versions.find(version => version.id === currentVersionId)?.storedcoordinate && (
          <li
            className="coordcomplete-option"
            onClick={() => handleCoordcompleteOptionClick(
              `{x: ${Math.round(versions.find(version => version.id === currentVersionId)?.storedcoordinate.x)}, y: ${Math.round(versions.find(version => version.id === currentVersionId)?.storedcoordinate.y)}}`,
              hintKeywords
            )}
            style={{ padding: '5px', cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
          >
            {`{x: ${Math.round(versions.find(version => version.id === currentVersionId)?.storedcoordinate.x)}, y: ${Math.round(versions.find(version => version.id === currentVersionId)?.storedcoordinate.y)}}`}
          </li>
        )}
      </ul>
    </div>
  );
  

  const getCaretCoordinates = (element: HTMLTextAreaElement | null, position: number) => {
    if (!element) return { top: 0, left: 0 };
    const div = document.createElement('div');
    const style = getComputedStyle(element);
    [...style].forEach((prop) => {
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
  
    // Account for scrollTop and scrollLeft
    const coordinates = {
      top: span.offsetTop + element.getBoundingClientRect().top - element.scrollTop,
      left: span.offsetLeft + element.getBoundingClientRect().left - element.scrollLeft,
    };
  
    document.body.removeChild(div);
    return coordinates;
  };
  

  const renderEditor = () => {
    if (activeTab === 'js') {
      return (
        <div style={{ 
          height: '600px', 
          width: '400px', 
          overflow: 'auto',
         }}>
        <CodeEditor
          value={userjs}
          language="js"
          padding={15}
          style={{
            fontSize: 15,
            backgroundColor: '#f5f5f5',
            fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
            //this will do style conflict!
            // height: '100%',
            // overflow: 'auto',
          }}
          ref={editorRef}
          onChange={(evn) => setuserJs(evn.target.value)}
        />
        <button onClick={() => onRunUserCode({ js: userjs })}>Run User Code</button>
        </div>
      );
    } else if (activeTab === 'html') {
      return (
        <div style={{           
            height: '600px', 
            width: '400px', 
            overflow: 'auto', 
          }}>
        <CodeEditor
          value={backendhtml}
          language="html"
          padding={15}
          style={{
            fontSize: 15,
            backgroundColor: '#f5f5f5',
            fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
            //this will do style conflict!
            // height: '100%',
            // overflow: 'auto',
          }}
          ref={editorRef}
          onChange={(evn) => setbackendHtml(evn.target.value)}
        />
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="code-editor"
      onKeyDown={handleKeyDown}
      // onDoubleClick={handleDoubleClick}
      // onContextMenu={handleRightClick}
    >
      {loading && <div className="loading-container"><ReactLoading type="spin" color="#007bff" height={50} width={50} /></div>}
      <div className="tabs">
        <button className="tab-button" onClick={() => setActiveTab(activeTab === 'js' ? 'html' : 'js')}>
          Switch to {activeTab === 'js' ? 'Backend HTML' : 'User JS'}
        </button>
      </div>
      {showCheckSVGPieceWidget && <CheckSVGPieceWidget svgCode={svgCodeText_checkpiece} pieceCodeName={currentSelectedSVG} />}
      {showCheckWholeSVGWidget && <CheckWholeSVGWidget svgCode={svgCodeText_checkwholesvg} pieceCodeName={currentSelectedSVG} />}
      {showModifyObjWidget && <ModifyObjWidget />}
      {showGenerateOption && optionLevels.length === 0 && <GenerateOptionWidget hintKeywords={hintKeywords} />}
      {showAutocomplete && optionLevels.map((level, index) => (
        <AutocompleteWidget key={index} options={level.options} levelIndex={index} />
      ))}
      {showCoordcomplete && <CoordcompleteWidget />}
      {showCachedObjWidget && <CachedObjWidget currentVersionId={currentVersionId} versions={versions} />}
      
      <div>
      {renderEditor()}
      
      </div>      {/* <div className="button-group">
        
      </div> */}
    </div>
  );
  
};

export default CustomCodeEditor;
