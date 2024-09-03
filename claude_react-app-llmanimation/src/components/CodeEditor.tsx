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
}

const API_KEY = '';
const ngrok_url = 'https://5843-34-48-16-227.ngrok-free.app';
const ngrok_url_sonnet = ngrok_url + '/api/message';
const ngrok_url_haiku = ngrok_url + '/api/message-haiku';

const CustomCodeEditor: React.FC<CodeEditorProps> = ({
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
}) => {
  const [backendhtml, setbackendHtml] = useState(backendcode.html);
  const [userjs, setuserJs] = useState(usercode.js);
  // const [codeactiveTab, setActiveTab] = useState(activeTab);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showGenerateOption, setShowGenerateOption] = useState(false);
  const [showCoordcomplete, setShowCoordcomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
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
  const [showModifyObjWidget, setShowModifyObjWidget] = useState(false);
  const [currentSelectedSVG, setCurrentSelectedSVG] = useState(''); // State to store the current codeName
  const [showmodifyobjbutton, setShowModifyObjButton] = useState(false);
  // const [selectedCodeText, setSelectedCodeText] = useState('');
  // const [svgCodeText, setSvgCodeText] = useState('');

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
  

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      let clickedOutside = true;
      console.log('handleclick outside', showModifyObjWidget)
  
      // Check if the click is inside any of the autocomplete widgets
      optionLevels.forEach((_, levelIndex) => {
        const widgetElement = document.getElementById(`autocomplete-widget-${levelIndex}`);
        if (widgetElement && widgetElement.contains(event.target as Node)) {
          clickedOutside = false;
        }
      });
  
      // Check if the click is inside the generate option widget
      if (widgetRef.current && widgetRef.current.contains(event.target as Node)) {
        clickedOutside = false;
      }
  
      // Check if the click is inside any of the autocomplete widgets
      const autocompleteWidgets = document.querySelectorAll('.autocomplete-widget');
      autocompleteWidgets.forEach((widget) => {
        if (widget.contains(event.target as Node)) {
          clickedOutside = false;
        }
      });
  
      // Check if the click is inside the coordinate widget (if it's shown)
      if (showCoordcomplete) {
        const coordWidgetElement = widgetRef.current;
        if (coordWidgetElement && coordWidgetElement.contains(event.target as Node)) {
          clickedOutside = false;
        }
      }
      // Check if the click is inside the modify object widget (if it's shown)
      if (showModifyObjWidget) {
        console.log('check showModifyObjWidget')
        const modifyObjWidgetElement = document.querySelector('.modify-obj-widget');
        if (modifyObjWidgetElement && modifyObjWidgetElement.contains(event.target as Node)) {
          clickedOutside = false;
        }
      }
      // If the click was outside all widgets, close them
      if (clickedOutside) {
        console.log('Clicked outside');
        setOptionLevels([]);
        setShowAutocomplete(false);
        setShowGenerateOption(false);
        setShowCoordcomplete(false);
        setShowModifyObjWidget(false);
        setButtonchoice('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModifyObjWidget, optionLevels, showAutocomplete, showGenerateOption, showCoordcomplete]);

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

  const handleDoubleClick = (event: React.MouseEvent) => {
    const selection = window.getSelection();
    const word = selection?.toString().trim();
    
      if (word === 'modifyobj') {
        console.log('double-clicked on modifyobjhh');
        setShowModifyObjButton(true)
        const currentVersion = versions.find(version => version.id === currentVersionId);
        if (!currentVersion) {
          console.log('No current version found');
          return;
        }
    
        const currentreuseableSVGElementList = currentVersion.reuseableSVGElementList;
        console.log('reuseableSVGElementList', currentVersion, currentreuseableSVGElementList);
    
        if (currentreuseableSVGElementList) {
          const cursorPosition = editorRef.current?.selectionStart || 0;
          const position = getCaretCoordinates(editorRef.current, cursorPosition - word.length);
          setAutocompletePosition({ top: position.top + 50, left: position.left });
          setShowModifyObjWidget(true); // Show the widget
          //setSelectedCodeText(''); // Reset the selected code text
          console.log('clicked on modifyobj', showModifyObjWidget)
        } else {
          console.log('reuseableSVGElementList is undefined or empty');
        }
      }

      if (word === 'useobj') {
        console.log('double-clicked on useobjhh');
        const currentVersion = versions.find(version => version.id === currentVersionId);
        if (!currentVersion) {
          console.log('No current version found');
          return;
        }
    
        const currentreuseableSVGElementList = currentVersion.reuseableSVGElementList;
        console.log('reuseableSVGElementList', currentVersion, currentreuseableSVGElementList);
    
        if (currentreuseableSVGElementList) {
          const cursorPosition = editorRef.current?.selectionStart || 0;
          const position = getCaretCoordinates(editorRef.current, cursorPosition - word.length);
          setAutocompletePosition({ top: position.top + 50, left: position.left });
          setShowModifyObjWidget(true); // Show the widget
          //setSelectedCodeText(''); // Reset the selected code text
          console.log('clicked on modifyobj', showModifyObjWidget)
        } else {
          console.log('reuseableSVGElementList is undefined or empty');
        }
      }

    // if (word === 'modifyauto') {
    //   console.log('double-clicked on piece');
    //   const currentVersion = versions.find(version => version.id === currentVersionId);
    //   if (!currentVersion) {
    //     console.log('No current version found');
    //     return;
    //   }
  
    //   const currenthighlightedSVGPieceList = currentVersion.highlightedSVGPieceList;
    //   console.log('svgpieces', currentVersion, currenthighlightedSVGPieceList);
  
    //   if (currenthighlightedSVGPieceList) {
    //     const codeNames = currenthighlightedSVGPieceList.map(item => item.codeName).join('\', \'');
    //     const cursorPosition = editorRef.current?.selectionStart || 0;
    //     const textBeforeCursor = userjs.slice(0, cursorPosition);
    //     const textAfterCursor = userjs.slice(cursorPosition+word.length);
    //     const newText = textBeforeCursor + '\''+ codeNames + '\''+ textAfterCursor;
    //     setuserJs(newText);
    //   } else {
    //     console.log('highlightedSVGPieceList is undefined or empty');
    //   }
    // }

    // if (word === 'refauto') {
    //   console.log('double-clicked on ref');
    //   const currentVersion = versions.find(version => version.id === currentVersionId);
    //   if (!currentVersion) {
    //     console.log('No current version found');
    //     return;
    //   }
  
    //   const currentreuseableSVGElementList = currentVersion.reuseableSVGElementList;
    //   console.log('svgpieces', currentVersion, currentreuseableSVGElementList);
  
    //   if (currentreuseableSVGElementList) {
    //     const codeName = currentreuseableSVGElementList.find(item => item.selected === true).codeName;;
    //     const cursorPosition = editorRef.current?.selectionStart || 0;
    //     const textBeforeCursor = userjs.slice(0, cursorPosition);
    //     const textAfterCursor = userjs.slice(cursorPosition+word.length);
    //     const newText = textBeforeCursor + '\''+ codeName + '\''+ textAfterCursor;
    //     setuserJs(newText);
    //   } else {
    //     console.log('highlightedSVGPieceList is undefined or empty');
    //   }
    // }

    // if (word == 'coordauto'){
    //   setHintKeywords(word);
    //   const cursorPosition = editorRef.current?.selectionStart || 0;
    //   const position = getCaretCoordinates(editorRef.current, cursorPosition - word.length);
    //   setCoordcompletePosition({ top: position.top + 50, left: position.left });
    //   setShowCoordcomplete(true);
    // }
    else if(word != 'modifyobj'){
      setHintKeywords(word);
      const cursorPosition = editorRef.current?.selectionStart || 0;
      const position = getCaretCoordinates(editorRef.current, cursorPosition - word.length);
      setAutocompletePosition({ top: position.top + 50, left: position.left });
      // const initialOptions = [word]; // You can replace this with an array of initial options if available
      // setOptionLevels([{ options: initialOptions, position }]);
      setShowGenerateOption(true);
    }
  };

  const handleRightClick = (event: React.MouseEvent) => {
    event.preventDefault();
    const selection = window.getSelection();
    const word = selection?.toString().trim();
      if (word) {
      const cursorPosition = editorRef.current?.selectionStart || 0;
      const position = getCaretCoordinates(editorRef.current, cursorPosition - word.length);
      setHintKeywords(word);
      const rect = editorRef.current?.getBoundingClientRect();
      if (rect) {
        setAutocompletePosition({ top: position.top + 50, left: position.left });
        // const initialOptions = [word]; // You can replace this with an array of initial options if available
        // setOptionLevels([{ options: initialOptions, position }]);
        setShowGenerateOption(true);
      }
    }
  };

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
      id="generate-option-widget"
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
      const newText = textBeforeCursor + '= {objname: \'' + option + '\'}'+ textAfterCursor;
      setuserJs(newText);
      setShowModifyObjWidget(false)

  };
  
  const ModifyObjWidget = () => {
    const currentVersion = versions.find((version) => version.id === currentVersionId);
    const currentreuseableSVGElementList = currentVersion?.reuseableSVGElementList || [];


    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        //console.log('in useeffect', svgCodeText, iframeRef.current)
        const iframe = iframeRef.current;
        if (iframe) {
            const iframeDocument = iframe.contentDocument;
            iframeDocument?.write(`
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
                <div id="canvasContainer"></div>
            </body>
            </html>
            `);
            iframeDocument?.close(); // Make sure to close the document to complete writing
            const canvasContainer = iframeDocument?.getElementById('canvasContainer');
            if (canvasContainer) {
                appendSVGToContainer(canvasContainer, svgCodeText);
                //console.log('appendSVGToContainer', svgCodeText)
            }
        }
    }, [svgCodeText]);

    const appendSVGToContainer = (container: HTMLElement, svgCode: string) => {
        const svgElement = new DOMParser().parseFromString(svgCode, 'image/svg+xml').querySelector('svg');
        if (svgElement) {
            attachHighlightListeners(svgElement);
            container.appendChild(svgElement);
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

    // const empty_svgpiece = () =>{
    //     // Empty the highlightedSVGPieceList of the current version
    //     setVersions(prevVersions => {
    //       const updatedVersions = prevVersions.map(version => {
    //         if (version.id === currentVersionId) {
    //           return { ...version, highlightedSVGPieceList: [] };
    //         }
    //         return version;
    //       });
  
    //       console.log('highlightedSVGPieceList emptied for version:', currentVersionId);
    //       return updatedVersions;
    //     });      
    // }

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


    const toggleHighlight = (event: MouseEvent) => {
        event.stopPropagation();
        const target = event.currentTarget as SVGElement;
        console.log('target:', target, target.outerHTML)
        const isHighlighted = target.getAttribute('data-highlighted') === 'true';

        if (isHighlighted) {
            const svgString = target.outerHTML;
            remove_svgpiece(svgString)
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
            setSvgCodeText(target.parentElement.parentElement.outerHTML)
            //window.parent.postMessage({ type: 'REMOVE_SVGPIECE', codetext: svgString }, '*');
            
        } else {
            const originalStroke = target.getAttribute('stroke') || 'none';
            const originalStrokeWidth = target.getAttribute('stroke-width') || '0';
            target.setAttribute('data-original-stroke', originalStroke);
            target.setAttribute('data-original-stroke-width', originalStrokeWidth);
            target.setAttribute('stroke', 'yellow');
            target.setAttribute('stroke-width', parseFloat(originalStrokeWidth) + 10);
            target.setAttribute('data-highlighted', 'true');
            const svgString = target.outerHTML;
            //console.log('before update', svgCodeText)
            update_svgpiece(svgString.split(' ')[0], svgString)
            setSvgCodeText(target.parentElement.parentElement.outerHTML) 
            //console.log('done update', svgString, target.parentElement.parentElement)
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
                  const svgString = target.outerHTML;
                  remove_svgpiece(svgString); // Remove the piece from the list
  
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
        //empty_svgpiece();
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
          const newText = textBeforeCursor + '= {objname: \'' + currentSelectedSVG + '\', piecenames: [\''+ codeNames + '\' ], pieceprompts: []}'+ textAfterCursor;
          setuserJs(newText);
          setShowModifyObjWidget(false)
        } else {
          console.log('highlightedSVGPieceList is undefined or empty');
        }
    };

    return (
        <div
            className="modify-obj-widget"
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
                className="code-name-list"
                style={{
                    marginRight: '10px',
                    maxHeight: '200px',
                    overflowY: 'auto',
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
                        <span 
                            onClick={() => {
                                if (showmodifyobjbutton) {
                                    handleModifyobjOptionClick(item.codeName, '');
                                } else {
                                  handleUseobjOptionClick(item.codeName, '');
                                }
                            }}
                            style={{ flexGrow: 1 }}
                        >
                                {item.codeName}
                            </span>
                            {showmodifyobjbutton && <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRenderSVGClick(item.codeName, item.codeText);
                                }}
                                style={{
                                    marginLeft: '10px',
                                    padding: '2px 5px',
                                    fontSize: '10px',
                                }}
                            >
                                ...
                            </button>}
                        </li>
                    ))}
                </ul>
            </div>
            {svgCodeText &&<div className="svg-preview-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                    style={{
                        width: '200px',
                        height: '200px',
                        border: '1px solid #ccc',
                        marginBottom: '10px',
                    }}
                >
                    {svgCodeText && (
                        <iframe
                            ref={iframeRef}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                        />
                    )}
                </div>
                <button
                    onClick={handleApplyClick}
                    style={{
                        padding: '5px 10px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                    }}
                >
                    Apply
                </button>
            </div>}
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
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleRightClick}
    >
      {loading && <div className="loading-container"><ReactLoading type="spin" color="#007bff" height={50} width={50} /></div>}
      <div className="tabs">
        <button className="tab-button" onClick={() => setActiveTab(activeTab === 'js' ? 'html' : 'js')}>
          Switch to {activeTab === 'js' ? 'Backend HTML' : 'User JS'}
        </button>
      </div>
      {showModifyObjWidget && <ModifyObjWidget />}
      {showGenerateOption && optionLevels.length === 0 && <GenerateOptionWidget hintKeywords={hintKeywords} />}
      {showAutocomplete && optionLevels.map((level, index) => (
        <AutocompleteWidget key={index} options={level.options} levelIndex={index} />
      ))}
      {showCoordcomplete && <CoordcompleteWidget />}
      {renderEditor()}
      <div className="button-group">
        <button className="green-button" onClick={() => handleRun(currentVersionId || '')}>
          Run
        </button>
      </div>
    </div>
  );
  
};

export default CustomCodeEditor;
