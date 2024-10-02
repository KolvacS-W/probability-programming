import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Version } from '../types';

interface ReusableElementToolbarProps {
  currentVersionId: string | null;
  versions: Version[];
  setVersions: React.Dispatch<React.SetStateAction<Version[]>>;
  hoveredElement: string | null;
  setHoveredElement: React.Dispatch<React.SetStateAction<string | null>>;
}

const ngrok_url = 'https://5c75-34-44-206-208.ngrok-free.app';
const ngrok_url_sonnet = ngrok_url + '/api/message';

const sanitizeSVG = (svgString: string) => {
  return svgString.trim(); // Add more sanitization logic here if needed
};

const ReusableElementToolbar: React.FC<ReusableElementToolbarProps> = ({
  currentVersionId,
  versions,
  setVersions,
  hoveredElement,
  setHoveredElement,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isMouseOver, setIsMouseOver] = useState(false);
  const version = versions.find(version => version.id === currentVersionId);
  const loading = version ? version.loading : false;

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleAddElement = async (versionId: string) => {
    if (!currentVersionId) return; // Ensure currentVersionId is not null
    setVersions(prevVersions => {
      const updatedVersions = prevVersions.map(version =>
        version.id === versionId
          ? { ...version, loading: true }
          : version
      );
      return updatedVersions;
    });
    try {
      const prompt = `read the following code for anime.js animation, and a description, find all the code pieces that is relevant to the elements of that description. 
      The description will be in format of object + feature. There are 3 types of features: shape (html elements), color, and movement (anime.js script). The code pieces need to be precisely related to one or multiple features according to the description.
      Code: ${versions.find(version => version.id === versionId)?.code.html} , description:` + inputValue +`
      Respond to this format and don't include anything else in response:
      object: ......
      feature: ......
      code piece: ...... Only return the features the description is talking about. If there's no code piece for the object + feature of the description, return empty for code piece`;
      console.log('prompt for handleAddElement:', prompt);
      const response = await axios.post(ngrok_url_sonnet, {
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: prompt })
      });

      const data = await response.data;
      const content = data?.content;
      console.log('content from handleAddElement:', content);

      if (content) {
        const newElements = [{
          codeName: inputValue,
          codeText: content,
          selected: false
        }];
  
        setVersions(prevVersions => {
          const updatedVersions = prevVersions.map(version =>
            version.id === currentVersionId
              ? { ...version, reuseableSVGElementList: [...version.reuseableSVGElementList, ...newElements] }
              : version
          );
          return updatedVersions;
        });

        setInputValue(''); // Clear input after adding
      }
    } catch (error) {
      console.error('Error adding reusable element:', error);
    } finally {
      setVersions(prevVersions => {
        const updatedVersions = prevVersions.map(version =>
          version.id === versionId
            ? { ...version, loading: false }
            : version
        );
        return updatedVersions;
      });
    }
  };

  const handleMouseEnter = () => {
    setIsMouseOver(true);
  };

  const handleMouseLeave = () => {
    setIsMouseOver(false);
  };

  const handleElementClick = (versionId: string, codeName: string) => {
    setVersions(prevVersions => {
      const updatedVersions = prevVersions.map(version =>
        version.id === versionId
          ? {
              ...version,
              reuseableSVGElementList: version.reuseableSVGElementList.map(element =>
                element.codeName === codeName
                  ? { ...element, selected: !element.selected }
                  : element
              )
            }
          : version
      );
      return updatedVersions;
    });
  };

  const ReusableElementItem: React.FC<{ codeText: string }> = ({ codeText }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
      const iframe = iframeRef.current;

      if (iframe) {
        const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
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
                    svg {
                      width: 100%;
                      height: 100%;
                    }
                </style>
            </head>
            <body>
                ${sanitizeSVG(codeText)}
            </body>
            </html>
          `);
          iframeDocument.close(); // Ensure the document is closed after writing
        }
      }
    }, [codeText]);

    return (
      <iframe
        ref={iframeRef}
        title="SVG Render"
        style={{
          width: '50px', // Matching the .svg-preview size
          height: '50px',
          border: 'none',
          overflow: 'hidden',
        }}
      />
    );
  };

  return (
    <div
      className={`reusable-element-toolbar ${isMouseOver ? 'expanded' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="reusable-elements">
        <div className="input-group">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Enter element description"
          />
          <button onClick={() => currentVersionId && handleAddElement(currentVersionId)} disabled={loading}>
            {loading ? 'Loading...' : 'Add'}
          </button>
        </div>
        {currentVersionId !== null && versions.find(version => version.id === currentVersionId)!.reuseableSVGElementList.map((element, index) => (
          <div
            key={index}
            className={`reusable-element-item ${element.selected ? 'selected' : ''}`}
            onClick={() => handleElementClick(currentVersionId, element.codeName)}
            onMouseEnter={() => setHoveredElement(element.codeText)}
            onMouseLeave={() => setHoveredElement(null)}
          >
            <span>{element.codeName}</span>
            <div className="svg-preview">
              <ReusableElementItem codeText={element.codeText} />
            </div>
            <button className="delete-icon" onClick={() => handleDeleteReusableElement(currentVersionId, element.codeName)}>🆇</button>
            {hoveredElement === element.codeText && (
              <div className="hovered-element-text">
                <pre>{element.codeText}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReusableElementToolbar;

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
          entry => entry.codeText !== modifiedEntry.codeText
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