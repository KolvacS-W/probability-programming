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
const ngrok_url = 'https://c492-34-74-53-149.ngrok-free.app';
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
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [hintKeywords, setHintKeywords] = useState('');
  const [generatedOptions, setGeneratedOptions] = useState<string[]>([]);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);

  const version = currentVersionId !== null ? versions.find((version) => version.id === currentVersionId) : null;
  const loading = version ? version.loading : false;
  const highlightEnabled = version ? version.highlightEnabled : true;
  const piecesToHighlightLevel1 = version ? version.piecesToHighlightLevel1 : [];
  const piecesToHighlightLevel2 = version ? version.piecesToHighlightLevel2 : [];

  useEffect(() => {
    setbackendHtml(backendcode.html);
    setuserJs(usercode.js);
  }, [usercode, backendcode]);

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

  // const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
  //   if (editorRef.current) {
  //     editorRef.current.scrollTop = e.currentTarget.scrollTop;
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
      setAutocompletePosition({ top: position.top + 50, left: position.left });
      setShowAutocomplete(true);
    }
  };

  const handleRightClick = (event: React.MouseEvent) => {
    event.preventDefault();
    const selection = window.getSelection();
    const word = selection?.toString().trim();
    if (word) {
      setHintKeywords(word);
      const rect = editorRef.current?.getBoundingClientRect();
      if (rect) {
        setAutocompletePosition({ top: event.clientY - rect.top, left: event.clientX - rect.left });
        setShowAutocomplete(true);
      }
    }
  };

  const handleUpGenerate = async (hint: string) => {
    let prompt = '';
    if (hint.includes(' ')) {
      prompt = `Given a text, give me 5 text pieces that are a more abstract and general level of the given text piece.
        The more abstract level of a text can be achieved by removing details, descriptions, and modifiers of the text and making it more generalizable.
        For example, "two parrots with feathers" is 1 level more abstract than "two beautiful parrots with colorful feathers", "two parrots" is 1 level more abstract than "two parrots with feathers"
        Make sure all the 5 text pieces in the response are on the same level, and include nothing but the 5 text pieces separated by '\n' in the response. Given text: ${hint}`;
    } else {
      prompt = `Given a word, give me 5 words that are a more abstract and general level of the given word. 
        The more abstract level of a word can be achieved by finding hypernyms of that word.
        For example, “motor vehicle” is one level more abstract than “car”, “self-propelled vehicle” is one level more abstract than “motor vehicle”, “wheeled vehicle” is one level more abstract than “self-propelled vehicle”; “color” is one level more abstract than “blue”.
        Make sure all 5 words in the response are on the same level; and include nothing but the 5 words separated by '\n' in the response. Given word: ${hint}`;
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
        setGeneratedOptions(options);
      }
    } catch (error) {
      console.error('Error processing request:', error);
    }
  };

  const handleRightGenerate = async (hint: string) => {
    const prompt = `Given a text, give me 5 text pieces that are a variation of the given text piece.
      The variation text should generally be the same as the original text, with various different details, descriptions, categories, and modifiers of the text to make it somewhat different.
      For example "A white passenger plane with two wings and a tail flying across a clear blue sky with fluffy white clouds." and "A small, red biplane with a propeller in the front gliding through the sky dotted with wispy, gray clouds." are both variations of "A large, commercial airliner with multiple engines and a rounded body cruising through the expansive blue sky filled with puffy, cumulus clouds." 
      Make sure all the 5 text pieces in the response are on the same level, and include nothing but the 5 text pieces separated by '\n' in the response. Given text: ${hint}`;

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
        setGeneratedOptions(options);
      }
    } catch (error) {
      console.error('Error processing request:', error);
    }
  };

  const handleDownGenerate = async (hint: string) => {
    let prompt = '';
    if (hint.includes(' ')) {
      prompt = `Given a text, give me 5 text pieces that are 1 level more specific than the given text piece.
        The more specific level of a text can be achieved by adding details, descriptions, categories, and modifiers of the text and making it more specific.
        For example, "two beautiful parrots with colorful feathers" is 1 level more specific than "two parrots with feathers", "two parrots with features" is 1 level more specific than "two parrots"
        Make sure all the 5 text pieces in the response are on the same level, and include nothing but the 5 text pieces separated by '\n' in the response. Given text: ${hint}`;
    } else {
      prompt = `Given a word, give me 5 words that are 1 level more specific than the given word. 
        The more specific level of a word can be achieved by finding hyponyms of that word.
        For example, “car” is one level more specific than “motor vehicle”, “motor vehicle” is one level more specific than self-propelled vehicle”, “self-propelled vehicle” is one level more specific than “wheeled vehicle”; "blue" is one level more specific than "color".
        Make sure all 5 words in the response are on the same level; and include nothing but the 5 words separated by '\n' in the response. Given word: ${hint}`;
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
        setGeneratedOptions(options);
      }
    } catch (error) {
      console.error('Error processing request:', error);
    }
  };

  const handleAutocompleteOptionClick = (option: string, hintText: string) => {
    const currentValue = userjs;
    const cursorPosition = editorRef.current?.selectionStart || 0;
    const textBeforeCursor = currentValue.slice(0, cursorPosition).replace(new RegExp(`${hintText}$`), '');
    const textAfterCursor = currentValue.slice(cursorPosition + hintText.length);
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
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
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
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
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

    {showAutocomplete && <AutocompleteWidget />}
    {renderEditor()}
    <div className="button-group">
      <button className="blue-button" onClick={() => handleRun(currentVersionId || '')}>
        Run
      </button>
      <button
        className="green-button"
        onClick={() =>
          setVersions((prevVersions) => {
            const updatedVersions = prevVersions.map((version) =>
              version.id === currentVersionId ? { ...version, highlightEnabled: !highlightEnabled } : version
            );
            return updatedVersions;
          })
        }
      >
        {highlightEnabled ? 'Disable Highlight' : 'Enable Highlight'}
      </button>
      {/* <button className="tab-button" onClick={() => setActiveTab(activeTab === 'js' ? 'html' : 'js')}>
        Switch to {activeTab === 'js' ? 'Backend HTML' : 'User JS'}
      </button> */}
    </div>
  </div>
  
  );
};

export default CustomCodeEditor;
