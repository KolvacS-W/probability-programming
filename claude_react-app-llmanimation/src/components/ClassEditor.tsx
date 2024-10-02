import React, { useState, useEffect, useRef } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import ReactLoading from 'react-loading';
import { Version, KeywordTree } from '../types';
import axios from 'axios';
import ResultViewer from './ResultViewer'; // Import the ResultViewer component

interface ClassEditorProps {
  ngrok_url_sonnet: string;
  currentVersionId: string | null;
  setVersions: React.Dispatch<React.SetStateAction<Version[]>>;
  versions: Version[];
  classcode: {
    js: string;
  };
  setClassCode: React.Dispatch<React.SetStateAction<{ js: string }>>;
  onRunClassCode: () => void; // Add this prop
}

// const ngrok_url = 'https://82b7-34-46-65-154.ngrok-free.app';
// const ngrok_url_sonnet = ngrok_url + '/api/message';
// const ngrok_url_haiku = ngrok_url + '/api/message-haiku';

const ClassEditor: React.FC<ClassEditorProps> = ({
  ngrok_url_sonnet,
  currentVersionId,
  versions,
  classcode, setClassCode, onRunClassCode

}) => {
const editorRef = useRef<HTMLTextAreaElement>(null);
  // const [codeactiveTab, setActiveTab] = useState(activeTab);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showGenerateOption, setShowGenerateOption] = useState(false);

  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });

  const [hintKeywords, setHintKeywords] = useState('');
  const [generatedOptions, setGeneratedOptions] = useState<string[]>([]);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const [boldOptions, setBoldOptions] = useState<string[]>([]);
  const version = currentVersionId !== null ? versions.find((version) => version.id === currentVersionId) : null;

  const [optionLevels, setOptionLevels] = useState<{ options: string[]; position: { top: number; left: number } }[]>([]);
  const [buttonchoice, setButtonchoice] = useState('');


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
    const handleClickOutside = (event: MouseEvent) => {
      var clickedOutside = true;
    
      // Check if the click is inside any of the autocomplete widgets
      optionLevels.forEach((_, levelIndex) => {
        const widgetElement = document.getElementById(`classautocomplete-widget-${levelIndex}`);
        if (widgetElement && widgetElement.contains(event.target as Node)) {
          clickedOutside = false;
        }
      });
    
      // Check if the click is inside the generate option widget
      if (widgetRef.current && widgetRef.current.contains(event.target as Node)) {
        clickedOutside = false;
      }
    
      // Check if the click is inside any of the autocomplete widgets
      const autocompleteWidgets = document.querySelectorAll('.classautocomplete-widget');
      autocompleteWidgets.forEach((widget) => {
        if (widget.contains(event.target as Node)) {
          clickedOutside = false;
        }
      });
    
    
      // If the click was outside all widgets, close the others
      if (clickedOutside) {
        console.log('Clicked outside');
        setOptionLevels([]);
        setShowAutocomplete(false);
        setShowGenerateOption(false);
      }
    };
    
    

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  });



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

    const currentVersion = versions.find(version => version.id === currentVersionId);
    if (!currentVersion) {
      console.log('No current version found');
      return;
    }
    
    else if(word != 'modifyobj'&&word != 'useobj'&&word != 'cachedobjects'){
      setHintKeywords(word);
      console.log('hintwordset', word)
      const cursorPosition = editorRef.current?.selectionStart || 0;
      const position = getCaretCoordinates(editorRef.current, cursorPosition - word.length);
      setAutocompletePosition({ top: position.top + 50, left: position.left });
      // const initialOptions = [word]; // You can replace this with an array of initial options if available
      // setOptionLevels([{ options: initialOptions, position }]);
      setShowGenerateOption(true);
    }
  };

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
    console.log('down')
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


  const handleAutocompleteOptionClick = (option: string, hintText: string) => {
    const currentValue = classcode.js;
    const cursorPosition = editorRef.current?.selectionStart || 0;
    const textBeforeCursor = currentValue.slice(0, cursorPosition).replace(new RegExp(`${hintText}$`), '');
    const textAfterCursor = currentValue.slice(cursorPosition + hintText.length);
    const newText = textBeforeCursor + option + textAfterCursor;
    console.log('handleAutocompleteOptionClick, new text', newText)
    setClassCode({js: newText});
    setShowAutocomplete(false);
    setShowGenerateOption(false);
    setOptionLevels([]);
    setButtonchoice('');
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
  
  const ClassGenerateOptionWidget = ({ hintKeywords }: { hintKeywords: string }) => (
    <div
      id="class-generate-option-widget"
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
        <button onClick={() => {console.log('Button clicked'); handleDownGenerate(hintKeywords)}}>🔽</button>
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
      const currentValue = classcode.js;
      const cursorPosition = editorRef.current?.selectionStart || 0;
      const textBeforeCursor = currentValue.slice(0, cursorPosition);
      const textAfterCursor = currentValue.slice(cursorPosition);
      const newText = textBeforeCursor + combinedText + textAfterCursor;
      setClassCode(newText);
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
        id={`classautocomplete-widget-${levelIndex}`}
        className="classautocomplete-widget"
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



  
  

  return (
    <div
      className="class-editor"
      onKeyDown={handleKeyDown}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleRightClick}
    >
      {showGenerateOption && optionLevels.length === 0 && <ClassGenerateOptionWidget hintKeywords={hintKeywords} />}
      {showAutocomplete && optionLevels.map((level, index) => (
        <AutocompleteWidget key={index} options={level.options} levelIndex={index} />
      ))}
      <div
      style={{
        height: '600px',
        width: '400px',
        overflow: 'auto',
      }}
    >
      <CodeEditor
        value={classcode.js}
        language="js"
        padding={15}
        style={{
          fontSize: 15,
          backgroundColor: '#f5f5f5',
          fontFamily:
            'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
        }}
        ref={editorRef}
        onChange={(evn) => setClassCode({ js: evn.target.value })}
      />
      {/* Add Run Button */}
      <button onClick={onRunClassCode}>Run Class Code</button>
    </div>
    </div>
  );
  
};

export default ClassEditor;
